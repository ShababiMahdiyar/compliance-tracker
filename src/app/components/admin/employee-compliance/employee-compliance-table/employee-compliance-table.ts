import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AssignmentService } from '../../../../services/assignment.service';
import { MOCK_USERS } from '../../../../services/mock-data';
import { ComplianceProgressBar } from '../../../shared/compliance-progress-bar/compliance-progress-bar';

interface EmployeeRow {
  id: string;
  name: string;
  initials: string;
  department: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  complianceRate: number;
  avgScore: number;
}

@Component({
  selector: 'app-employee-compliance-table',
  imports: [MatCard, MatCardContent, MatProgressSpinner, ComplianceProgressBar],
  templateUrl: './employee-compliance-table.html',
  styleUrl: './employee-compliance-table.scss',
})
export class EmployeeComplianceTable {
  private assignmentService = inject(AssignmentService);

  private readonly assignments = toSignal(this.assignmentService.getAll(), {
    initialValue: [],
  });

  protected readonly isLoading = computed(() => this.assignments().length === 0);

  protected readonly employees = computed<EmployeeRow[]>(() => {
    const assigns = this.assignments();
    const empUsers = MOCK_USERS.filter((u) => u.role === 'employee');

    return empUsers.map((user) => {
      const userAssigns = assigns.filter((a) => a.employeeId === user.id);
      const completed = userAssigns.filter((a) => a.status === 'completed').length;
      const inProgress = userAssigns.filter((a) => a.status === 'in-progress').length;
      const overdue = userAssigns.filter((a) => a.status === 'overdue').length;
      const scores = userAssigns
        .map((a) => a.score)
        .filter((s): s is number => s !== null);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
          : 0;

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        initials: `${user.firstName[0]}${user.lastName[0]}`,
        department: user.department,
        total: userAssigns.length,
        completed,
        inProgress,
        overdue,
        complianceRate:
          userAssigns.length > 0
            ? Math.round((completed / userAssigns.length) * 100)
            : 0,
        avgScore,
      };
    });
  });
}
