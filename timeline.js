// ─────────────────────────────────────────
// D3 Timeline Component
// 交互式时间轴可视化
// ─────────────────────────────────────────

export class D3Timeline {
  constructor(containerId, milestones, currentIdx, callbacks) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.milestones = milestones;
    this.currentIdx = currentIdx;
    this.callbacks = callbacks;

    this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
    this.height = 80;
    this.width = this.container.offsetWidth - this.margin.left - this.margin.right;

    this.render();
  }

  render() {
    // 清空容器
    this.container.innerHTML = '';

    // 创建 SVG
    const svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // 水平尺度
    const xScale = d3.scaleLinear()
      .domain([0, this.milestones.length - 1])
      .range([0, this.width]);

    // 背景轨道
    svg.append('line')
      .attr('x1', 0)
      .attr('y1', this.height / 2)
      .attr('x2', this.width)
      .attr('y2', this.height / 2)
      .attr('stroke', 'oklch(87% 0.02 280)')
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round');

    // 进度条
    const progressWidth = xScale(this.currentIdx);
    svg.append('line')
      .attr('x1', 0)
      .attr('y1', this.height / 2)
      .attr('x2', progressWidth)
      .attr('y2', this.height / 2)
      .attr('stroke', 'oklch(70% 0.15 20)')
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round');

    // 节点
    svg.selectAll('.timeline-node')
      .data(this.milestones)
      .enter()
      .append('g')
      .attr('class', 'timeline-node')
      .attr('transform', (d, i) => `translate(${xScale(i)},${this.height / 2})`)
      .append('circle')
      .attr('r', (d, i) => {
        if (i < this.currentIdx) return 6;
        if (i === this.currentIdx) return 10;
        return 4;
      })
      .attr('fill', (d, i) => {
        if (i < this.currentIdx) return 'oklch(65% 0.25 142)';
        if (i === this.currentIdx) return 'oklch(60% 0.20 200)';
        return 'oklch(87% 0.02 280)';
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (e, d) => {
        this.callbacks?.onNodeClick?.(this.milestones.indexOf(d));
      })
      .on('mouseover', function() {
        d3.select(this).transition().duration(200).attr('r', 8);
      })
      .on('mouseout', ((ci) => function(e, d) {
        const idx = ci.milestones.indexOf(d);
        const r = idx < ci.currentIdx ? 6 : idx === ci.currentIdx ? 10 : 4;
        d3.select(this).transition().duration(200).attr('r', r);
      })(this));

    // 标签
    svg.selectAll('.timeline-label')
      .data(this.milestones)
      .enter()
      .append('text')
      .attr('class', 'timeline-label')
      .attr('x', (d, i) => xScale(i))
      .attr('y', this.height / 2 + 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', 'oklch(45% 0.08 280)')
      .attr('font-weight', (d, i) => i === this.currentIdx ? '600' : '400')
      .text(d => d.label);
  }

  update(newIdx) {
    this.currentIdx = newIdx;
    this.render();
  }
}
