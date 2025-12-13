import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatCheckbox } from '@angular/material/checkbox';
import { Training, TrainingCategory, TrainingStatus } from '../../../../models/training.model';

export interface TrainingFormData {
  training: Training | null;
}

@Component({
  selector: 'app-training-form',
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatCheckbox,
  ],
  templateUrl: './training-form.html',
  styleUrl: './training-form.scss',
})
export class TrainingForm {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TrainingForm>);
  private data = inject<TrainingFormData>(MAT_DIALOG_DATA);

  protected readonly isEdit = !!this.data.training;
  protected readonly categories: TrainingCategory[] = [
    'compliance',
    'safety',
    'technical',
    'soft-skills',
    'certification',
  ];
  protected readonly statuses: TrainingStatus[] = ['active', 'draft', 'archived'];

  protected form = this.fb.nonNullable.group({
    title: [this.data.training?.title ?? '', [Validators.required]],
    description: [this.data.training?.description ?? '', [Validators.required]],
    category: [this.data.training?.category ?? ('compliance' as TrainingCategory), [Validators.required]],
    status: [this.data.training?.status ?? ('active' as TrainingStatus), [Validators.required]],
    durationMinutes: [this.data.training?.durationMinutes ?? 60, [Validators.required, Validators.min(1)]],
    passingScore: [this.data.training?.passingScore ?? 70, [Validators.required, Validators.min(0), Validators.max(100)]],
    isMandatory: [this.data.training?.isMandatory ?? false],
    expiresAfterDays: [this.data.training?.expiresAfterDays ?? null as number | null],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }

  protected onCancel(): void {
    this.dialogRef.close(null);
  }
}
