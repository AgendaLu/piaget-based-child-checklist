// ─────────────────────────────────────────
// js/share.js
// 分享追蹤進度：把目前狀態壓縮編碼進網址 hash（#s=…），
// 開啟連結時驗證校驗碼、與本地資料比對後匯入或合併。
//
// Payload 格式 v1（JSON）：
//   v  格式版本（1）
//   t  分享建立時間戳（epoch 秒）
//   n  寶寶姓名
//   b  出生日期 YYYY-MM-DD
//   c  勾選紀錄 { 里程碑idx: { 項目key: [狀態字元, 出生後天數] } }
//   h  SHA-256 校驗碼（前 12 bytes base64url）：涵蓋 v/t/n/b/c，
//      解碼時重新計算比對，t/n/b/c 任一被修改即拒絕匯入
//
// hash 形式：#s=<flag>.<base64url>
//   flag 1 = deflate-raw 壓縮；0 = 未壓縮（舊瀏覽器退路）
// 使用 # 而非 ?：hash 不會送到伺服器，維持「不上傳伺服器」承諾
// ─────────────────────────────────────────
import { MILESTONES } from './milestones.js';
import { initApp, normState } from './app.js';

const STATE_TO_CHAR = { ahead: 'a', ontime: 'o', delayed: 'd', normal: 'n', retro: 'r', intermediate: 'i' };
const CHAR_TO_STATE = Object.fromEntries(Object.entries(STATE_TO_CHAR).map(([k, v]) => [v, k]));
const DAY_MS = 86400000;

// ── base64url ↔ bytes ────────────────────
function b64urlEncode(bytes) {
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, ch => ch.charCodeAt(0));
}

// ── 壓縮 / 解壓（瀏覽器原生 Compression Streams）──
async function pipeBytes(bytes, TransformCtor) {
  const stream = new Blob([bytes]).stream().pipeThrough(new TransformCtor('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ── 校驗碼：canonical JSON → SHA-256 → 前 12 bytes ──
function canonical(p) {
  return JSON.stringify({ v: p.v, t: p.t, n: p.n, b: p.b, c: p.c });
}
async function checksum(p) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(p)));
  return b64urlEncode(new Uint8Array(digest).slice(0, 12));
}

// ─────────────────────────────────────────
// 編碼端：localStorage → 分享網址
// ─────────────────────────────────────────
function collectChecks() {
  const birth = new Date(localStorage.getItem('baby_dob'));
  const c = {};
  MILESTONES.forEach((_, idx) => {
    const saved = JSON.parse(localStorage.getItem(`checks_${idx}`) || '{}');
    const out = {};
    Object.entries(saved).forEach(([key, item]) => {
      if (!normState(item)) return;
      const state = typeof item === 'object' ? item.state : item;
      const ch = STATE_TO_CHAR[state];
      if (!ch) return;
      const date = typeof item === 'object' ? item.date : null;
      // 日期存成「出生後第幾天」的整數，比 ISO 字串省一半以上空間
      out[key] = date ? [ch, Math.round((new Date(date) - birth) / DAY_MS)] : [ch];
    });
    if (Object.keys(out).length) c[idx] = out;
  });
  return c;
}

export async function buildShareUrl() {
  const n = localStorage.getItem('baby_name');
  const b = localStorage.getItem('baby_dob');
  if (!n || !b) return null;
  const payload = { v: 1, t: Math.floor(Date.now() / 1000), n, b, c: collectChecks() };
  payload.h = await checksum(payload);

  const json = new TextEncoder().encode(JSON.stringify(payload));
  let flag = '0';
  let bytes = json;
  if (typeof CompressionStream !== 'undefined') {
    try {
      bytes = await pipeBytes(json, CompressionStream);
      flag = '1';
    } catch { bytes = json; }
  }
  return `${location.origin}${location.pathname}#s=${flag}.${b64urlEncode(bytes)}`;
}

