import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TrainingService } from '../../../../services/training.service';
import { Training } from '../../../../models/training.model';
import { TrainingForm, TrainingFormData } from '../training-form/training-form';
import { AssignTrainingDialog, AssignTrainingDialogData } from '../../assign-training/assign-training-dialog/assign-training-dialog';

@Component({
  selector: 'app-training-list',
  imports: [
    MatCard,
    MatCardContent,
    MatButton,
    MatIconButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    MatSuffix,
    MatTooltip,
    MatProgressSpinner,
  ],
  templateUrl: './training-list.html',
  styleUrl: './training-list.scss',
})
export class TrainingList {
  private trainingService = inject(TrainingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  protected readonly trainings = signal<Training[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly loading = signal(true);

  protected readonly filteredTrainings = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const all = this.trainings();
    if (!query) return all;
    return all.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.loadTrainings();
  }

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected openCreateDialog(): void {
    const dialogRef = this.dialog.open(TrainingForm, {
      width: '600px',
      data: { training: null } satisfies TrainingFormData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.trainingService.create(result).subscribe((created) => {
          this.trainings.update((list) => [...list, created]);
          this.snackBar.open('Training created successfully', 'Close', { duration: 3000 });
        });
      }
    });
  }

  protected openEditDialog(training: Training): void {
    const dialogRef = this.dialog.open(TrainingForm, {
      width: '600px',
      data: { training } satisfies TrainingFormData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.trainingService.update(training.id, result).subscribe((updated) => {
          this.trainings.update((list) =>
            list.map((t) => (t.id === updated.id ? updated : t))
          );
          this.snackBar.open('Training updated successfully', 'Close', { duration: 3000 });
        });
      }
    });
  }

  protected deleteTraining(training: Training): void {
    if (!confirm(`Delete "${training.title}"?`)) return;

    this.trainingService.delete(training.id).subscribe(() => {
      this.trainings.update((list) => list.filter((t) => t.id !== training.id));
      this.snackBar.open('Training deleted', 'Close', { duration: 3000 });
    });
  }

  protected openAssignDialog(training: Training): void {
    this.dialog.open(AssignTrainingDialog, {
      width: '500px',
      data: { training } satisfies AssignTrainingDialogData,
    });
  }

  protected getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      compliance: 'var(--ct-amber-500)',
      safety: 'var(--ct-orange-500)',
      technical: 'var(--ct-emerald-500)',
      'soft-skills': 'var(--ct-violet-500)',
      certification: 'var(--ct-teal-500)',
    };
    return colors[category] ?? 'var(--ct-navy-400)';
  }

  private loadTrainings(): void {
    this.trainingService.getAll().subscribe((data) => {
      this.trainings.set(data);
      this.loading.set(false);
    });
  }
}
