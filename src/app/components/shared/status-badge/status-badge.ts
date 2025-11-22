import { Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AssignmentStatus } from '../../../models/assignment.model';

@Component({
  selector: 'app-status-badge',
  imports: [MatIcon],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  readonly status = input.required<AssignmentStatus>();

  protected readonly config = computed(() => {
    const map: Record<AssignmentStatus, { label: string; cssClass: string; icon: string }> = {
      'not-started': { label: 'Not Started', cssClass: 'badge--not-started', icon: 'schedule' },
      'in-progress': { label: 'In Progress', cssClass: 'badge--in-progress', icon: 'play_circle_outline' },
      'completed': { label: 'Completed', cssClass: 'badge--completed', icon: 'check_circle_outline' },
      'overdue': { label: 'Overdue', cssClass: 'badge--overdue', icon: 'warning_amber' },
      'expired': { label: 'Expired', cssClass: 'badge--expired', icon: 'block' },
    };
    return map[this.status()];
  });
}
