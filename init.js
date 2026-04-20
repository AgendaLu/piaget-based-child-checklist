// 简化的初始化脚本
import { MILESTONES } from './milestones.js';
import { D3Timeline } from './timeline.js';

// 从 app.js 导入后暴露到 window
let appModule = null;
let drawerModule = null;

export async function init() {
  appModule = await import('./app.js');
  drawerModule = await import('./drawer.js');

  // 暴露关键函数到 window
  window.saveAndStart = appModule.saveAndStart;
  window.changeProfile = appModule.changeProfile;
  window.resetChecks = appModule.resetChecks;
  window.toggleTimeline = () => {};
  window.openPiagetDrawer = drawerModule.openPiagetDrawer;
  window.closePiagetDrawer = drawerModule.closePiagetDrawer;

  // 初始化应用
  const originalInitApp = appModule.initApp;
  window.initApp = () => {
    originalInitApp();
    // 初始化 D3 时间轴
    setTimeout(() => {
      const idx = appModule.currentMilestoneIndex;
      if (document.getElementById('d3-timeline-container')) {
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
    }, 0);
  };

  // 检查是否有保存的数据，如果有则初始化应用
  if (localStorage.getItem('baby_name') && localStorage.getItem('baby_dob')) {
    window.initApp();
  }
}

init().catch(console.error);
