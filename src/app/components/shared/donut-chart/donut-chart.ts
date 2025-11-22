import { Component, computed, input } from '@angular/core';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-donut-chart',
  imports: [],
  templateUrl: './donut-chart.html',
  styleUrl: './donut-chart.scss',
})
export class DonutChart {
  readonly segments = input.required<DonutSegment[]>();
  readonly centerValue = input<string>('');
  readonly centerLabel = input<string>('');
  readonly size = input(180);

  protected readonly paths = computed(() => {
    const segs = this.segments();
    const total = segs.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return [];

    const cx = 90;
    const cy = 90;
    const outerR = 85;
    const innerR = 55;
    let startAngle = -90;

    return segs.map(seg => {
      const angle = (seg.value / total) * 360;
      const endAngle = startAngle + angle;

      const startOuter = this.polarToCartesian(cx, cy, outerR, startAngle);
      const endOuter = this.polarToCartesian(cx, cy, outerR, endAngle);
      const startInner = this.polarToCartesian(cx, cy, innerR, endAngle);
      const endInner = this.polarToCartesian(cx, cy, innerR, startAngle);

      const largeArc = angle > 180 ? 1 : 0;

      const d = [
        `M ${startOuter.x} ${startOuter.y}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
        `L ${startInner.x} ${startInner.y}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
        'Z',
      ].join(' ');

      startAngle = endAngle;
      return { d, color: seg.color, label: seg.label, value: seg.value };
    });
  });

  private polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
}
