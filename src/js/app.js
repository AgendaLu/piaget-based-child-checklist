// ─────────────────────────────────────────
// js/app.js
// 主應用邏輯：初始化、月齡計算、
// 時間軸渲染、任務卡渲染
// ─────────────────────────────────────────
import { MILESTONES, DOMAIN_META } from '../data/milestones.js';
import { PIAGET_KEY_MAP, PIAGET_DATA } from '../data/piaget.js';
import { openPiagetDrawer } from './drawer.js';

// ── 狀態 ──────────────────────────────────
export let currentMilestoneIndex = 0;  // drawer.js 也需要讀取
let timelineOpen = false;
let pastMilestonesOpen = false;

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
  if (!name || !dob) { alert('請填寫寶寶的名字與出生日期'); return; }
  localStorage.setItem('baby_name', name);
  localStorage.setItem('baby_dob',  dob);
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
  if (!name || !dob) return;

  const age  = calcAge(dob);
  const idx  = getMilestoneIndex(age.months);
  currentMilestoneIndex = idx;

  const milestone = MILESTONES[idx];

  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('app-screen').style.display   = 'block';

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
// Timeline
// ─────────────────────────────────────────
function renderTimeline(currentIdx) {
  // 收合狀態的進度條
  const pct = Math.min(100, (currentIdx / (MILESTONES.length - 1)) * 100);
  const fill   = document.getElementById('tl-fill');
  const cursor = document.getElementById('tl-cursor');
  if (fill)   fill.style.width   = pct + '%';
  if (cursor) cursor.style.left  = pct + '%';

  // 節點列
  const container = document.getElementById('tl-nodes');
  if (!container) return;
  container.innerHTML = '';

  MILESTONES.forEach((m, i) => {
    const isActive  = (i === currentIdx);
    const stateClass = i < currentIdx ? 'state-past'
                     : i === currentIdx ? 'state-current'
                     : 'state-future';

    // 補填狀態：past 階段若有任何 retro 記錄，升格為 state-retro
    let finalState = stateClass;
    if (i < currentIdx) {
      const saved = JSON.parse(localStorage.getItem(`checks_${i}`) || '{}');
      const hasRetro = Object.values(saved).some(v => v === 'retro');
      if (hasRetro) finalState = 'state-retro';
    }

    // 達成數
    const saved = JSON.parse(localStorage.getItem(`checks_${i}`) || '{}');
    const doneCount = Object.values(saved).filter(v => v === 'normal' || v === 'retro').length;
    const totalItems = Object.values(m.domains).flat().length;

    const node = document.createElement('div');
    node.className = `tl-node ${finalState}${isActive ? ' active' : ''}`;
    node.dataset.idx = i;

    // 連接線（最後一個節點不加）
    const connector = i < MILESTONES.length - 1
      ? `<div class="tl-connector"></div>` : '';

    // 節點圓點（past 加勾號）
    const checkmark = (i < currentIdx)
      ? `<svg width="8" height="6" viewBox="0 0 8 6" fill="none">
           <path d="M1 3l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>` : '';

    const subText = i < currentIdx ? `${doneCount}/${totalItems}`
                  : i === currentIdx ? '目前' : '';

    node.innerHTML = `
      ${connector}
      <div class="tl-circle">${checkmark}</div>
      <div class="tl-node-label">${m.label}</div>
      <div class="tl-node-sub">${subText}</div>
    `;

    node.addEventListener('click', () => onTimelineNodeClick(i));
    container.appendChild(node);
  });
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

  expanded?.classList.toggle('open', timelineOpen);
  expandBtn?.classList.toggle('open', timelineOpen);

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
// 任務卡渲染（支援 current / past / future）
// ─────────────────────────────────────────
function renderTodoCard(idx, age, type) {
  const milestone = MILESTONES[idx];
  const card = document.getElementById('todo-card');
  if (!card) return;

  // 任務卡上緣色條
  card.className = `todo-card fade-in is-${type}`;

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
      <div class="uc-month">${m.label}</div>
      <div class="uc-label">${m.stageLabel}</div>
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
  document.querySelectorAll('.tl-node').forEach((n, i) => {
    n.classList.toggle('active', i === pastIdx);
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
window.saveAndStart         = saveAndStart;
window.changeProfile        = changeProfile;
window.resetChecks          = resetChecks;
window.toggleTimeline       = toggleTimeline;
window.togglePastMilestones = togglePastMilestones;
window.openPiagetDrawer     = openPiagetDrawer;

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
