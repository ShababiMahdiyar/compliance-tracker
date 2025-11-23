import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TrainingAssignment } from '../models/assignment.model';
import { MOCK_ASSIGNMENTS } from './mock-data';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private authService = inject(AuthService);

  getAll(): Observable<TrainingAssignment[]> {
    return of(structuredClone(MOCK_ASSIGNMENTS)).pipe(delay(400));
  }

  getByEmployee(employeeId: string): Observable<TrainingAssignment[]> {
    const filtered = MOCK_ASSIGNMENTS.filter(
      (a) => a.employeeId === employeeId
    );
    return of(structuredClone(filtered)).pipe(delay(300));
  }

  assign(
    trainingId: string,
    employeeId: string,
    dueDate: Date
  ): Observable<TrainingAssignment> {
    const assignment: TrainingAssignment = {
      id: crypto.randomUUID(),
      trainingId,
      employeeId,
      assignedById: this.authService.currentUser()?.id ?? '',
      status: 'not-started',
      assignedDate: new Date(),
      dueDate,
      completedDate: null,
      score: null,
      attempts: 0,
    };

    MOCK_ASSIGNMENTS.push(assignment);

    return of(structuredClone(assignment)).pipe(delay(500));
  }

  bulkAssign(
    trainingId: string,
    employeeIds: string[],
    dueDate: Date
  ): Observable<TrainingAssignment[]> {
    const assignedById = this.authService.currentUser()?.id ?? '';
    const newAssignments: TrainingAssignment[] = employeeIds.map(
      (employeeId) => {
        const assignment: TrainingAssignment = {
          id: crypto.randomUUID(),
          trainingId,
          employeeId,
          assignedById,
          status: 'not-started',
          assignedDate: new Date(),
          dueDate,
          completedDate: null,
          score: null,
          attempts: 0,
        };

        MOCK_ASSIGNMENTS.push(assignment);

        return assignment;
      }
    );

    return of(structuredClone(newAssignments)).pipe(delay(600));
  }

  startTraining(assignmentId: string): Observable<TrainingAssignment> {
    const assignment = MOCK_ASSIGNMENTS.find((a) => a.id === assignmentId);

    if (!assignment) {
      throw new Error(`Assignment with id "${assignmentId}" not found`);
    }

    assignment.status = 'in-progress';

    return of(structuredClone(assignment)).pipe(delay(300));
  }

  markComplete(
    assignmentId: string,
    score: number
  ): Observable<TrainingAssignment> {
    const assignment = MOCK_ASSIGNMENTS.find((a) => a.id === assignmentId);

    if (!assignment) {
      throw new Error(`Assignment with id "${assignmentId}" not found`);
    }

    assignment.status = 'completed';
    assignment.score = score;
    assignment.completedDate = new Date();
    assignment.attempts += 1;

    return of(structuredClone(assignment)).pipe(delay(400));
  }
}
