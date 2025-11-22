import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-compliance-progress-bar',
  imports: [],
  templateUrl: './compliance-progress-bar.html',
  styleUrl: './compliance-progress-bar.scss',
})
export class ComplianceProgressBar {
  readonly value = input.required<number>();
  readonly label = input<string>('');
  readonly showPercentage = input(true);
  readonly height = input(8);

  protected readonly barColor = computed(() => {
    const v = this.value();
    if (v >= 80) return 'var(--ct-emerald-500)';
    if (v >= 50) return 'var(--ct-amber-500)';
    return 'var(--ct-red-500)';
  });

  protected readonly barWidth = computed(() => Math.min(100, Math.max(0, this.value())));
}