export async function shareProgress() {
  if (!window.isSecureContext || !crypto.subtle) {
    openDialog({
      title: '無法建立分享連結',
      bodyHTML: '<p>產生校驗碼需要安全連線（HTTPS 或 localhost），請改用 HTTPS 開啟本頁。</p>',
      buttons: [{ label: '關閉', kind: 'secondary' }],
    });
    return;
  }
  const url = await buildShareUrl();
  if (!url) { alert('請先填寫寶寶的名字與出生日期'); return; }

  const name = localStorage.getItem('baby_name');
  if (navigator.share) {
    try {
      await navigator.share({ title: '寶寶發展追蹤', text: `${name} 的發展追蹤記錄`, url });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;  // 使用者取消分享面板
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('分享連結已複製，貼給另一台裝置或另一位家長即可');
  } catch {
    // 剪貼簿也不可用時，最後退路：讓使用者手動複製
    prompt('請手動複製分享連結：', url);
  }
}

// ─────────────────────────────────────────
// 解碼端：分享網址 → 驗證 → 比對 → 匯入
// ─────────────────────────────────────────
async function decodeShareHash(hashValue) {
  const dot = hashValue.indexOf('.');
  if (dot < 1) throw new Error('bad-format');
  const flag = hashValue.slice(0, dot);
  let bytes;
  try {
    bytes = b64urlDecode(hashValue.slice(dot + 1));
  } catch { throw new Error('bad-format'); }

  if (flag === '1') {
    if (typeof DecompressionStream === 'undefined') throw new Error('no-decompress');
    try {
      bytes = await pipeBytes(bytes, DecompressionStream);
    } catch { throw new Error('bad-format'); }
  } else if (flag !== '0') {
    throw new Error('bad-format');
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(bytes));
  } catch { throw new Error('bad-format'); }

  if (payload.v !== 1) throw new Error('bad-version');
  if (!Number.isFinite(payload.t) || typeof payload.n !== 'string' || !payload.n ||
      !/^\d{4}-\d{2}-\d{2}$/.test(payload.b || '') ||
      typeof payload.c !== 'object' || payload.c === null || typeof payload.h !== 'string') {
    throw new Error('bad-format');
  }
  if (payload.h !== await checksum(payload)) throw new Error('tampered');
  return payload;
}

function payloadToChecks(payload) {
  const birth = new Date(payload.b);
  const result = {};
  Object.entries(payload.c).forEach(([idx, items]) => {
    if (!/^\d+$/.test(idx) || Number(idx) >= MILESTONES.length) return;
    const out = {};
    Object.entries(items).forEach(([key, arr]) => {
      if (!Array.isArray(arr)) return;
      const state = CHAR_TO_STATE[arr[0]];
      if (!state) return;
      const rec = { state };
      if (Number.isFinite(arr[1])) {
        rec.date = new Date(birth.getTime() + arr[1] * DAY_MS).toISOString().split('T')[0];
      }
      out[key] = rec;
    });
    if (Object.keys(out).length) result[idx] = out;
  });
  return result;
}

// 合併規則：兩邊都有的項目保留達成日期較早者（先達成的才是事實）；
// 只有一邊有記錄就直接採用。無日期的記錄視為較舊（保留本地）。
function mergeChecks(localSaved, incomingItems) {
  const merged = { ...incomingItems };
  Object.entries(localSaved).forEach(([key, localItem]) => {
    if (!normState(localItem)) return;
    const inc = merged[key];
    const localDate = typeof localItem === 'object' ? localItem.date : null;
    if (!inc || !inc.date || (localDate && localDate <= inc.date)) {
      merged[key] = localItem;
    }
  });
  return merged;
}

function applyImport(payload, mode) {
  const incoming = payloadToChecks(payload);
  if (mode === 'overwrite') {
    MILESTONES.forEach((_, idx) => localStorage.removeItem(`checks_${idx}`));
    localStorage.setItem('baby_name', payload.n);
    localStorage.setItem('baby_dob', payload.b);
    Object.entries(incoming).forEach(([idx, items]) => {
      localStorage.setItem(`checks_${idx}`, JSON.stringify(items));
    });
  } else {
    // merge：只在姓名與出生日期一致時提供，個人資料維持本地
    MILESTONES.forEach((_, idx) => {
      const localSaved = JSON.parse(localStorage.getItem(`checks_${idx}`) || '{}');
      const merged = mergeChecks(localSaved, incoming[idx] || {});
      if (Object.keys(merged).length) {
        localStorage.setItem(`checks_${idx}`, JSON.stringify(merged));
      }
    });
  }
  localStorage.setItem('last_import_t', String(payload.t));
  localStorage.setItem('data_ts', String(Date.now()));
}

// ─────────────────────────────────────────
// 開啟時比對：版本時間戳、寶寶姓名、出生日期 vs 本地
// ─────────────────────────────────────────
const fmtTime = (epochMs) => new Date(epochMs).toLocaleString('zh-TW', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});
const esc = (s) => String(s).replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function clearShareHash() {
  history.replaceState(null, '', location.pathname + location.search);
}

