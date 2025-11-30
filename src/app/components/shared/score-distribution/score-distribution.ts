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

export interface ScorePoint {
  score: number;
  label: string;
}

@Component({
  selector: 'app-score-distribution',
  templateUrl: './score-distribution.html',
  styleUrl: './score-distribution.scss',
})
export class ScoreDistribution {
  scores = input.required<ScorePoint[]>();

  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('chart');
  private readonly tooltipRef = viewChild<ElementRef<HTMLDivElement>>('tooltip');
  private readonly viewReady = signal(false);

  constructor() {
    afterNextRender(() => {
      this.viewReady.set(true);
    });

    effect(() => {
      const ready = this.viewReady();
      const data = this.scores();
      const svgEl = this.svgRef();
      const tooltipEl = this.tooltipRef();
      if (ready && data.length > 0 && svgEl && tooltipEl) {
        requestAnimationFrame(() => this.render(data, svgEl.nativeElement, tooltipEl.nativeElement));
      }
    });
  }

  private render(data: ScorePoint[], svgEl: SVGSVGElement, tooltipEl: HTMLDivElement): void {
    const svg = d3.select(svgEl);
    const tooltip = d3.select(tooltipEl);
    svg.selectAll('*').remove();

    const margin = { top: 16, right: 20, bottom: 44, left: 40 };
    const width = 520;
    const height = 220;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'score-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.35);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.02);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const values = data.map((d) => d.score);

    const x = d3.scaleLinear().domain([50, 100]).range([0, innerW]).clamp(true);

    const bins = d3
      .bin()
      .domain(x.domain() as [number, number])
      .thresholds(10)(values);

    const maxCount = d3.max(bins, (b) => b.length) ?? 1;
    const y = d3.scaleLinear().domain([0, maxCount + 1]).range([innerH, 0]);

    // Grid lines
    y.ticks(4).forEach((tick) => {
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', y(tick)).attr('y2', y(tick))
        .attr('stroke', '#e2e8f0')
        .attr('stroke-dasharray', '2,4');
    });

    // Area data
    const areaPoints: [number, number][] = bins.map((bin) => [
      ((bin.x0 ?? 0) + (bin.x1 ?? 0)) / 2,
      bin.length,
    ]);
    areaPoints.unshift([x.domain()[0], 0]);
    areaPoints.push([x.domain()[1], 0]);

    const area = d3
      .area<[number, number]>()
      .x((d) => x(d[0]))
      .y0(innerH)
      .y1((d) => y(d[1]))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const line = d3
      .line<[number, number]>()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Area fill
    g.append('path')
      .datum(areaPoints)
      .attr('d', area)
      .attr('fill', 'url(#score-area-grad)')
      .attr('opacity', 0)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('opacity', 1);

    // Line
    const linePath = g
      .append('path')
      .datum(areaPoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2.5)
      .attr('stroke-linejoin', 'round');

    const totalLength = (linePath.node() as SVGPathElement)?.getTotalLength() ?? 0;
    linePath
      .attr('stroke-dasharray', totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Mean line
    const mean = d3.mean(values) ?? 0;
    g.append('line')
      .attr('x1', x(mean)).attr('x2', x(mean))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0)
      .transition()
      .delay(800)
      .duration(400)
      .attr('opacity', 0.6);

    g.append('text')
      .attr('x', x(mean) + 6)
      .attr('y', 12)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#f59e0b')
      .text(`avg ${Math.round(mean)}%`)
      .attr('opacity', 0)
      .transition()
      .delay(900)
      .duration(400)
      .attr('opacity', 1);

    // Score dots
    const dotY = innerH - 14;
    g.selectAll('.score-dot')
      .data(data)
      .join('circle')
      .attr('class', 'score-dot')
      .attr('cx', (d) => x(d.score))
      .attr('cy', () => dotY + Math.random() * 8 - 4)
      .attr('r', 0)
      .attr('fill', (d) => d.score >= 85 ? '#10b981' : d.score >= 70 ? '#f59e0b' : '#ef4444')
      .attr('opacity', 0.7)
      .attr('cursor', 'pointer')
      .on('mouseover', (event: MouseEvent, d: ScorePoint) => {
        d3.select(event.currentTarget as SVGCircleElement)
          .transition()
          .duration(100)
          .attr('r', 6)
          .attr('opacity', 1);

        const color = d.score >= 85 ? '#10b981' : d.score >= 70 ? '#f59e0b' : '#ef4444';
        tooltip
          .html(
            `<strong>${d.label}</strong>` +
            `<span class="sd-tip__score" style="color:${color}">${d.score}%</span>`
          )
          .style('opacity', '1')
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 40}px`);
      })
      .on('mouseout', (event: MouseEvent) => {
        d3.select(event.currentTarget as SVGCircleElement)
          .transition()
          .duration(200)
          .attr('r', 3.5)
          .attr('opacity', 0.7);

        tooltip.style('opacity', '0');
      })
      .transition()
      .duration(400)
      .delay((_, i) => 600 + i * 30)
      .ease(d3.easeBackOut)
      .attr('r', 3.5);

    // X-axis
    g.append('g')
      .attr('transform', `translate(0, ${innerH})`)
      .call(
        d3.axisBottom(x)
          .ticks(6)
          .tickFormat((d) => `${d}%`)
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

    // Y-axis
    g.append('g')
      .call(
        d3.axisLeft(y).ticks(4).tickFormat(d3.format('d'))
      )
      .call((axis) => {
        axis.select('.domain').remove();
        axis.selectAll('.tick line').remove();
        axis.selectAll('.tick text')
          .attr('font-family', "'JetBrains Mono', monospace")
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .attr('fill', '#64748b');
      });

    // Label
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 34)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'DM Sans', sans-serif")
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b')
      .attr('letter-spacing', '0.8px')
      .text('SCORE');
  }
}
