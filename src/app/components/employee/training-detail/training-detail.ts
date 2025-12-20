import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth.service';
import { AssignmentService } from '../../../services/assignment.service';
import { TrainingService } from '../../../services/training.service';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { TrainingAssignment } from '../../../models/assignment.model';
import { Training } from '../../../models/training.model';

@Component({
  selector: 'app-training-detail',
  imports: [
    DatePipe,
    MatCard,
    MatIcon,
    MatButton,
    MatIconButton,
    MatDivider,
    MatProgressSpinner,
    StatusBadge,
  ],
  templateUrl: './training-detail.html',
  styleUrl: './training-detail.scss',
})
export class TrainingDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private assignmentService = inject(AssignmentService);
  private trainingService = inject(TrainingService);

  private readonly user = this.authService.currentUser;

  private readonly assignmentData = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');
        if (!id) return of(null);
        return this.assignmentService.getByEmployee(this.user()?.id ?? '').pipe(
          map((assignments) => assignments.find((a) => a.id === id) ?? null)
        );
      })
    ),
    { initialValue: null as TrainingAssignment | null }
  );

  readonly assignment = signal<TrainingAssignment | null>(null);

  private readonly trainingData = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');
        if (!id) return of(null);
        return this.assignmentService.getByEmployee(this.user()?.id ?? '').pipe(
          switchMap((assignments) => {
            const found = assignments.find((a) => a.id === id);
            if (!found) return of(null);
            return this.trainingService.getById(found.trainingId);
          })
        );
      })
    ),
    { initialValue: null as Training | null }
  );

  readonly training = computed(() => this.trainingData());

  constructor() {
    effect(() => {
      const data = this.assignmentData();
      if (data) {
        this.assignment.set(data);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/employee/trainings']);
  }

  startTraining(): void {
    const a = this.assignment();
    if (!a) return;
    this.assignmentService.startTraining(a.id).subscribe((updated) => {
      this.assignment.set(updated);
    });
  }

  openCompleteDialog(): void {
    const scoreStr = window.prompt('Enter your score (0-100):');
    if (scoreStr === null) return;
    const score = parseInt(scoreStr, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      window.alert('Please enter a valid score between 0 and 100.');
      return;
    }
    const a = this.assignment();
    if (!a) return;
    this.assignmentService.markComplete(a.id, score).subscribe((updated) => {
      this.assignment.set(updated);
    });
  }
}