export async function handleIncomingShare() {
  const m = location.hash.match(/^#s=(.+)$/);
  if (!m) return;

  let payload;
  try {
    payload = await decodeShareHash(m[1]);
  } catch (err) {
    clearShareHash();
    const msg = err.message === 'tampered'
      ? '連結內容與校驗碼不符，可能已遭修改或傳輸中損毀。為保護記錄正確性，未匯入任何資料。'
      : err.message === 'bad-version'
        ? '這個分享連結來自較新版本的應用程式，請先更新後再開啟。'
        : err.message === 'no-decompress'
          ? '瀏覽器版本過舊，無法解讀這個分享連結，請更新瀏覽器後再試。'
          : '分享連結格式不正確或已不完整，請請對方重新分享一次。';
    openDialog({ title: '無法匯入分享內容', bodyHTML: `<p>${msg}</p>`, buttons: [{ label: '關閉', kind: 'secondary' }] });
    return;
  }

  const localName = localStorage.getItem('baby_name');
  const localDob  = localStorage.getItem('baby_dob');
  const dataTs    = Number(localStorage.getItem('data_ts') || 0);
  const lastImportT = Number(localStorage.getItem('last_import_t') || 0);
  const count = Object.values(payload.c).reduce((s, items) => s + Object.keys(items).length, 0);

  const infoRows = `
    <div class="share-info">
      <div><span>寶寶</span><strong>${esc(payload.n)}</strong></div>
      <div><span>出生日期</span><strong>${esc(payload.b)}</strong></div>
      <div><span>勾選記錄</span><strong>${count} 筆</strong></div>
      <div><span>分享建立於</span><strong>${fmtTime(payload.t * 1000)}</strong></div>
    </div>`;

  const finish = (mode, doneMsg) => {
    applyImport(payload, mode);
    clearShareHash();
    closeDialog();
    initApp();
    showToast(doneMsg);
  };

  if (!localName || !localDob) {
    // 本地沒有任何資料：直接匯入
    openDialog({
      title: '收到分享的追蹤記錄',
      bodyHTML: `${infoRows}<p>匯入後即可在這台裝置繼續記錄。</p>`,
      buttons: [
        { label: '匯入', kind: 'primary', onClick: () => finish('overwrite', '已匯入分享的追蹤記錄') },
        { label: '取消', kind: 'secondary', onClick: () => { clearShareHash(); closeDialog(); } },
      ],
    });
    return;
  }

  if (localName !== payload.n || localDob !== payload.b) {
    // 姓名或出生日期與本地不同：視為不同寶寶，警告後只允許整份覆蓋
    openDialog({
      title: '分享的寶寶與本地不同',
      bodyHTML: `${infoRows}
        <p class="share-warn">這台裝置目前追蹤的是「${esc(localName)}（${esc(localDob)}）」。
        覆蓋後本地的勾選記錄將全部被取代，且無法復原。</p>`,
      buttons: [
        { label: '覆蓋本地資料', kind: 'danger', onClick: () => finish('overwrite', '已覆蓋為分享的追蹤記錄') },
        { label: '取消', kind: 'primary', onClick: () => { clearShareHash(); closeDialog(); } },
      ],
    });
    return;
  }

  // 同一個寶寶：比對時間戳，預設合併
  const notes = [];
  if (payload.t <= lastImportT) {
    notes.push('這份分享先前已匯入過（或比上次匯入的更舊）。');
  }
  if (dataTs && payload.t * 1000 < dataTs) {
    notes.push(`本地記錄最後更新於 ${fmtTime(dataTs)}，比這份分享新，建議選「合併」保留兩邊記錄。`);
  }
  openDialog({
    title: '收到同一個寶寶的分享',
    bodyHTML: `${infoRows}
      ${notes.length ? `<p class="share-warn">${notes.join('<br>')}</p>` : ''}
      <p>「合併」會保留兩邊的記錄，同一項以達成日期較早者為準；「覆蓋」則整份取代本地記錄。</p>`,
    buttons: [
      { label: '合併（建議）', kind: 'primary', onClick: () => finish('merge', '已合併分享的追蹤記錄') },
      { label: '覆蓋', kind: 'danger', onClick: () => finish('overwrite', '已覆蓋為分享的追蹤記錄') },
      { label: '取消', kind: 'secondary', onClick: () => { clearShareHash(); closeDialog(); } },
    ],
  });
}

// ─────────────────────────────────────────
// Dialog / Toast
// ─────────────────────────────────────────
function openDialog({ title, bodyHTML, buttons }) {
  document.getElementById('share-modal-title').textContent = title;
  document.getElementById('share-modal-body').innerHTML = bodyHTML;

  const actions = document.getElementById('share-modal-actions');
  actions.innerHTML = '';
  buttons.forEach(({ label, kind, onClick }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `share-btn share-btn-${kind}`;
    btn.textContent = label;
    btn.addEventListener('click', onClick || closeDialog);
    actions.appendChild(btn);
  });

  document.getElementById('share-modal-overlay').classList.remove('hidden');
  document.getElementById('share-modal').classList.remove('hidden');
}

function closeDialog() {
  document.getElementById('share-modal-overlay').classList.add('hidden');
  document.getElementById('share-modal').classList.add('hidden');
}

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('share-toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 4000);
}

// ─────────────────────────────────────────
// 掛載與進入點
// ─────────────────────────────────────────
window.shareProgress = shareProgress;

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', handleIncomingShare);
} else {
  handleIncomingShare();
}
