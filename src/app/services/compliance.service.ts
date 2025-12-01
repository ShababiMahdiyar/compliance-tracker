import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  ComplianceStats,
  DepartmentCompliance,
  CategoryCompletion,
  HeatmapCell,
} from '../models/compliance.model';
import { TimelineItem } from '../components/shared/assignment-timeline/assignment-timeline';
import { ScorePoint } from '../components/shared/score-distribution/score-distribution';
import { RadialRing } from '../components/shared/radial-progress/radial-progress';
import { MOCK_USERS, MOCK_ASSIGNMENTS, MOCK_TRAININGS } from './mock-data';

@Injectable({ providedIn: 'root' })
export class ComplianceService {
  getOverviewStats(): Observable<ComplianceStats> {
    const totalEmployees = MOCK_USERS.filter(
      (u) => u.role === 'employee'
    ).length;
    const totalAssignments = MOCK_ASSIGNMENTS.length;
    const completedAssignments = MOCK_ASSIGNMENTS.filter(
      (a) => a.status === 'completed'
    ).length;
    const overdueAssignments = MOCK_ASSIGNMENTS.filter(
      (a) => a.status === 'overdue'
    ).length;
    const overallComplianceRate =
      totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

    const scores = MOCK_ASSIGNMENTS.map((a) => a.score).filter(
      (s): s is number => s !== null
    );
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;

    const stats: ComplianceStats = {
      totalEmployees,
      totalAssignments,
      completedAssignments,
      overdueAssignments,
      overallComplianceRate,
      averageScore,
    };

    return of(stats).pipe(delay(500));
  }

  getDepartmentCompliance(): Observable<DepartmentCompliance[]> {
    const departmentMap = new Map<
      string,
      { total: number; completed: number }
    >();

    for (const assignment of MOCK_ASSIGNMENTS) {
      const employee = MOCK_USERS.find((u) => u.id === assignment.employeeId);
      if (!employee) continue;

      const dept = employee.department;
      const entry = departmentMap.get(dept) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (assignment.status === 'completed') {
        entry.completed += 1;
      }
      departmentMap.set(dept, entry);
    }

    const result: DepartmentCompliance[] = Array.from(
      departmentMap.entries()
    ).map(([department, data]) => ({
      department,
      totalAssignments: data.total,
      completed: data.completed,
      complianceRate:
        data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));

    return of(result).pipe(delay(400));
  }

  getCategoryCompletion(): Observable<CategoryCompletion[]> {
    const categoryMap = new Map<
      string,
      { total: number; completed: number }
    >();

    for (const assignment of MOCK_ASSIGNMENTS) {
      const training = MOCK_TRAININGS.find(
        (t) => t.id === assignment.trainingId
      );
      if (!training) continue;

      const category = training.category;
      const entry = categoryMap.get(category) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (assignment.status === 'completed') {
        entry.completed += 1;
      }
      categoryMap.set(category, entry);
    }

    const result: CategoryCompletion[] = Array.from(
      categoryMap.entries()
    ).map(([category, data]) => ({
      category,
      total: data.total,
      completed: data.completed,
      completionRate:
        data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));

    return of(result).pipe(delay(400));
  }

  getHeatmapData(): Observable<HeatmapCell[]> {
    const cellMap = new Map<string, { total: number; completed: number }>();

    for (const assignment of MOCK_ASSIGNMENTS) {
      const employee = MOCK_USERS.find((u) => u.id === assignment.employeeId);
      const training = MOCK_TRAININGS.find(
        (t) => t.id === assignment.trainingId
      );
      if (!employee || !training) continue;

      const key = `${employee.department}::${training.category}`;
      const entry = cellMap.get(key) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (assignment.status === 'completed') {
        entry.completed += 1;
      }
      cellMap.set(key, entry);
    }

    const result: HeatmapCell[] = Array.from(cellMap.entries()).map(
      ([key, data]) => {
        const [department, category] = key.split('::');
        return {
          department,
          category,
          total: data.total,
          completed: data.completed,
          rate:
            data.total > 0
              ? Math.round((data.completed / data.total) * 100)
              : 0,
        };
      }
    );

    return of(result).pipe(delay(400));
  }

  getTimelineData(): Observable<TimelineItem[]> {
    const result: TimelineItem[] = MOCK_ASSIGNMENTS.map((a) => {
      const employee = MOCK_USERS.find((u) => u.id === a.employeeId);
      const training = MOCK_TRAININGS.find((t) => t.id === a.trainingId);
      return {
        id: a.id,
        employeeName: employee
          ? `${employee.firstName} ${employee.lastName}`
          : 'Unknown',
        trainingTitle: training?.title ?? 'Unknown',
        status: a.status,
        assignedDate: new Date(a.assignedDate),
        dueDate: new Date(a.dueDate),
        completedDate: a.completedDate ? new Date(a.completedDate) : null,
      };
    });

    return of(result).pipe(delay(400));
  }

  getScoreDistribution(): Observable<ScorePoint[]> {
    const result: ScorePoint[] = MOCK_ASSIGNMENTS
      .filter((a) => a.score !== null)
      .map((a) => {
        const employee = MOCK_USERS.find((u) => u.id === a.employeeId);
        const training = MOCK_TRAININGS.find((t) => t.id === a.trainingId);
        return {
          score: a.score!,
          label: `${employee?.firstName ?? '?'} — ${training?.title ?? '?'}`,
        };
      });

    return of(result).pipe(delay(300));
  }

  getEmployeeCategoryRings(employeeId: string): Observable<RadialRing[]> {
    const categoryColors: Record<string, string> = {
      compliance: '#10b981',
      safety: '#f59e0b',
      technical: '#7c3aed',
      'soft-skills': '#14b8a6',
      certification: '#f97316',
    };

    const categoryMap = new Map<string, { total: number; completed: number }>();

    for (const a of MOCK_ASSIGNMENTS.filter((a) => a.employeeId === employeeId)) {
      const training = MOCK_TRAININGS.find((t) => t.id === a.trainingId);
      if (!training) continue;

      const cat = training.category;
      const entry = categoryMap.get(cat) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (a.status === 'completed') entry.completed += 1;
      categoryMap.set(cat, entry);
    }

    const result: RadialRing[] = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        label: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '),
        value: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        color: categoryColors[category] ?? '#64748b',
      })
    );

    return of(result).pipe(delay(300));
  }
}
