// ─────────────────────────────────────────
// js/drawer.js
// 皮亞傑認知發展全屏模態：開關、時間軸、手風琴
// ─────────────────────────────────────────
import { PIAGET_DATA, PIAGET_KEY_MAP, PIAGET_STAGE_MAP } from './piaget.js';

// 追蹤當前打開的手風琴段落（允許多個展開）
let openAccordions = new Set();

// ─────────────────────────────────────────
// 打開模態（由 app.js 透過 window 代理呼叫）
// ─────────────────────────────────────────
export function openPiagetModal() {
  const idx = window.currentMilestoneIndex;
  const stageKey = PIAGET_KEY_MAP[idx];
  const stageData = PIAGET_DATA[stageKey];

  // 更新模態標題
  document.getElementById('piaget-modal-stage').textContent =
    `${stageData.piagetStage} · ${stageData.piagetSub} (${stageData.piagetAge})`;

  // 渲染時間軸卡片和內容
  renderTimelineCards(stageKey);
  renderTimelineCardsMobile(stageKey);
  renderAccordionContent(stageData);

  // 設置手風琴事件
  setupAccordionToggle();

  // 顯示模態
  document.getElementById('piaget-modal-overlay').classList.remove('hidden');
  document.getElementById('piaget-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // 重置手風琴狀態並預設展開「理論闡述」
  openAccordions.clear();
  expandTheoryAccordion();
}

// ─────────────────────────────────────────
// 關閉模態
// ─────────────────────────────────────────
export function closePiagetModal() {
  document.getElementById('piaget-modal-overlay').classList.add('hidden');
  document.getElementById('piaget-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ─────────────────────────────────────────
// 切換移動版時間軸抽屜
// ─────────────────────────────────────────
export function togglePiagetTimeline() {
  const drawer = document.getElementById('piaget-timeline-drawer');
  const overlay = document.getElementById('piaget-timeline-overlay');

  if (drawer && overlay) {
    drawer.classList.toggle('open');
    overlay.classList.toggle('open');
  }
}

// ─────────────────────────────────────────
// 關閉移動版時間軸抽屜
// ─────────────────────────────────────────
function closePiagetTimeline() {
  const drawer = document.getElementById('piaget-timeline-drawer');
  const overlay = document.getElementById('piaget-timeline-overlay');

  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }
}

// ─────────────────────────────────────────
// 渲染時間軸卡片（桌面版，左側邊欄）
// ─────────────────────────────────────────
function renderTimelineCards(currentStageKey) {
  const container = document.getElementById('piaget-timeline');
  if (!container) return;

  container.innerHTML = '';

  PIAGET_STAGE_MAP.forEach((stage, idx) => {
    const stageKey = PIAGET_KEY_MAP[idx];
    const isPast = idx < window.currentMilestoneIndex;
    const isCurrent = stageKey === currentStageKey;

    const card = document.createElement('div');
    card.className = `piaget-timeline-card ${isCurrent ? 'active' : ''}`;
    card.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="piaget-timeline-dot ${isPast ? 'past' : isCurrent ? 'current' : 'future'}"></span>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-ink truncate">${stage.name}</div>
          <div class="text-xs text-ink-soft">${stage.age}</div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      handleTimelineCardClick(stageKey);
    });

    container.appendChild(card);
  });
}

// ─────────────────────────────────────────
// 渲染時間軸卡片（移動版，抽屜式垂直時間軸）
// ─────────────────────────────────────────
function renderTimelineCardsMobile(currentStageKey) {
  const container = document.getElementById('piaget-timeline-drawer');
  if (!container) return;

  container.innerHTML = '';

  PIAGET_STAGE_MAP.forEach((stage, idx) => {
    const stageKey = PIAGET_KEY_MAP[idx];
    const isPast = idx < window.currentMilestoneIndex;
    const isCurrent = stageKey === currentStageKey;

    const card = document.createElement('button');
    card.className = `piaget-timeline-card-mobile ${isCurrent ? 'active' : ''}`;
    card.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="stage-dot ${isPast ? 'past' : isCurrent ? 'current' : 'future'}"></span>
        <div class="flex-1 min-w-0 text-left">
          <div class="text-sm font-semibold text-ink truncate">${stage.name}</div>
          <div class="text-xs text-ink-soft">${stage.age}</div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      handleTimelineCardClick(stageKey);
      // 選擇後自動關閉抽屜
      closePiagetTimeline();
    });

    container.appendChild(card);
  });
}

