// ─────────────────────────────────────────
// js/app.js
// 主應用邏輯：初始化、月齡計算、
// 時間軸渲染、任務卡渲染
// ─────────────────────────────────────────
import { MILESTONES, DOMAIN_META } from './milestones.js';
import { PIAGET_KEY_MAP, PIAGET_DATA } from './piaget.js';
import { openPiagetModal } from './drawer.js';
import { PERCENTILE_DATA, getPercentilePosition, getPositionLabel } from './percentile-distribution.js';
import { D3Timeline } from './timeline.js';

// ── 狀態 ──────────────────────────────────
export let currentMilestoneIndex = 0;  // drawer.js 也需要讀取
let timelineOpen = false;
let pastMilestonesOpen = false;
let d3Timeline = null;  // D3Timeline 實例

// ── localStorage 鍵名 ─────────────────────
// checks_{idx}  → { "gross_0": { state: "normal"|"retro"|"intermediate"|false, date: "2024-01-15" }, ... }
// 狀態值：false = 未勾選，"normal" = 按時完成，"retro" = 事後補填，"intermediate" = 超時補填（延遲）
// 新增date欄位以判斷是否超過時間範圍

// ─────────────────────────────────────────
// 工具函式
// ─────────────────────────────────────────
export function calcAge(birthDate) {
  const now        = new Date();
  const birth      = new Date(birthDate);
  const totalDays  = Math.floor((now - birth) / 86400000);
  const months     = Math.floor(totalDays / 30.44);
  const remainDays = totalDays - Math.floor(months * 30.44);
  const weeks      = Math.floor(remainDays / 7);
  return { months, weeks, totalDays };
}

export function getMilestoneIndex(months) {
  for (let i = 0; i < MILESTONES.length; i++) {
    if (months >= MILESTONES[i].monthStart && months < MILESTONES[i].monthEnd) return i;
  }
  return MILESTONES.length - 1;
}

// 判斷打勾日期是否超過該里程碑的預期時間範圍
export function isCheckOutOfRange(birthDate, milestoneIdx, checkDate) {
  const birth = new Date(birthDate);
  const check = new Date(checkDate);
  const milestone = MILESTONES[milestoneIdx];

  // 計算寶寶在check date時的月齡
  const ageAtCheck = calcAge(birthDate);
  const checkAtTime = new Date(check);

  // 如果打勾時間是在未來，不計算
  if (checkAtTime > new Date()) return false;

  // 計算該里程碑的結束時間（以當時出生日期 + monthEnd個月）
  const milestoneEndDate = new Date(birth);
  milestoneEndDate.setMonth(milestoneEndDate.getMonth() + milestone.monthEnd);

  // 如果打勾時間超過里程碑結束時間，表示是延遲的
  return checkAtTime > milestoneEndDate;
}

// ─────────────────────────────────────────
// Setup screen
// ─────────────────────────────────────────
export function saveAndStart() {
  const name = document.getElementById('baby-name-input').value.trim();
  const dob  = document.getElementById('birth-date-input').value;
  if (!name || !dob) { alert('請填寫寶寶的名字與出生日期'); return; }
  localStorage.setItem('baby_name', name);
  localStorage.setItem('baby_dob',  dob);
  initApp();
}

export function changeProfile() {
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('setup-screen').classList.remove('hidden');
}

