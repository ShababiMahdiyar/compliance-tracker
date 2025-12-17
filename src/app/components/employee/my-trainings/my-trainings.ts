import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, SlicePipe } from '@angular/common';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatTabGroup, MatTab, MatTabChangeEvent } from '@angular/material/tabs';
import { AuthService } from '../../../services/auth.service';
import { AssignmentService } from '../../../services/assignment.service';
import { TrainingService } from '../../../services/training.service';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import {
  AssignmentStatus,
  TrainingAssignment,
} from '../../../models/assignment.model';
import { Training } from '../../../models/training.model';

type TabFilter = 'all' | AssignmentStatus;

const TAB_FILTERS: TabFilter[] = [
  'all',
  'not-started',
  'in-progress',
  'completed',
  'overdue',
];

@Component({
  selector: 'app-my-trainings',
  imports: [
    DatePipe,
    SlicePipe,
    MatCard,
    MatIcon,
    MatTabGroup,
    MatTab,
    StatusBadge,
  ],
  templateUrl: './my-trainings.html',
  styleUrl: './my-trainings.scss',
})
export class MyTrainings {
  private authService = inject(AuthService);
  private assignmentService = inject(AssignmentService);
  private trainingService = inject(TrainingService);
  private router = inject(Router);

  readonly activeTab = signal<TabFilter>('all');

  private readonly user = this.authService.currentUser;

  private readonly assignments = toSignal(
    this.assignmentService.getByEmployee(this.user()?.id ?? ''),
    { initialValue: [] as TrainingAssignment[] }
  );

  private readonly trainings = toSignal(this.trainingService.getAll(), {
    initialValue: [] as Training[],
  });

  private readonly trainingMap = computed(() => {
    const map = new Map<string, Training>();
    for (const t of this.trainings()) {
      map.set(t.id, t);
    }
    return map;
  });

  readonly filteredAssignments = computed(() => {
    const map = this.trainingMap();
    const tab = this.activeTab();
    const items = this.assignments()
      .filter((a) => tab === 'all' || a.status === tab)
      .map((a) => ({
        assignment: a,
        training: map.get(a.trainingId),
      }))
      .filter(
        (item): item is { assignment: TrainingAssignment; training: Training } =>
          item.training !== undefined
      );
    return items;
  });

  onTabChange(event: MatTabChangeEvent): void {
    this.activeTab.set(TAB_FILTERS[event.index]);
  }

  goToDetail(assignmentId: string): void {
    this.router.navigate(['/employee/trainings', assignmentId]);
  }
}
