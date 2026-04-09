// ─────────────────────────────────────────
// js/app.js
// 主應用邏輯：初始化、月齡計算、
// 時間軸渲染、任務卡渲染
// ─────────────────────────────────────────
import { MILESTONES, DOMAIN_META } from './milestones.js';
import { PIAGET_KEY_MAP, PIAGET_DATA } from './piaget.js';
import { openPiagetDrawer } from './drawer.js';

// ── 狀態 ──────────────────────────────────
export let currentMilestoneIndex = 0;  // drawer.js 也需要讀取
let timelineOpen = false;

// ── localStorage 鍵名 ─────────────────────
// checks_{idx}  → { "gross_0": "normal"|"retro"|false, ... }
// 三種值：false = 未勾選，"normal" = 當時完成，"retro" = 補填

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

// ─────────────────────────────────────────
// Setup screen
// ─────────────────────────────────────────
export function saveAndStart() {
  const name = document.getElementById('baby-name-input').value.trim();
  const dob  = document.getElementById('birth-date-input').value;
  if (!name) { alert('請填寫寶寶的名字'); return; }
  localStorage.setItem('baby_name', name);
  if (dob) localStorage.setItem('baby_dob', dob);
  else localStorage.removeItem('baby_dob');
  initApp();
}

export function changeProfile() {
  document.getElementById('app-screen').style.display    = 'none';
  document.getElementById('setup-screen').style.display  = 'flex';
}

// ─────────────────────────────────────────
// 初始化
// ─────────────────────────────────────────
export function initApp() {
  const name = localStorage.getItem('baby_name');
  const dob  = localStorage.getItem('baby_dob');
  if (!name) return;

  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('app-screen').style.display   = 'block';

  // Topbar name
  document.getElementById('display-name').textContent = name;

  // Countdown badge
  const countdownBadge = document.getElementById('countdown-badge');
  const countdownDays  = document.getElementById('countdown-days');

  // Handle missing DOB or future DOB
  const isFuture = dob && calcAge(dob).totalDays < 0;
  const noDob    = !dob;

  if (noDob || isFuture) {
    // Default to first milestone
    currentMilestoneIndex = 0;
    const milestone = MILESTONES[0];

    document.getElementById('display-age').textContent       = '—';
    document.getElementById('display-age-exact').textContent  = noDob ? '未設定' : '';

    // Show countdown for future DOB
    if (isFuture) {
      const daysUntilBirth = Math.abs(calcAge(dob).totalDays);
      countdownBadge.classList.remove('hidden');
      countdownDays.textContent = `還有 ${daysUntilBirth} 天`;
    } else {
      countdownBadge.classList.add('hidden');
    }

    document.getElementById('current-stage-label').textContent = milestone.stageLabel;
    document.getElementById('progress-desc').textContent = noDob
      ? '請補填出生日期以啟用月齡追蹤'
      : '寶寶尚未出生，時間軸以預設顯示';

    // Alert
    const alertEl = document.getElementById('alert-strip');
    alertEl.classList.remove('visible');

    // Piaget trigger
    const pd = PIAGET_DATA[PIAGET_KEY_MAP[0]];
    document.getElementById('piaget-trigger-desc').textContent =
      `${pd.piagetStage} · ${pd.piagetSub}`;

    const age = { months: 0, weeks: 0, totalDays: 0 };
    renderTimeline(0);
    initThumbDrag();
    renderTodoCard(0, age, 'future');
    renderUpcoming(0);
    return;
  }

  // Normal flow: DOB exists and is in the past
  const age  = calcAge(dob);
  const idx  = getMilestoneIndex(age.months);
  currentMilestoneIndex = idx;
  const milestone = MILESTONES[idx];

  countdownBadge.classList.add('hidden');

  document.getElementById('display-age').textContent        = `${age.months}個月`;
  document.getElementById('display-age-exact').textContent  = `${age.weeks}週`;

  // Stage info in timeline bar
  document.getElementById('current-stage-label').textContent = milestone.stageLabel;

  const next = MILESTONES[Math.min(idx + 1, MILESTONES.length - 1)];
  const daysToNext = Math.max(0, Math.floor(next.monthStart * 30.44 - age.totalDays));
  document.getElementById('progress-desc').textContent =
    idx < MILESTONES.length - 1
      ? `距離下一階段（${next.label}）還有 ${daysToNext} 天`
      : '已達24個月追蹤完成';

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
  initThumbDrag();
  renderTodoCard(idx, age, 'current');
  renderUpcoming(idx);
}