// ─────────────────────────────────────────
// 初始化
// ─────────────────────────────────────────
export function initApp() {
  const name = localStorage.getItem('baby_name');
  const dob  = localStorage.getItem('baby_dob');
  if (!name || !dob) return;

  const age  = calcAge(dob);
  const idx  = getMilestoneIndex(age.months);
  currentMilestoneIndex = idx;

  const milestone = MILESTONES[idx];

  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');

  // Topbar
  document.getElementById('display-name').textContent       = name;
  document.getElementById('display-age').textContent        = `${age.months}m ${age.weeks}w`;
  document.getElementById('display-age-exact').textContent  = `${age.months}個月 ${age.weeks}週`;

  // Progress strip
  const pct = Math.min(100, (age.months / 24) * 100);
  document.getElementById('progress-fill').style.width  = pct + '%';
  document.getElementById('current-stage-label').textContent = milestone.stageLabel;

  const next = MILESTONES[Math.min(idx + 1, MILESTONES.length - 1)];
  const daysToNext = Math.max(0, Math.floor(next.monthStart * 30.44 - age.totalDays));
  document.getElementById('progress-desc').textContent =
    idx < MILESTONES.length - 1
      ? `距離下一個發展階段（${next.label}）還有 ${daysToNext} 天`
      : '已達24個月追蹤完成，請繼續觀察幼兒發展';

  // Alert
  const alertEl = document.getElementById('alert-strip');
  if (milestone.alert) {
    alertEl.textContent = '⚠️ ' + milestone.alert;
    alertEl.classList.add('visible');
  } else {
    alertEl.classList.remove('visible');
  }

  // Piaget trigger desc
  const pd = PIAGET_DATA[PIAGET_KEY_MAP[idx]];
  document.getElementById('piaget-trigger-desc').textContent =
    `${pd.piagetStage} · ${pd.piagetSub}`;

  renderTimeline(idx);
  renderTodoCard(idx, age, 'current');
  renderUpcoming(idx);
  renderPast(idx);
}

// ─────────────────────────────────────────
// Timeline - D3 實現
// ─────────────────────────────────────────
function renderTimeline(currentIdx) {
  // 初始化或更新 D3 時間軸
  if (!d3Timeline) {
    d3Timeline = new D3Timeline('d3-timeline-container', MILESTONES, currentIdx, {
      onNodeClick: onTimelineNodeClick
    });
  } else {
    d3Timeline.update(currentIdx);
  }
}

