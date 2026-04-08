// ─────────────────────────────────────────
// drawer.js
// 皮亞傑側邊抽屜：開關、內容渲染、階段切換
// ─────────────────────────────────────────
import { PIAGET_DATA, PIAGET_KEY_MAP, PIAGET_STAGE_MAP } from './piaget.js';
import { currentMilestoneIndex } from './app.js';

let drawerStageIdx = 0;
let dropdownOpen = false;

// ─────────────────────────────────────────
// 開啟抽屜
// ─────────────────────────────────────────
export function openPiagetDrawer() {
  drawerStageIdx = currentMilestoneIndex;
  renderDrawerFull(drawerStageIdx);

  document.getElementById('piaget-overlay').classList.add('open');
  document.getElementById('piaget-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ─────────────────────────────────────────
// 關閉抽屜
// ─────────────────────────────────────────
export function closePiagetDrawer() {
  document.getElementById('piaget-overlay').classList.remove('open');
  document.getElementById('piaget-drawer').classList.remove('open');
  document.body.style.overflow = '';
  dropdownOpen = false;
}

// ─────────────────────────────────────────
// 切換到指定階段
// ─────────────────────────────────────────
function switchStage(idx) {
  drawerStageIdx = idx;
  dropdownOpen = false;
  renderDrawerFull(idx);
}

// ─────────────────────────────────────────
// 渲染完整抽屜（header + dropdown + body）
// ─────────────────────────────────────────
function renderDrawerFull(idx) {
  const pk = PIAGET_KEY_MAP[idx];
  const pd = PIAGET_DATA[pk];

  // Header
  document.getElementById('drawer-stage-subtitle').textContent = pd.piagetSub;
  document.getElementById('drawer-piaget-stage').textContent   = pd.piagetStage;
  document.getElementById('drawer-piaget-age').textContent     = pd.piagetAge;

  // Dropdown selector
  renderStageDropdown(idx);

  // Body content
  renderDrawerBody(pd, idx);
}

// ─────────────────────────────────────────
// 階段切換 Dropdown
// ─────────────────────────────────────────
function renderStageDropdown(activeIdx) {
  const container = document.getElementById('drawer-stage-selector');
  if (!container) return;

  const current = PIAGET_STAGE_MAP[activeIdx] || PIAGET_STAGE_MAP[0];
  const isCurrent = activeIdx === currentMilestoneIndex;

  container.innerHTML = `
    <div class="stage-dropdown">
      <button class="stage-dropdown-trigger" id="stage-dropdown-trigger">
        <div class="stage-dropdown-left">
          <div class="stage-dropdown-dot" style="background:${isCurrent ? '#8B5000' : '#3D5A80'}"></div>
          <div>
            <div class="stage-dropdown-name">${current.name}</div>
            <div class="stage-dropdown-age">${current.age}${isCurrent ? ' · 目前階段' : ''}</div>
          </div>
        </div>
        <span class="material-symbols-rounded stage-dropdown-chevron ${dropdownOpen ? 'open' : ''}">expand_more</span>
      </button>
      <div class="stage-dropdown-menu ${dropdownOpen ? 'open' : ''}" id="stage-dropdown-menu">
        ${PIAGET_STAGE_MAP.map((s, i) => `
          <button class="stage-dropdown-item ${i === activeIdx ? 'active' : ''} ${i === currentMilestoneIndex ? 'is-current' : ''}"
                  data-idx="${i}">
            <div class="stage-dropdown-item-dot ${i < currentMilestoneIndex ? 'past' : ''} ${i === currentMilestoneIndex ? 'current' : ''}"></div>
            <div class="stage-dropdown-item-text">
              <span class="stage-dropdown-item-name">${s.name}</span>
              <span class="stage-dropdown-item-age">${s.age}</span>
            </div>
            ${i === currentMilestoneIndex ? '<span class="stage-dropdown-item-badge">目前</span>' : ''}
            ${i === activeIdx ? '<span class="material-symbols-rounded text-sm text-primary">check</span>' : ''}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Event: toggle dropdown
  container.querySelector('#stage-dropdown-trigger').addEventListener('click', () => {
    dropdownOpen = !dropdownOpen;
    container.querySelector('.stage-dropdown-menu').classList.toggle('open', dropdownOpen);
    container.querySelector('.stage-dropdown-chevron').classList.toggle('open', dropdownOpen);
  });

  // Event: select item
  container.querySelectorAll('.stage-dropdown-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      switchStage(idx);
    });
  });
}

// ─────────────────────────────────────────
// 渲染抽屜 Body 內容
// ─────────────────────────────────────────
function renderDrawerBody(pd, currentIdx) {
  const body = document.getElementById('drawer-body-content');
  if (!body) return;

  body.innerHTML = `
    <div class="schema-link-box">
      <div class="schema-link-icon">🔗</div>
      <div class="schema-link-text">${pd.schemaLink}</div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">核心認知概念</div>
      <div class="concept-row">
        ${pd.keyConcepts.map(c => `
          <div class="concept-chip">
            <div class="concept-chip-icon">${c.icon}</div>
            <div class="concept-chip-body">
              <div class="concept-chip-name">${c.name}</div>
              <div class="concept-chip-desc">${c.desc}</div>
              <div class="concept-chip-example">實例：${c.example}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">延伸促進活動</div>
      <div class="task-grid">
        ${pd.tasks.map(t => `
          <div class="task-card">
            <div class="task-card-header">
              <span class="task-card-emoji">${t.emoji}</span>
              <span class="task-card-name">${t.name}</span>
              <span class="task-tag">${t.tag}</span>
            </div>
            <div class="task-card-desc">${t.desc}</div>
            <div class="task-card-how">${t.how}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">觀察者指引</div>
      <div class="obs-tip-list">
        ${pd.observerTips.map(t => `
          <div class="obs-tip">
            <div class="obs-tip-num">${t.n}</div>
            <div class="obs-tip-text">${t.text}</div>
          </div>`).join('')}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────
// ESC 鍵關閉
// ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePiagetDrawer();
});

// 點擊 dropdown 外部關閉
document.addEventListener('click', e => {
  if (dropdownOpen && !e.target.closest('.stage-dropdown')) {
    dropdownOpen = false;
    const menu = document.getElementById('stage-dropdown-menu');
    const chev = document.querySelector('.stage-dropdown-chevron');
    if (menu) menu.classList.remove('open');
    if (chev) chev.classList.remove('open');
  }
});

// ─────────────────────────────────────────
// 掛載到 window
// ─────────────────────────────────────────
window.closePiagetDrawer = closePiagetDrawer;
