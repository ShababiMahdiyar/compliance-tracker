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
import { HeatmapCell } from '../../../models/compliance.model';

@Component({
  selector: 'app-compliance-heatmap',
  templateUrl: './compliance-heatmap.html',
  styleUrl: './compliance-heatmap.scss',
})
export class ComplianceHeatmap {
  cells = input.required<HeatmapCell[]>();

  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('chart');
  private readonly tooltipRef = viewChild<ElementRef<HTMLDivElement>>('tooltip');
  private readonly viewReady = signal(false);

  constructor() {
    afterNextRender(() => {
      this.viewReady.set(true);
    });

    effect(() => {
      const ready = this.viewReady();
      const data = this.cells();
      const svgEl = this.svgRef();
      const tooltipEl = this.tooltipRef();
      if (ready && data.length > 0 && svgEl && tooltipEl) {
        // Schedule D3 rendering outside Angular's change detection
        requestAnimationFrame(() => this.render(data, svgEl.nativeElement, tooltipEl.nativeElement));
      }
    });
  }

  private render(data: HeatmapCell[], svgEl: SVGSVGElement, tooltipEl: HTMLDivElement): void {
    const svg = d3.select(svgEl);
    const tooltip = d3.select(tooltipEl);

    svg.selectAll('*').remove();

    const departments = [...new Set(data.map((d) => d.department))].sort();
    const categories = [...new Set(data.map((d) => d.category))].sort();

    const margin = { top: 4, right: 20, bottom: 64, left: 120 };
    const cellSize = 56;
    const cellGap = 4;
    const width = margin.left + margin.right + categories.length * (cellSize + cellGap);
    const height = margin.top + margin.bottom + departments.length * (cellSize + cellGap);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3
      .scaleBand<string>()
      .domain(categories)
      .range([0, categories.length * (cellSize + cellGap)])
      .padding(cellGap / (cellSize + cellGap));

    const y = d3
      .scaleBand<string>()
      .domain(departments)
      .range([0, departments.length * (cellSize + cellGap)])
      .padding(cellGap / (cellSize + cellGap));

    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 50, 100])
      .range(['#1e293b', '#f59e0b', '#10b981'])
      .clamp(true);

    // Cell backgrounds
    for (const dept of departments) {
      for (const cat of categories) {
        g.append('rect')
          .attr('x', x(cat)!)
          .attr('y', y(dept)!)
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .attr('rx', 8)
          .attr('fill', '#0f172a')
          .attr('opacity', 0.35);
      }
    }

    // Data cells
    const cells = g
      .selectAll<SVGRectElement, HeatmapCell>('.heatmap-cell')
      .data(data, (d) => `${d.department}-${d.category}`)
      .join('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', (d) => x(d.category)!)
      .attr('y', (d) => y(d.department)!)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('rx', 8)
      .attr('fill', (d) => colorScale(d.rate))
      .attr('opacity', 0)
      .attr('cursor', 'pointer');

    cells
      .transition()
      .duration(600)
      .delay((_, i) => i * 60)
      .ease(d3.easeCubicOut)
      .attr('opacity', 1);

    // Rate labels
    const labels = g
      .selectAll<SVGTextElement, HeatmapCell>('.cell-label')
      .data(data, (d) => `${d.department}-${d.category}-label`)
      .join('text')
      .attr('class', 'cell-label')
      .attr('x', (d) => x(d.category)! + x.bandwidth() / 2)
      .attr('y', (d) => y(d.department)! + y.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', '13px')
      .attr('font-weight', '700')
      .attr('fill', (d) => (d.rate >= 65 ? '#fff' : d.rate >= 30 ? '#1a1a2e' : '#94a3b8'))
      .attr('opacity', 0)
      .text((d) => `${d.rate}%`);

    labels
      .transition()
      .duration(400)
      .delay((_, i) => 300 + i * 60)
      .ease(d3.easeCubicOut)
      .attr('opacity', 1);

    // Hover
    cells
      .on('mouseover', (event: MouseEvent, d: HeatmapCell) => {
        d3.select(event.currentTarget as SVGRectElement)
          .transition()
          .duration(150)
          .attr('stroke', '#fbbf24')
          .attr('stroke-width', 2);

        const catLabel =
          d.category.charAt(0).toUpperCase() + d.category.slice(1).replace('-', ' ');

        tooltip
          .html(
            `<strong>${d.department}</strong> × <strong>${catLabel}</strong>
             <span class="heatmap-tip__rate">${d.rate}%</span>
             <span class="heatmap-tip__detail">${d.completed} of ${d.total} completed</span>`
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
      .on('mouseout', (event: MouseEvent) => {
        d3.select(event.currentTarget as SVGRectElement)
          .transition()
          .duration(200)
          .attr('stroke', 'none');

        tooltip.style('opacity', '0');
      });

    // Y-axis labels
    g.selectAll<SVGTextElement, string>('.y-label')
      .data(departments)
      .join('text')
      .attr('class', 'y-label')
      .attr('x', -14)
      .attr('y', (d) => y(d)! + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('font-family', "'DM Sans', sans-serif")
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#cbd5e1')
      .text((d) => d);

    // X-axis labels
    g.selectAll<SVGTextElement, string>('.x-label')
      .data(categories)
      .join('text')
      .attr('class', 'x-label')
      .attr(
        'transform',
        (d) =>
          `translate(${x(d)! + x.bandwidth() / 2}, ${departments.length * (cellSize + cellGap) + 14}) rotate(-35)`
      )
      .attr('text-anchor', 'end')
      .attr('font-family', "'DM Sans', sans-serif")
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', '#94a3b8')
      .text((d) => d.charAt(0).toUpperCase() + d.slice(1).replace('-', ' '));
  }
}
