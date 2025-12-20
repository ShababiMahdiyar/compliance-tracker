import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import {
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatCellDef,
  MatHeaderRowDef,
  MatRowDef,
  MatHeaderCell,
  MatCell,
  MatHeaderRow,
  MatRow,
} from '@angular/material/table';
import { AuthService } from '../../../../services/auth.service';
import { AssignmentService } from '../../../../services/assignment.service';
import { TrainingService } from '../../../../services/training.service';
import { StatCard } from '../../../shared/stat-card/stat-card';
import { ComplianceProgressBar } from '../../../shared/compliance-progress-bar/compliance-progress-bar';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { RadialProgress } from '../../../shared/radial-progress/radial-progress';
import { ComplianceService } from '../../../../services/compliance.service';
import { TrainingAssignment } from '../../../../models/assignment.model';
import { Training } from '../../../../models/training.model';

@Component({
  selector: 'app-employee-dashboard',
  imports: [
    DatePipe,
    MatCard,
    MatIcon,
    MatButton,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    StatCard,
    ComplianceProgressBar,
    StatusBadge,
    RadialProgress,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class EmployeeDashboard {
  private authService = inject(AuthService);
  private assignmentService = inject(AssignmentService);
  private trainingService = inject(TrainingService);
  private complianceService = inject(ComplianceService);
  private router = inject(Router);

  readonly user = this.authService.currentUser;

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

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

  readonly categoryRings = toSignal(
    this.complianceService.getEmployeeCategoryRings(this.user()?.id ?? ''),
    { initialValue: [] }
  );

  readonly totalAssigned = computed(() => this.assignments().length);

  readonly completedCount = computed(
    () => this.assignments().filter((a) => a.status === 'completed').length
  );

  readonly inProgressCount = computed(
    () => this.assignments().filter((a) => a.status === 'in-progress').length
  );

  readonly overdueCount = computed(
    () => this.assignments().filter((a) => a.status === 'overdue').length
  );

  readonly complianceRate = computed(() => {
    const total = this.totalAssigned();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  readonly upcomingAssignments = computed(() => {
    const map = this.trainingMap();
    return this.assignments()
      .filter(
        (a) =>
          a.status === 'not-started' ||
          a.status === 'in-progress' ||
          a.status === 'overdue'
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )
      .map((a) => ({
        assignment: a,
        trainingTitle: map.get(a.trainingId)?.title ?? 'Unknown Training',
      }));
  });

  readonly displayedColumns = ['training', 'status', 'dueDate', 'action'];

  getActionLabel(status: string): string {
    return status === 'in-progress' ? 'Continue' : 'Start';
  }

  goToTraining(assignmentId: string): void {
    this.router.navigate(['/employee/trainings', assignmentId]);
  }
}