function onTimelineNodeClick(idx) {
  const type = idx < currentMilestoneIndex ? 'past'
             : idx === currentMilestoneIndex ? 'current'
             : 'future';

  const age = calcAge(localStorage.getItem('baby_dob'));

  // 更新節點 active 狀態
  document.querySelectorAll('.tl-node').forEach((n, i) => {
    n.classList.toggle('active', i === idx);
  });

  renderTodoCard(idx, age, type);

  // 如果是目前節點，scroll 到任務卡
  if (type === 'current') {
    document.getElementById('todo-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function toggleTimeline() {
  timelineOpen = !timelineOpen;
  const expanded  = document.getElementById('tl-expanded');
  const expandBtn = document.getElementById('tl-expand-btn');

  if (timelineOpen) {
    expanded?.classList.remove('hidden');
  } else {
    expanded?.classList.add('hidden');
  }

  const label = document.getElementById('tl-expand-label');
  if (label) label.textContent = timelineOpen ? '收合時間軸' : '展開時間軸';

  if (timelineOpen) {
    // scroll 至目前節點置中
    setTimeout(() => {
      const scroll  = document.getElementById('tl-scroll');
      const nodes   = document.getElementById('tl-nodes');
      const current = nodes?.children[currentMilestoneIndex];
      if (scroll && current) {
        const left = current.offsetLeft - scroll.offsetWidth / 2 + current.offsetWidth / 2;
        scroll.scrollTo({ left, behavior: 'smooth' });
      }
    }, 60);
  }
}

// ─────────────────────────────────────────
// 百分位條渲染（粗動作 Phase 1）
// 支援里程碑級別的時間軸對齐（同一卡片內垂直對齐）
// ─────────────────────────────────────────

/**
 * 計算單一里程碑所有粗動作項目的時間軸範圍
 * @param {number}  idx - 里程碑索引
 * @returns {object} { minMonth, maxMonth }
 */
function computeMilestonePercentileRange(idx, domain = 'gross') {
  let milestoneMin = Infinity;
  let milestoneMax = -Infinity;

  Object.entries(PERCENTILE_DATA).forEach(([key, data]) => {
    if (key.startsWith(`${idx}_${domain}_`)) {
      milestoneMin = Math.min(milestoneMin, data.p10);
      milestoneMax = Math.max(milestoneMax, data.p90);
    }
  });

  // 如果沒找到任何資料，回傳安全預設值
  if (!isFinite(milestoneMin) || !isFinite(milestoneMax)) {
    return { minMonth: 0, maxMonth: 24 };
  }

  return { minMonth: milestoneMin, maxMonth: milestoneMax };
}

/**
 * 為單一項目建立百分位視覺條
 * @param {string}  pctKey           - `{milestoneIdx}_gross_{itemIdx}`
 * @param {number}  ageExact         - 寶寶精確月齡（小數）
 * @param {object}  milestoneRange   - { minMonth, maxMonth } 里程碑參考範圍（里程碑級對齐）
 * @returns {HTMLElement|null}
 */
function renderPercentileBar(pctKey, ageExact, milestoneRange = null) {
  const data = PERCENTILE_DATA[pctKey];
  if (!data) return null;

  const pos = getPercentilePosition(pctKey, ageExact);

  // ── 使用里程碑時間軸範圍或計算項目局部範圍
  let minM, maxM;
  if (milestoneRange) {
    // 使用里程碑範圍（同一卡片內所有項目共用），加 buffer 以騰出標籤空間
    const span = milestoneRange.maxMonth - milestoneRange.minMonth;
    const buffer = Math.max(span * 0.12, 0.5);
    minM = Math.max(0, milestoneRange.minMonth - buffer);
    maxM = milestoneRange.maxMonth + buffer;
  } else {
    // 項目級計算（向後相容性）
    const span = data.p90 - data.p10;
    const buffer = Math.max(span * 0.18, 0.5);
    minM = Math.max(0, data.p10 - buffer);
    maxM = data.p90 + buffer;
  }

  const total = maxM - minM;
  const pct = (m) => ((m - minM) / total * 100).toFixed(2);

  const p10L = pct(data.p10);
  const p25L = pct(data.p25);
  const p50L = pct(data.p50);
  const p75L = pct(data.p75);
  const p90L = pct(data.p90);

  // 寶寶月齡對應位置（允許稍微超出兩端）
  const babyRaw = (ageExact - minM) / total * 100;
  const babyL   = Math.max(0.5, Math.min(99.5, babyRaw)).toFixed(2);

  const outerW  = (parseFloat(p90L) - parseFloat(p10L)).toFixed(2);
  const innerW  = (parseFloat(p75L) - parseFloat(p25L)).toFixed(2);

  // 圓點顏色：超前→綠色系，正常→藍色，落後→橙/紅
  const DOT_COLORS = {
    'far-ahead':       'oklch(52% 0.20 160)',   // 鮮綠：顯著超前
    'ahead':           'oklch(62% 0.25 142)',   // 草綠：超前
    'slightly-ahead':  'oklch(64% 0.18 162)',   // 黃綠：稍超前
    'normal':          'oklch(55% 0.18 262)',   // 藍色：正常
    'slightly-behind': 'oklch(68% 0.18 65)',    // 琥珀：稍落後
    'behind':          'oklch(60% 0.18 28)',    // 橙紅：需關注
  };
  const dotColor = pos ? DOT_COLORS[pos.position] : 'oklch(70% 0.02 280)';
  const label    = pos ? getPositionLabel(pos.position) : '';

  const wrap = document.createElement('div');
  wrap.className = 'pct-bar-wrap';
  wrap.setAttribute('title', `寶寶 ${ageExact.toFixed(1)} 個月 · ${label}`);

  // 標籤位置邏輯：避免重疊，只在空間充足時顯示
  // P10 左对齐，P50 居中，P90 右对齐
  const labelHTML = `
    <div class="pct-label" style="left:${p10L}%;text-align:left">P10</div>
    <div class="pct-label" style="left:${p50L}%;text-align:center;transform:translateX(-50%)">P50</div>
    <div class="pct-label" style="left:${p90L}%;text-align:right;transform:translateX(-100%)">P90</div>
  `;

  wrap.innerHTML = `
    <div class="pct-track-area">
      <div class="pct-rail"></div>
      <div class="pct-zone-outer" style="left:${p10L}%;width:${outerW}%"></div>
      <div class="pct-zone-inner" style="left:${p25L}%;width:${innerW}%"></div>
      <div class="pct-median"     style="left:${p50L}%"></div>
      <div class="pct-baby-dot"   style="left:${babyL}%;background:${dotColor}"></div>
      <div class="pct-labels-row">
        ${labelHTML}
      </div>
    </div>
  `;

  return wrap;
}

// ─────────────────────────────────────────
// 任務卡渲染（支援 current / past / future）
// ─────────────────────────────────────────
export function renderTodoCard(idx, age, type) {
  const milestone = MILESTONES[idx];
  const card = document.getElementById('todo-card');
  if (!card) return;

  // 任務卡上緣色條（保留 Tailwind 佈局 class，避免 dark mode 失去背景）
  card.className = `todo-card bg-surface rounded-lg shadow-sm p-6 mb-8 fade-in is-${type}`;

  // 標題列
  document.getElementById('todo-title').textContent =
    `${milestone.stageLabel} 發展任務`;

  const subtitleEl = document.getElementById('todo-subtitle');
  if (type === 'current') {
    subtitleEl.textContent =
      `根據寶寶目前 ${age.months} 個月 ${age.weeks} 週的月齡，以下是各領域的觀察重點與促進任務。`;
  } else if (type === 'past') {
    subtitleEl.textContent = '此為已完成的階段。可補填當時觀察到但未記錄的項目。';
  } else {
    subtitleEl.textContent = '預覽模式 — 此階段任務尚未開始觀察，項目不可勾選。';
  }

  // 勾選資料
  const checkKey = `checks_${idx}`;
  const saved    = JSON.parse(localStorage.getItem(checkKey) || '{}');

  // 領域列表
  const container = document.getElementById('todo-domains');
  container.innerHTML = '';

  Object.entries(milestone.domains).forEach(([key, items]) => {
    const meta    = DOMAIN_META[key];
    const section = document.createElement('div');
    section.className = 'domain-section';
    section.innerHTML = `
      <div class="domain-label">
        <div class="domain-pip" style="background:${meta.color}"></div>
        ${meta.emoji} ${meta.label}
      </div>`;

    items.forEach((text, i) => {
      const itemKey   = `${key}_${i}`;
      const itemData = saved[itemKey] || false;
      // 相容舊的字串格式和新的物件格式
      const itemState = itemData === false ? false : (typeof itemData === 'object' ? itemData.state : itemData);

      const item = document.createElement('div');

      if (type === 'future') {
        // 未來：顯示但鎖定
        item.className = 'todo-item locked';
        item.innerHTML = `<div class="todo-checkbox"></div><div class="todo-text">${text}</div>`;
      } else {
        // current 或 past
        let itemClass = 'todo-item';
        if (itemState === 'normal') itemClass += ' done-normal';
        if (itemState === 'retro')  itemClass += ' done-retro';
        if (itemState === 'intermediate') itemClass += ' done-intermediate';
        item.className = itemClass;
        item.innerHTML = `<div class="todo-checkbox"></div><div class="todo-text">${text}</div>`;

        item.addEventListener('click', () => {
          const cur = JSON.parse(localStorage.getItem(checkKey) || '{}');
          const itemData = cur[itemKey] || false;
          const currentState = itemData === false ? false : (typeof itemData === 'object' ? itemData.state : itemData);
          const today = new Date().toISOString().split('T')[0];

          // 判斷下一個狀態
          let next;
          if (type === 'current') {
            // current 階段：false ↔ normal
            next = currentState === 'normal' ? false : { state: 'normal', date: today };
          } else {
            // past 階段：false → retro → intermediate/normal → false
            if (currentState === false) {
              next = { state: 'retro', date: today };
            } else if (currentState === 'retro') {
              // 從 retro 轉換，需檢查是否應該變成 intermediate
              const isOutOfRange = isCheckOutOfRange(localStorage.getItem('baby_dob'), idx, today);
              next = { state: isOutOfRange ? 'intermediate' : 'normal', date: today };
            } else {
              // 其他狀態 → false（取消勾選）
              next = false;
            }
          }

          cur[itemKey] = next;
          localStorage.setItem(checkKey, JSON.stringify(cur));

          // 更新 class
          item.classList.remove('done-normal', 'done-retro', 'done-intermediate');
          if (typeof next === 'object') {
            if (next.state === 'normal') item.classList.add('done-normal');
            else if (next.state === 'retro') item.classList.add('done-retro');
            else if (next.state === 'intermediate') item.classList.add('done-intermediate');
          }

          // 更新時間軸節點的 state
          renderTimeline(currentMilestoneIndex);
        });
      }

      section.appendChild(item);

      // ── 百分位條（粗動作 + 精細動作，非預覽）
      if ((key === 'gross' || key === 'fine') && type !== 'future') {
        const pctKey  = `${idx}_${key}_${i}`;
        const ageExact = age.totalDays / 30.44;
        // 使用里程碑範圍確保同一領域內時間軸對齐（避免浪費空間）
        const milestoneRange = computeMilestonePercentileRange(idx, key);
        const barEl   = renderPercentileBar(pctKey, ageExact, milestoneRange);
        if (barEl) section.appendChild(barEl);
      }
    });

    container.appendChild(section);
  });

  // 達成率（past 顯示）
  const existingAchv = card.querySelector('.achievement-bar');
  if (existingAchv) existingAchv.remove();
  const existingRetroNote = card.querySelector('.retro-note');
  if (existingRetroNote) existingRetroNote.remove();
  const existingFutureNote = card.querySelector('.future-note');
  if (existingFutureNote) existingFutureNote.remove();

  if (type === 'past') {
    const allItems    = Object.values(milestone.domains).flat();
    const total       = allItems.length;

    // 相容舊格式和新格式
    const normalCount = Object.values(saved).filter(v => {
      const state = typeof v === 'object' ? v.state : v;
      return state === 'normal';
    }).length;
    const retroCount = Object.values(saved).filter(v => {
      const state = typeof v === 'object' ? v.state : v;
      return state === 'retro';
    }).length;
    const intermediateCount = Object.values(saved).filter(v => {
      const state = typeof v === 'object' ? v.state : v;
      return state === 'intermediate';
    }).length;

    const doneCount   = normalCount + retroCount + intermediateCount;
    const pct         = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const hasIntermediate = intermediateCount > 0;
    const hasRetro    = retroCount > 0;
    const fillClass   = hasIntermediate ? 'fill-intermediate' : (hasRetro ? 'fill-retro' : 'fill-normal');
    const pctClass    = hasIntermediate ? 'has-intermediate' : (hasRetro ? 'has-retro' : 'all-normal');

    const achvBar = document.createElement('div');
    achvBar.className = 'achievement-bar';
    achvBar.innerHTML = `
      <span>達成率</span>
      <div class="achievement-track">
        <div class="achievement-fill ${fillClass}" style="width:${pct}%"></div>
      </div>
      <span class="achievement-pct ${pctClass}">${pct}%</span>
    `;
    container.after(achvBar);

    if (hasRetro || hasIntermediate) {
      const note = document.createElement('div');
      note.className = 'retro-note';
      let text = '';
      if (retroCount > 0) text += `${retroCount} 項事後補填`;
      if (retroCount > 0 && intermediateCount > 0) text += '、';
      if (intermediateCount > 0) text += `${intermediateCount} 項延遲記錄`;
      note.textContent = `其中 ${text}`;
      achvBar.after(note);
    }
  }

  if (type === 'future') {
    const note = document.createElement('div');
    note.className = 'future-note';
    note.textContent = '到達此月齡後，任務將自動開放記錄';
    container.after(note);
  }

  // Piaget trigger（future 不顯示）
  const triggerWrap = card.querySelector('.piaget-trigger-wrap');
  if (triggerWrap) {
    triggerWrap.style.display = type === 'future' ? 'none' : '';
    if (type !== 'future') {
      const pd = PIAGET_DATA[PIAGET_KEY_MAP[idx]];
      const descEl = card.querySelector('#piaget-trigger-desc');
      if (descEl) descEl.textContent = `${pd.piagetStage} · ${pd.piagetSub}`;
    }
  }
}

// ─────────────────────────────────────────
// Upcoming grid
// ─────────────────────────────────────────
function renderUpcoming(currentIdx) {
  const grid = document.getElementById('upcoming-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const nextOnes = MILESTONES.slice(currentIdx + 1, currentIdx + 4);
  if (!nextOnes.length) {
    const title = document.getElementById('upcoming-title');
    if (title) title.style.display = 'none';
    return;
  }

  nextOnes.forEach(m => {
    const card       = document.createElement('div');
    card.className   = 'upcoming-card';
    const highlights = [
      ...(m.domains.gross    || []).slice(0, 1),
      ...(m.domains.language || []).slice(0, 1),
      ...(m.domains.cognitive|| []).slice(0, 1)
    ];
    card.innerHTML = `
      <div class="uc-week">${m.weekLabel}</div>
      <div class="uc-month">${m.stageLabel}</div>
      <ul>${highlights.map(h => `<li>${h}</li>`).join('')}</ul>
    `;
    grid.appendChild(card);
  });
}

// ─────────────────────────────────────────
// Past milestones grid
// ─────────────────────────────────────────
function renderPast(currentIdx) {
  const grid = document.getElementById('past-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const pastOnes = MILESTONES.slice(0, currentIdx);
  if (!pastOnes.length) return;

  pastOnes.forEach((m, i) => {
    const card       = document.createElement('div');
    card.className   = 'upcoming-card cursor-pointer hover:shadow-md transition-shadow';
    const highlights = [
      ...(m.domains.gross    || []).slice(0, 1),
      ...(m.domains.language || []).slice(0, 1),
      ...(m.domains.cognitive|| []).slice(0, 1)
    ];
    card.innerHTML = `
      <div class="uc-week">${m.weekLabel}</div>
      <div class="uc-month">${m.stageLabel}</div>
      <ul>${highlights.map(h => `<li>${h}</li>`).join('')}</ul>
    `;
    card.addEventListener('click', () => onPastCardClick(i));
    grid.appendChild(card);
  });
}

function togglePastMilestones() {
  pastMilestonesOpen = !pastMilestonesOpen;
  const container = document.getElementById('past-milestones-container');
  if (container) {
    container.classList.toggle('hidden', !pastMilestonesOpen);
  }
}

function onPastCardClick(pastIdx) {
  const type = 'past';
  const age = calcAge(localStorage.getItem('baby_dob'));

  renderTodoCard(pastIdx, age, type);
  document.getElementById('todo-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 更新時間軸節點的 active 狀態
  if (d3Timeline) {
    d3Timeline.setActive(pastIdx);
  }
}

// ─────────────────────────────────────────
// Reset
// ─────────────────────────────────────────
export function resetChecks() {
  const dob = localStorage.getItem('baby_dob');
  if (!dob) return;
  const age = calcAge(dob);
  const idx = getMilestoneIndex(age.months);
  localStorage.removeItem(`checks_${idx}`);
  renderTodoCard(idx, age, 'current');
  renderTimeline(idx);
}

// ─────────────────────────────────────────
// 掛載到 window（相容 HTML inline handlers）
// ─────────────────────────────────────────
window.saveAndStart         = saveAndStart;
window.changeProfile        = changeProfile;
window.resetChecks          = resetChecks;
window.toggleTimeline       = toggleTimeline;
window.togglePastMilestones = togglePastMilestones;
window.openPiagetModal      = openPiagetModal;
window.calcAge              = calcAge;
window.getMilestoneIndex    = getMilestoneIndex;
window.renderTodoCard       = renderTodoCard;

// ─────────────────────────────────────────
// DOMContentLoaded 入口
// ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const name = localStorage.getItem('baby_name');
  const dob  = localStorage.getItem('baby_dob');
  if (name && dob) {
    document.getElementById('baby-name-input').value = name;
    document.getElementById('birth-date-input').value = dob;
    initApp();
  }
});

// ─────────────────────────────────────────
// 全局处理函数（解决模块加载问题）
// ─────────────────────────────────────────
window.handleSaveAndStart = saveAndStart;
