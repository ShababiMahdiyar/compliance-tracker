export type TrainingCategory =
  | 'compliance'
  | 'safety'
  | 'technical'
  | 'soft-skills'
  | 'certification';

export type TrainingStatus = 'active' | 'draft' | 'archived';

export interface Training {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  status: TrainingStatus;
  durationMinutes: number;
  passingScore: number;
  isMandatory: boolean;
  expiresAfterDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}
