import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ComplianceService } from '../../../services/compliance.service';
import { AssignmentService } from '../../../services/assignment.service';
import { TrainingService } from '../../../services/training.service';
import { MOCK_USERS } from '../../../services/mock-data';
import { StatCard } from '../../shared/stat-card/stat-card';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { BarChart, BarChartItem } from '../../shared/bar-chart/bar-chart';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { ComplianceHeatmap } from '../../shared/compliance-heatmap/compliance-heatmap';
import { AssignmentTimeline } from '../../shared/assignment-timeline/assignment-timeline';
import { ScoreDistribution } from '../../shared/score-distribution/score-distribution';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    DatePipe,
    MatCard,
    MatCardContent,
    MatIcon,
    MatProgressSpinner,
    StatCard,
    DonutChart,
    BarChart,
    StatusBadge,
    ComplianceHeatmap,
    AssignmentTimeline,
    ScoreDistribution,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboard {
  private complianceService = inject(ComplianceService);
  private assignmentService = inject(AssignmentService);
  private trainingService = inject(TrainingService);

  protected readonly today = new Date();

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  protected readonly stats = toSignal(this.complianceService.getOverviewStats(), {
    initialValue: null,
  });
  protected readonly deptCompliance = toSignal(
    this.complianceService.getDepartmentCompliance(),
    { initialValue: [] }
  );
  protected readonly categoryCompletion = toSignal(
    this.complianceService.getCategoryCompletion(),
    { initialValue: [] }
  );
  protected readonly assignments = toSignal(this.assignmentService.getAll(), {
    initialValue: [],
  });
  protected readonly heatmapData = toSignal(
    this.complianceService.getHeatmapData(),
    { initialValue: [] }
  );
  protected readonly trainings = toSignal(this.trainingService.getAll(), {
    initialValue: [],
  });
  protected readonly timelineData = toSignal(
    this.complianceService.getTimelineData(),
    { initialValue: [] }
  );
  protected readonly scoreData = toSignal(
    this.complianceService.getScoreDistribution(),
    { initialValue: [] }
  );

  protected readonly isLoading = computed(() => this.stats() === null);

  protected readonly donutSegments = computed<DonutSegment[]>(() => {
    const a = this.assignments();
    const completed = a.filter((x) => x.status === 'completed').length;
    const inProgress = a.filter((x) => x.status === 'in-progress').length;
    const notStarted = a.filter((x) => x.status === 'not-started').length;
    const overdue = a.filter((x) => x.status === 'overdue').length;
    const expired = a.filter((x) => x.status === 'expired').length;
    return [
      { label: 'Completed', value: completed, color: '#10b981' },
      { label: 'In Progress', value: inProgress, color: '#f59e0b' },
      { label: 'Not Started', value: notStarted, color: '#64748b' },
      { label: 'Overdue', value: overdue, color: '#ef4444' },
      { label: 'Expired', value: expired, color: '#7c3aed' },
    ];
  });

  protected readonly deptBarItems = computed<BarChartItem[]>(() =>
    this.deptCompliance().map((d) => ({
      label: d.department,
      value: d.complianceRate,
    }))
  );

  protected readonly categoryBarItems = computed<BarChartItem[]>(() =>
    this.categoryCompletion().map((c) => ({
      label: c.category.charAt(0).toUpperCase() + c.category.slice(1),
      value: c.completionRate,
    }))
  );

  protected readonly overdueAssignments = computed(() => {
    const a = this.assignments().filter((x) => x.status === 'overdue');
    const t = this.trainings();
    const users = MOCK_USERS;
    return a.map((assign) => ({
      assignment: assign,
      training: t.find((tr) => tr.id === assign.trainingId),
      employee: users.find((u) => u.id === assign.employeeId),
    }));
  });
}