// ─────────────────────────────────────────
// 手風琴內容渲染
// ─────────────────────────────────────────
function renderAccordionContent(stageData) {
  const body = document.getElementById('piaget-modal-body');
  if (!body) return;

  body.innerHTML = `
    <!-- 理論闡述 -->
    <div class="piaget-accordion-item mb-6">
      <button class="piaget-accordion-header">
        <span>理論闡述</span>
        <span class="piaget-accordion-toggle collapsed">›</span>
      </button>
      <div class="piaget-accordion-content collapsed">
        <div class="schema-link-box">
          <div class="schema-link-text">${stageData.schemaLink}</div>
        </div>
      </div>
    </div>

    <!-- 核心認知概念 -->
    <div class="piaget-accordion-item mb-6">
      <button class="piaget-accordion-header">
        <span>核心認知概念</span>
        <span class="piaget-accordion-toggle collapsed">›</span>
      </button>
      <div class="piaget-accordion-content collapsed">
        <div class="space-y-4">
          ${stageData.keyConcepts.map(c => `
            <div class="concept-chip">
              <div class="concept-chip-icon">${c.icon}</div>
              <div class="concept-chip-body">
                <div class="concept-chip-name">${c.name}</div>
                <div class="concept-chip-desc">${c.desc}</div>
                <div class="concept-chip-example">實例：${c.example}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 延伸促進活動 -->
    <div class="piaget-accordion-item mb-6">
      <button class="piaget-accordion-header">
        <span>延伸促進活動</span>
        <span class="piaget-accordion-toggle collapsed">›</span>
      </button>
      <div class="piaget-accordion-content collapsed">
        <div class="space-y-4">
          ${stageData.tasks.map(t => `
            <div class="task-card">
              <div class="task-card-header">
                <span class="task-card-emoji">${t.emoji}</span>
                <span class="task-card-name">${t.name}</span>
                <span class="task-tag">${t.tag}</span>
              </div>
              <div class="task-card-desc">${t.desc}</div>
              <div class="task-card-how">${t.how}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 觀察者指引 -->
    <div class="piaget-accordion-item mb-6">
      <button class="piaget-accordion-header">
        <span>觀察者指引</span>
        <span class="piaget-accordion-toggle collapsed">›</span>
      </button>
      <div class="piaget-accordion-content collapsed">
        <div class="obs-tip-list">
          ${stageData.observerTips.map(t => `
            <div class="obs-tip">
              <div class="obs-tip-num">${t.n}</div>
              <div class="obs-tip-text">${t.text}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────
// 設置手風琴展開/收起事件
// ─────────────────────────────────────────
function setupAccordionToggle() {
  const headers = document.querySelectorAll('.piaget-accordion-header');

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.piaget-accordion-item');
      const content = item.querySelector('.piaget-accordion-content');
      const toggle = header.querySelector('.piaget-accordion-toggle');
      const itemId = item.id || header.textContent.trim();

      // 切換狀態
      const isOpen = openAccordions.has(itemId);

      if (isOpen) {
        // 收起
        openAccordions.delete(itemId);
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
      } else {
        // 展開
        openAccordions.add(itemId);
        content.classList.remove('collapsed');
        toggle.classList.remove('collapsed');
      }
    });
  });
}

// ─────────────────────────────────────────
// 預設展開「理論闡述」手風琴
// ─────────────────────────────────────────
function expandTheoryAccordion() {
  const headers = document.querySelectorAll('.piaget-accordion-header');

  // 找到第一個header（理論闡述）
  if (headers.length > 0) {
    const firstHeader = headers[0];
    const item = firstHeader.closest('.piaget-accordion-item');
    const content = item.querySelector('.piaget-accordion-content');
    const toggle = firstHeader.querySelector('.piaget-accordion-toggle');
    const itemId = item.id || firstHeader.textContent.trim();

    // 展開第一個accordion
    openAccordions.add(itemId);
    content.classList.remove('collapsed');
    toggle.classList.remove('collapsed');
  }
}

// ─────────────────────────────────────────
// 時間軸卡片點擊事件
// ─────────────────────────────────────────
function handleTimelineCardClick(stageKey) {
  console.log('handleTimelineCardClick called with stageKey:', stageKey);
  const stageData = PIAGET_DATA[stageKey];
  console.log('stageData:', stageData?.piagetStage);

  if (!stageData) {
    console.warn('No stage data found for key:', stageKey);
    return;
  }

  // 重新渲染內容和時間軸卡片高亮
  renderTimelineCards(stageKey);
  renderTimelineCardsMobile(stageKey);
  renderAccordionContent(stageData);

  // 更新模態標題
  document.getElementById('piaget-modal-stage').textContent =
    `${stageData.piagetStage} · ${stageData.piagetSub} (${stageData.piagetAge})`;

  // 重新設置手風琴事件，並預設展開「理論闡述」
  openAccordions.clear();
  setupAccordionToggle();
  expandTheoryAccordion();
  console.log('Stage switched to:', stageKey);
}

// ─────────────────────────────────────────
// ESC 鍵關閉
// ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('piaget-modal');
    if (modal && !modal.classList.contains('hidden')) {
      closePiagetModal();
    }
  }
});

// ─────────────────────────────────────────
// 掛載到 window（相容 HTML inline handlers）
// ─────────────────────────────────────────
window.openPiagetModal = openPiagetModal;
window.closePiagetModal = closePiagetModal;
window.togglePiagetTimeline = togglePiagetTimeline;
