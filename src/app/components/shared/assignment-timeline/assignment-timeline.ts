import {
  Component,
  ElementRef,
  afterNextRender,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import * as d3 from 'd3';

export interface TimelineItem {
  id: string;
  employeeName: string;
  trainingTitle: string;
  status: string;
  assignedDate: Date;
  dueDate: Date;
  completedDate: Date | null;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  'in-progress': '#f59e0b',
  'not-started': '#64748b',
  overdue: '#ef4444',
  expired: '#7c3aed',
};

@Component({
  selector: 'app-assignment-timeline',
  templateUrl: './assignment-timeline.html',
  styleUrl: './assignment-timeline.scss',
})
export class AssignmentTimeline {
  items = input.required<TimelineItem[]>();

  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('chart');
  private readonly tooltipRef = viewChild<ElementRef<HTMLDivElement>>('tooltip');
  private readonly viewReady = signal(false);

  constructor() {
    afterNextRender(() => {
      this.viewReady.set(true);
    });

    effect(() => {
      const ready = this.viewReady();
      const data = this.items();
      const svgEl = this.svgRef();
      const tooltipEl = this.tooltipRef();
      if (ready && data.length > 0 && svgEl && tooltipEl) {
        requestAnimationFrame(() => this.render(data, svgEl.nativeElement, tooltipEl.nativeElement));
      }
    });
  }

  private render(data: TimelineItem[], svgEl: SVGSVGElement, tooltipEl: HTMLDivElement): void {
    const svg = d3.select(svgEl);
    const tooltip = d3.select(tooltipEl);
    svg.selectAll('*').remove();

    const employeeGroups = d3.group(data, (d) => d.employeeName);
    const employees = [...employeeGroups.keys()].slice(0, 8);

    const margin = { top: 20, right: 24, bottom: 40, left: 120 };
    const rowHeight = 40;
    const width = 700;
    const height = margin.top + margin.bottom + employees.length * rowHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const allDates = data.flatMap((d) => {
      const dates = [d.assignedDate, d.dueDate];
      if (d.completedDate) dates.push(d.completedDate);
      return dates;
    });

    const x = d3
      .scaleTime()
      .domain(d3.extent(allDates) as [Date, Date])
      .range([0, width - margin.left - margin.right])
      .nice();

    const y = d3
      .scaleBand<string>()
      .domain(employees)
      .range([0, employees.length * rowHeight])
      .padding(0.35);

    // Grid lines
    const xTicks = x.ticks(6);
    g.selectAll('.grid-line')
      .data(xTicks)
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', (d) => x(d))
      .attr('x2', (d) => x(d))
      .attr('y1', 0)
      .attr('y2', employees.length * rowHeight)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,4');

    // Row backgrounds
    employees.forEach((emp, i) => {
      if (i % 2 === 0) {
        g.append('rect')
          .attr('x', -margin.left + 4)
          .attr('y', y(emp)! - y.bandwidth() * 0.15)
          .attr('width', width - 8)
          .attr('height', rowHeight)
          .attr('fill', 'rgba(241, 245, 249, 0.5)')
          .attr('rx', 4);
      }
    });

    // Y-axis labels
    g.selectAll('.y-label')
      .data(employees)
      .join('text')
      .attr('class', 'y-label')
      .attr('x', -14)
      .attr('y', (d) => y(d)! + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('font-family', "'DM Sans', sans-serif")
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#475569')
      .text((d) => d);

    // X-axis
    g.append('g')
      .attr('transform', `translate(0, ${employees.length * rowHeight + 8})`)
      .call(
        d3.axisBottom(x)
          .ticks(6)
          .tickFormat((d) => d3.timeFormat('%b %y')(d as Date))
      )
      .call((axis) => {
        axis.select('.domain').attr('stroke', '#cbd5e1');
        axis.selectAll('.tick line').attr('stroke', '#cbd5e1');
        axis.selectAll('.tick text')
          .attr('font-family', "'JetBrains Mono', monospace")
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .attr('fill', '#94a3b8');
      });

    // Assignment bars
    const bars = g
      .selectAll<SVGGElement, TimelineItem>('.assignment-bar')
      .data(data.filter((d) => employees.includes(d.employeeName)))
      .join('g')
      .attr('class', 'assignment-bar');

    // Horizontal line (assigned → due)
    bars
      .append('line')
      .attr('x1', (d) => x(d.assignedDate))
      .attr('x2', (d) => x(d.assignedDate))
      .attr('y1', (d) => y(d.employeeName)! + y.bandwidth() / 2)
      .attr('y2', (d) => y(d.employeeName)! + y.bandwidth() / 2)
      .attr('stroke', (d) => STATUS_COLORS[d.status] ?? '#64748b')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0.7)
      .transition()
      .duration(800)
      .delay((_, i) => i * 40)
      .ease(d3.easeCubicOut)
      .attr('x2', (d) => x(d.dueDate));

    // Start dot
    bars
      .append('circle')
      .attr('cx', (d) => x(d.assignedDate))
      .attr('cy', (d) => y(d.employeeName)! + y.bandwidth() / 2)
      .attr('r', 0)
      .attr('fill', (d) => STATUS_COLORS[d.status] ?? '#64748b')
      .transition()
      .duration(400)
      .delay((_, i) => i * 40 + 200)
      .ease(d3.easeBackOut)
      .attr('r', 4);

    // End markers
    bars.each(function (d, i) {
      const group = d3.select(this);
      const yPos = y(d.employeeName)! + y.bandwidth() / 2;

      if (d.completedDate) {
        const cx = x(d.completedDate);
        group
          .append('path')
          .attr('d', d3.symbol(d3.symbolDiamond, 60)())
          .attr('transform', `translate(${cx}, ${yPos}) scale(0)`)
          .attr('fill', STATUS_COLORS[d.status])
          .transition()
          .duration(400)
          .delay(i * 40 + 500)
          .ease(d3.easeBackOut)
          .attr('transform', `translate(${cx}, ${yPos}) scale(1)`);
      }

      group
        .append('circle')
        .attr('cx', x(d.dueDate))
        .attr('cy', yPos)
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', STATUS_COLORS[d.status] ?? '#64748b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', d.status === 'overdue' ? '2,2' : 'none')
        .transition()
        .duration(400)
        .delay(i * 40 + 400)
        .ease(d3.easeBackOut)
        .attr('r', 5);
    });

    // Hover overlays
    bars
      .append('rect')
      .attr('x', (d) => Math.min(x(d.assignedDate), x(d.dueDate)) - 4)
      .attr('y', (d) => y(d.employeeName)! - 2)
      .attr('width', (d) => Math.abs(x(d.dueDate) - x(d.assignedDate)) + 8)
      .attr('height', y.bandwidth() + 4)
      .attr('fill', 'transparent')
      .attr('cursor', 'pointer')
      .on('mouseover', (event: MouseEvent, d: TimelineItem) => {
        const statusLabel = d.status.replace('-', ' ');
        const completed = d.completedDate
          ? `<span class="tl-tip__detail">Completed: ${d3.timeFormat('%b %d, %Y')(d.completedDate)}</span>`
          : '';

        tooltip
          .html(
            `<strong>${d.trainingTitle}</strong>` +
            `<span class="tl-tip__status" style="color:${STATUS_COLORS[d.status]}">${statusLabel}</span>` +
            `<span class="tl-tip__detail">Assigned: ${d3.timeFormat('%b %d, %Y')(d.assignedDate)}</span>` +
            `<span class="tl-tip__detail">Due: ${d3.timeFormat('%b %d, %Y')(d.dueDate)}</span>` +
            completed
          )
          .style('opacity', '1')
          .style('left', `${event.offsetX + 16}px`)
          .style('top', `${event.offsetY - 12}px`);
      })
      .on('mousemove', (event: MouseEvent) => {
        tooltip
          .style('left', `${event.offsetX + 16}px`)
          .style('top', `${event.offsetY - 12}px`);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', '0');
      });
  }
}
