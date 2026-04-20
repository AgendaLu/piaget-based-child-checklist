// 简化的初始化脚本 - 直接导入和暴露所有函数
import { MILESTONES, DOMAIN_META } from './milestones.js';
import { PIAGET_KEY_MAP, PIAGET_DATA } from './piaget.js';
import * as appModule from './app.js';
import * as drawerModule from './drawer.js';
import { D3Timeline } from './timeline.js';

// 立即暴露所有函数到 window
window.saveAndStart = appModule.saveAndStart;
window.changeProfile = appModule.changeProfile;
window.resetChecks = appModule.resetChecks;
window.openPiagetDrawer = drawerModule.openPiagetDrawer;
window.closePiagetDrawer = drawerModule.closePiagetDrawer;
window.toggleTimeline = () => {};

// 创建包装的 initApp 来处理 D3 初始化
const originalInitApp = appModule.initApp;
window.initApp = () => {
  console.log('[init.js] Calling originalInitApp');
  originalInitApp();

  // 初始化 D3 时间轴
  setTimeout(() => {
    console.log('[init.js] Initializing D3Timeline');
    const idx = appModule.currentMilestoneIndex;
    const container = document.getElementById('d3-timeline-container');
    if (container) {
      new D3Timeline('d3-timeline-container', MILESTONES, idx, {
        onNodeClick: (newIdx) => {
          const age = appModule.calcAge(localStorage.getItem('baby_dob'));
          const type = newIdx < idx ? 'past'
                     : newIdx === idx ? 'current'
                     : 'future';
          appModule.renderTodoCard(newIdx, age, type);
          appModule.currentMilestoneIndex = newIdx;
        }
      });
    }
  }, 100);
};

// 检查是否有保存的数据，如果有则初始化应用
console.log('[init.js] Script loaded. Checking for saved data...');
if (localStorage.getItem('baby_name') && localStorage.getItem('baby_dob')) {
  console.log('[init.js] Found saved data, initializing app');
  window.initApp();
}
