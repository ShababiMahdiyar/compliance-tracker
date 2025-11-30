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

export interface RadialRing {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-radial-progress',
  templateUrl: './radial-progress.html',
  styleUrl: './radial-progress.scss',
})
export class RadialProgress {
  rings = input.required<RadialRing[]>();
  size = input(260);

  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('chart');
  private readonly tooltipRef = viewChild<ElementRef<HTMLDivElement>>('tooltip');
  private readonly viewReady = signal(false);

  constructor() {
    afterNextRender(() => {
      this.viewReady.set(true);
    });

    effect(() => {
      const ready = this.viewReady();
      const data = this.rings();
      const svgEl = this.svgRef();
      const tooltipEl = this.tooltipRef();
      if (ready && data.length > 0 && svgEl && tooltipEl) {
        requestAnimationFrame(() => this.render(data, svgEl.nativeElement, tooltipEl.nativeElement));
      }
    });
  }

  private render(data: RadialRing[], svgEl: SVGSVGElement, tooltipEl: HTMLDivElement): void {
    const svg = d3.select(svgEl);
    const tooltip = d3.select(tooltipEl);
    svg.selectAll('*').remove();

    const size = this.size();
    const cx = size / 2;
    const cy = size / 2;
    const ringWidth = 14;
    const ringGap = 6;
    const outerStart = Math.min(cx, cy) - 8;

    svg.attr('viewBox', `0 0 ${size} ${size}`);

    const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

    // Background tracks
    data.forEach((ring, i) => {
      const outerR = outerStart - i * (ringWidth + ringGap);
      const innerR = outerR - ringWidth;

      const arc = d3.arc<unknown>()
        .innerRadius(innerR)
        .outerRadius(outerR)
        .startAngle(0)
        .endAngle(2 * Math.PI)
        .cornerRadius(ringWidth / 2);

      g.append('path')
        .attr('d', arc(null as never)!)
        .attr('fill', '#1e293b')
        .attr('opacity', 0.25);
    });

    // Animated value arcs
    data.forEach((ring, i) => {
      const outerR = outerStart - i * (ringWidth + ringGap);
      const innerR = outerR - ringWidth;
      const endAngle = (ring.value / 100) * 2 * Math.PI;

      const arc = d3.arc<{ endAngle: number }>()
        .innerRadius(innerR)
        .outerRadius(outerR)
        .startAngle(0)
        .cornerRadius(ringWidth / 2);

      const path = g.append('path')
        .datum({ endAngle: 0 })
        .attr('d', (d) => arc(d)!)
        .attr('fill', ring.color)
        .attr('cursor', 'pointer')
        .attr('filter', `drop-shadow(0 0 4px ${ring.color}40)`);

      path
        .transition()
        .duration(1000)
        .delay(i * 120)
        .ease(d3.easeCubicOut)
        .attrTween('d', () => {
          const interpolate = d3.interpolate(0, endAngle);
          return (t: number) => arc({ endAngle: interpolate(t) })!;
        });

      path
        .on('mouseover', (event: MouseEvent) => {
          d3.select(event.currentTarget as SVGPathElement)
            .transition()
            .duration(150)
            .attr('filter', `drop-shadow(0 0 8px ${ring.color}80)`);

          tooltip
            .html(
              `<strong>${ring.label}</strong>` +
              `<span class="radial-tip__value" style="color:${ring.color}">${ring.value}%</span>`
            )
            .style('opacity', '1');
        })
        .on('mouseout', (event: MouseEvent) => {
          d3.select(event.currentTarget as SVGPathElement)
            .transition()
            .duration(200)
            .attr('filter', `drop-shadow(0 0 4px ${ring.color}40)`);

          tooltip.style('opacity', '0');
        });
    });

    // Center label
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', -6)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', '28px')
      .attr('font-weight', '700')
      .attr('fill', '#0f172a')
      .text(() => {
        const avg = Math.round(data.reduce((s, r) => s + r.value, 0) / data.length);
        return `${avg}%`;
      })
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay(data.length * 120)
      .attr('opacity', 1);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', 18)
      .attr('font-family', "'DM Sans', sans-serif")
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#94a3b8')
      .attr('letter-spacing', '1.5px')
      .text('AVG. SCORE')
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay(data.length * 120 + 100)
      .attr('opacity', 1);
  }
}
