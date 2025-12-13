import { Component, inject, signal } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Training } from '../../../../models/training.model';
import { MOCK_USERS } from '../../../../services/mock-data';
import { AssignmentService } from '../../../../services/assignment.service';

export interface AssignTrainingDialogData {
  training: Training;
}

@Component({
  selector: 'app-assign-training-dialog',
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
  ],
  templateUrl: './assign-training-dialog.html',
  styleUrl: './assign-training-dialog.scss',
})
export class AssignTrainingDialog {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AssignTrainingDialog>);
  private data = inject<AssignTrainingDialogData>(MAT_DIALOG_DATA);
  private assignmentService = inject(AssignmentService);
  private snackBar = inject(MatSnackBar);

  protected readonly training = this.data.training;
  protected readonly employees = MOCK_USERS.filter((u) => u.role === 'employee');
  protected readonly submitting = signal(false);

  protected form = this.fb.nonNullable.group({
    employeeIds: [[] as string[], [Validators.required]],
    dueDate: ['', [Validators.required]],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);

    const { employeeIds, dueDate } = this.form.getRawValue();
    this.assignmentService
      .bulkAssign(this.training.id, employeeIds, new Date(dueDate))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.snackBar.open(
            `Assigned to ${employeeIds.length} employee(s)`,
            'Close',
            { duration: 3000 }
          );
          this.dialogRef.close(true);
        },
        error: () => {
          this.submitting.set(false);
        },
      });
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }
}
