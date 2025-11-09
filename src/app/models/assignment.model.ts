export type AssignmentStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'overdue'
  | 'expired';

export interface TrainingAssignment {
  id: string;
  trainingId: string;
  employeeId: string;
  assignedById: string;
  status: AssignmentStatus;
  assignedDate: Date;
  dueDate: Date;
  completedDate: Date | null;
  score: number | null;
  attempts: number;
}
