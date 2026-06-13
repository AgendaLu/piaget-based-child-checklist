// ─────────────────────────────────────────
// js/drawer.js
// 皮亞傑認知發展全屏模態：開關、時間軸、手風琴
// 桌面版：左側時間軸側欄
// 手機版：頂部水平 chip 列 + 底部上一/下一階段按鈕
// ─────────────────────────────────────────
import { PIAGET_DATA, PIAGET_KEY_MAP, PIAGET_STAGE_MAP } from './piaget.js';

// 追蹤當前打開的手風琴段落（以標題為 key，跨階段切換保留）
let openAccordions = new Set();
let currentStageKey = null;

// ─────────────────────────────────────────
// 打開模態（由 app.js 透過 window 代理呼叫）
// ─────────────────────────────────────────
export function openPiagetModal() {
  const idx = window.currentMilestoneIndex;
  const stageKey = PIAGET_KEY_MAP[idx];

  // 重置手風琴狀態並預設展開「理論闡述」
  openAccordions = new Set(['理論闡述']);
  renderStage(stageKey);

  // 顯示模態
  document.getElementById('piaget-modal-overlay').classList.remove('hidden');
  document.getElementById('piaget-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // 焦點移入模態，方便鍵盤與讀屏操作
  document.getElementById('piaget-modal').focus?.();
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
// 渲染指定階段（標題、時間軸、chips、內容、底部導覽）
// ─────────────────────────────────────────
function renderStage(stageKey) {
  const stageData = PIAGET_DATA[stageKey];
  if (!stageData) return;

  currentStageKey = stageKey;

  document.getElementById('piaget-modal-stage').textContent =
    `${stageData.piagetStage} · ${stageData.piagetSub} (${stageData.piagetAge})`;

  renderTimelineCards(stageKey);
  renderStageChips(stageKey);
  renderAccordionContent(stageData);
  setupAccordionToggle();
  updateStageNavButtons(stageKey);
}

// ─────────────────────────────────────────
// 渲染時間軸卡片（桌面版，左側邊欄）
// ─────────────────────────────────────────
function renderTimelineCards(currentKey) {
  const container = document.getElementById('piaget-timeline');
  if (!container) return;

  container.innerHTML = '';

  PIAGET_STAGE_MAP.forEach((stage, idx) => {
    const stageKey = PIAGET_KEY_MAP[idx];
    const isPast = idx < window.currentMilestoneIndex;
    const isCurrent = stageKey === currentKey;

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

    card.addEventListener('click', () => switchStage(stageKey));
    container.appendChild(card);
  });
}

// ─────────────────────────────────────────
// 渲染階段 chips（手機版，頂部水平可滑動）
// ─────────────────────────────────────────
function renderStageChips(currentKey) {
  const container = document.getElementById('piaget-stage-chips');
  if (!container) return;

  container.innerHTML = '';

  PIAGET_STAGE_MAP.forEach((stage, idx) => {
    const stageKey = PIAGET_KEY_MAP[idx];
    const isPast = idx < window.currentMilestoneIndex;
    const isCurrent = stageKey === currentKey;

    const chip = document.createElement('button');
    chip.className = `piaget-stage-chip ${isCurrent ? 'active' : isPast ? 'past' : ''}`;
    chip.setAttribute('role', 'tab');
    chip.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    // chip 標籤取階段名最後一段（如「反射練習」），避免過長
    const shortName = stage.name.split('—').pop().trim();
    chip.innerHTML = `<span>${shortName}</span><span class="chip-age">${stage.age}</span>`;

    chip.addEventListener('click', () => switchStage(stageKey));
    container.appendChild(chip);

    // 當前階段 chip 捲動置中
    if (isCurrent) {
      requestAnimationFrame(() => {
        chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' in chip ? 'instant' : 'auto' });
      });
    }
  });
}

// ─────────────────────────────────────────
// 底部上一/下一階段按鈕（手機版）
// ─────────────────────────────────────────
function updateStageNavButtons(currentKey) {
  const prevBtn = document.getElementById('piaget-prev-btn');
  const nextBtn = document.getElementById('piaget-next-btn');
  if (!prevBtn || !nextBtn) return;

  const idx = PIAGET_KEY_MAP.indexOf(currentKey);
  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx >= PIAGET_KEY_MAP.length - 1;
}

function setupStageNavButtons() {
  const prevBtn = document.getElementById('piaget-prev-btn');
  const nextBtn = document.getElementById('piaget-next-btn');
  if (!prevBtn || !nextBtn) return;

  prevBtn.addEventListener('click', () => {
    const idx = PIAGET_KEY_MAP.indexOf(currentStageKey);
    if (idx > 0) switchStage(PIAGET_KEY_MAP[idx - 1]);
  });

  nextBtn.addEventListener('click', () => {
    const idx = PIAGET_KEY_MAP.indexOf(currentStageKey);
    if (idx < PIAGET_KEY_MAP.length - 1) switchStage(PIAGET_KEY_MAP[idx + 1]);
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
// 設置手風琴展開/收起事件，並還原先前的展開狀態
// ─────────────────────────────────────────
function setupAccordionToggle() {
  const headers = document.querySelectorAll('.piaget-accordion-header');

  headers.forEach(header => {
    const item = header.closest('.piaget-accordion-item');
    const content = item.querySelector('.piaget-accordion-content');
    const toggle = header.querySelector('.piaget-accordion-toggle');
    const itemId = header.textContent.replace('›', '').trim();

    const applyState = (open) => {
      content.classList.toggle('collapsed', !open);
      toggle.classList.toggle('collapsed', !open);
      header.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    // 還原展開狀態（跨階段切換保留，方便比較不同階段同一段落）
    applyState(openAccordions.has(itemId));

    header.addEventListener('click', () => {
      const isOpen = openAccordions.has(itemId);
      if (isOpen) openAccordions.delete(itemId);
      else openAccordions.add(itemId);
      applyState(!isOpen);
    });
  });
}

// ─────────────────────────────────────────
// 切換階段（時間軸卡片 / chips / 上下階段按鈕共用）
// ─────────────────────────────────────────
function switchStage(stageKey) {
  if (stageKey === currentStageKey) return;
  renderStage(stageKey);

  // 內容捲回頂部，避免停留在上一階段的位置
  const body = document.getElementById('piaget-modal-body');
  if (body) body.scrollTop = 0;
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

// 上一/下一階段按鈕只需綁定一次
setupStageNavButtons();

// ─────────────────────────────────────────
// 掛載到 window（相容 HTML inline handlers）
// ─────────────────────────────────────────
window.openPiagetModal = openPiagetModal;
window.closePiagetModal = closePiagetModal;
