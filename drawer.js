// ─────────────────────────────────────────
// js/drawer.js
// 皮亞傑側邊抽屜：開關、內容渲染
// ─────────────────────────────────────────
import { PIAGET_DATA, PIAGET_KEY_MAP, PIAGET_STAGE_MAP } from '../data/piaget.js';
import { currentMilestoneIndex } from './app.js';

// ─────────────────────────────────────────
// 開啟抽屜（由 app.js 透過 window 代理呼叫）
// ─────────────────────────────────────────
export function openPiagetDrawer() {
  const idx = currentMilestoneIndex;
  const pk  = PIAGET_KEY_MAP[idx];
  const pd  = PIAGET_DATA[pk];

  // 更新 header
  document.getElementById('drawer-stage-subtitle').textContent = pd.piagetSub;
  document.getElementById('drawer-piaget-stage').textContent   = pd.piagetStage;
  document.getElementById('drawer-piaget-age').textContent     = pd.piagetAge;

  // 渲染 body
  renderDrawerBody(pd, idx);

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
}

// ─────────────────────────────────────────
// 渲染抽屜內容
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
      <div class="drawer-section-title">本階段核心認知概念</div>
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

    <div class="drawer-section">
      <div class="drawer-section-title">皮亞傑階段全覽</div>
      <div class="stage-map">
        ${PIAGET_STAGE_MAP.map((s, i) => `
          <div class="stage-map-item ${i < currentIdx ? 'past' : ''} ${i === currentIdx ? 'current' : ''}">
            <div class="stage-map-dot"></div>
            <div class="stage-map-age">${s.age}</div>
            <div class="stage-map-name">${s.name}</div>
            ${i === currentIdx ? '<span class="stage-map-badge">目前階段</span>' : ''}
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

// ─────────────────────────────────────────
// 掛載到 window（相容 HTML inline handlers）
// ─────────────────────────────────────────
window.closePiagetDrawer = closePiagetDrawer;