// ─────────────────────────────────────────
// Timeline — continuous track with snap thumb
// ─────────────────────────────────────────
let activeViewIdx = -1; // which node the thumb is viewing

function getNodePct(i) {
  return MILESTONES.length <= 1 ? 0 : (i / (MILESTONES.length - 1)) * 100;
}

function renderTimeline(currentIdx) {
  const nodesLayer = document.getElementById('tl-nodes');
  const labelsRow  = document.getElementById('tl-labels');
  const fill       = document.getElementById('tl-track-fill');
  if (!nodesLayer) return;
  nodesLayer.innerHTML = '';
  labelsRow.innerHTML  = '';

  // Fill track up to current
  fill.style.width = getNodePct(currentIdx) + '%';

  MILESTONES.forEach((m, i) => {
    let state = i < currentIdx ? 'past' : i === currentIdx ? 'current' : 'future';
    if (i < currentIdx) {
      const saved = JSON.parse(localStorage.getItem(`checks_${i}`) || '{}');
      if (Object.values(saved).some(v => v === 'retro')) state = 'retro';
    }

    const saved = JSON.parse(localStorage.getItem(`checks_${i}`) || '{}');
    const doneCount  = Object.values(saved).filter(v => v === 'normal' || v === 'retro').length;
    const totalItems = Object.values(m.domains).flat().length;

    // Dot on the track
    const dot = document.createElement('div');
    dot.className = `tl-dot tl-dot--${state}`;
    dot.style.left = getNodePct(i) + '%';
    dot.dataset.idx = i;

    if (i < currentIdx) {
      dot.innerHTML = `<svg width="8" height="6" viewBox="0 0 8 6" fill="none">
        <path d="M1 3l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }

    dot.addEventListener('click', (e) => { e.stopPropagation(); snapThumbTo(i); });
    nodesLayer.appendChild(dot);

    // Label below
    const label = document.createElement('div');
    label.className = `tl-label-item tl-label--${state}`;
    label.style.left = getNodePct(i) + '%';
    label.innerHTML = `
      <span class="tl-label-name">${m.label}</span>
      <span class="tl-label-sub">${i < currentIdx ? doneCount + '/' + totalItems : i === currentIdx ? '目前' : ''}</span>
    `;
    label.addEventListener('click', () => snapThumbTo(i));
    labelsRow.appendChild(label);
  });

  // Position thumb at current milestone
  activeViewIdx = currentIdx;
  positionThumb(currentIdx, false);
}

function positionThumb(idx, animate = true) {
  const thumb = document.getElementById('tl-thumb');
  const label = document.getElementById('tl-thumb-label');
  if (!thumb) return;

  thumb.style.transition = animate ? 'left 0.35s cubic-bezier(0.4,0,0.2,1)' : 'none';
  thumb.style.left = getNodePct(idx) + '%';

  const m = MILESTONES[idx];
  label.textContent = m.label;

  // Update dot active states
  document.querySelectorAll('.tl-dot').forEach((d, i) => {
    d.classList.toggle('tl-dot--active', i === idx);
  });
  document.querySelectorAll('.tl-label-item').forEach((l, i) => {
    l.classList.toggle('tl-label--active', i === idx);
  });
}

function snapThumbTo(idx) {
  if (idx === activeViewIdx) return;
  activeViewIdx = idx;
  positionThumb(idx, true);

  const type = idx < currentMilestoneIndex ? 'past'
             : idx === currentMilestoneIndex ? 'current' : 'future';
  const age = calcAge(localStorage.getItem('baby_dob'));
  renderTodoCard(idx, age, type);
}

// ── Drag logic ──
function initThumbDrag() {
  const thumb  = document.getElementById('tl-thumb');
  const slider = document.getElementById('tl-slider');
  if (!thumb || !slider) return;

  let dragging = false;

  function getIdxFromX(clientX) {
    const rect = slider.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    // Snap to nearest node
    const raw  = pct * (MILESTONES.length - 1);
    return Math.round(raw);
  }

  function onStart(e) {
    dragging = true;
    thumb.classList.add('tl-thumb--dragging');
    e.preventDefault();
  }
  function onMove(e) {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const idx = getIdxFromX(clientX);
    if (idx !== activeViewIdx) {
      activeViewIdx = idx;
      positionThumb(idx, false);
    }
  }
  function onEnd() {
    if (!dragging) return;
    dragging = false;
    thumb.classList.remove('tl-thumb--dragging');
    // Trigger card update
    const type = activeViewIdx < currentMilestoneIndex ? 'past'
               : activeViewIdx === currentMilestoneIndex ? 'current' : 'future';
    const age = calcAge(localStorage.getItem('baby_dob'));
    renderTodoCard(activeViewIdx, age, type);
  }

  thumb.addEventListener('mousedown', onStart);
  thumb.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onEnd);
  window.addEventListener('touchend', onEnd);

  // Also allow clicking on the track itself
  slider.addEventListener('click', (e) => {
    if (e.target.closest('.tl-thumb')) return;
    const idx = getIdxFromX(e.clientX);
    snapThumbTo(idx);
  });
}

export function toggleTimeline() {
  // no-op — timeline is always visible now
}

// ─────────────────────────────────────────
// 任務卡渲染（支援 current / past / future）
// ─────────────────────────────────────────
function renderTodoCard(idx, age, type) {
  const milestone = MILESTONES[idx];
  const card = document.getElementById('todo-card');
  if (!card) return;

  // 任務卡上緣色條
  card.className = `todo-card bg-surface-container-low rounded-xl shadow-elevation-1 p-6 mb-6 animate-fade-up is-${type}`;

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
      const itemState = saved[itemKey] || false; // false | "normal" | "retro"

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
        item.className = itemClass;
        item.innerHTML = `<div class="todo-checkbox"></div><div class="todo-text">${text}</div>`;

        item.addEventListener('click', () => {
          const cur = JSON.parse(localStorage.getItem(checkKey) || '{}');
          const current = cur[itemKey] || false;

          // 循環：false → normal → retro → false
          // current 階段只有 false / normal（補填語意不適用當前）
          let next;
          if (type === 'current') {
            next = current === 'normal' ? false : 'normal';
          } else {
            // past 階段：false → retro → normal → false
            // 讓補填（retro）成為第一步，表示「我現在回頭記錄」
            if      (current === false)    next = 'retro';
            else if (current === 'retro')  next = 'normal';
            else                           next = false;
          }

          cur[itemKey] = next;
          localStorage.setItem(checkKey, JSON.stringify(cur));

          // 更新 class
          item.classList.remove('done-normal', 'done-retro');
          if (next === 'normal') item.classList.add('done-normal');
          if (next === 'retro')  item.classList.add('done-retro');

          // 更新時間軸節點的 state
          renderTimeline(currentMilestoneIndex);
        });
      }

      section.appendChild(item);
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
    const normalCount = Object.values(saved).filter(v => v === 'normal').length;
    const retroCount  = Object.values(saved).filter(v => v === 'retro').length;
    const doneCount   = normalCount + retroCount;
    const pct         = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const hasRetro    = retroCount > 0;
    const fillClass   = hasRetro ? 'fill-retro' : 'fill-normal';
    const pctClass    = hasRetro ? 'has-retro'  : 'all-normal';

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

    if (hasRetro) {
      const note = document.createElement('div');
      note.className = 'retro-note';
      note.textContent = `其中 ${retroCount} 項為事後補填記錄`;
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
      <div class="uc-month">${m.label}</div>
      <div class="uc-label">${m.stageLabel}</div>
      <ul>${highlights.map(h => `<li>${h}</li>`).join('')}</ul>
    `;
    grid.appendChild(card);
  });
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
window.saveAndStart      = saveAndStart;
window.changeProfile     = changeProfile;
window.resetChecks       = resetChecks;
window.toggleTimeline    = toggleTimeline;
window.openPiagetDrawer  = openPiagetDrawer;

// ─────────────────────────────────────────
// DOMContentLoaded 入口
// ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const name = localStorage.getItem('baby_name');
  const dob  = localStorage.getItem('baby_dob');
  if (name) {
    document.getElementById('baby-name-input').value = name;
    if (dob) document.getElementById('birth-date-input').value = dob;
    initApp();
  }
});
