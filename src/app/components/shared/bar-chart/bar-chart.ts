import { Component, input } from '@angular/core';

export interface BarChartItem {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

@Component({
  selector: 'app-bar-chart',
  imports: [],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
})
export class BarChart {
  readonly items = input.required<BarChartItem[]>();
  readonly title = input<string>('');
  readonly unit = input<string>('%');

  protected getWidth(item: BarChartItem): number {
    const max = item.maxValue ?? 100;
    return Math.min(100, (item.value / max) * 100);
  }

  protected getColor(item: BarChartItem): string {
    if (item.color) return item.color;
    const v = item.maxValue ? (item.value / item.maxValue) * 100 : item.value;
    if (v >= 80) return 'var(--ct-emerald-500)';
    if (v >= 50) return 'var(--ct-amber-500)';
    return 'var(--ct-red-500)';
  }
}
