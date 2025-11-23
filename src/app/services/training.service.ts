import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Training } from '../models/training.model';
import { MOCK_TRAININGS } from './mock-data';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  getAll(): Observable<Training[]> {
    return of(structuredClone(MOCK_TRAININGS)).pipe(delay(400));
  }

  getById(id: string): Observable<Training> {
    const training = MOCK_TRAININGS.find((t) => t.id === id);

    if (!training) {
      return throwError(() => new Error(`Training with id "${id}" not found`));
    }

    return of(structuredClone(training)).pipe(delay(300));
  }

  create(
    training: Omit<Training, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<Training> {
    const now = new Date();
    const newTraining: Training = {
      ...training,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    MOCK_TRAININGS.push(newTraining);

    return of(structuredClone(newTraining)).pipe(delay(500));
  }

  update(id: string, changes: Partial<Training>): Observable<Training> {
    const index = MOCK_TRAININGS.findIndex((t) => t.id === id);

    if (index === -1) {
      return throwError(() => new Error(`Training with id "${id}" not found`));
    }

    MOCK_TRAININGS[index] = {
      ...MOCK_TRAININGS[index],
      ...changes,
      updatedAt: new Date(),
    };

    return of(structuredClone(MOCK_TRAININGS[index])).pipe(delay(400));
  }

  delete(id: string): Observable<boolean> {
    const index = MOCK_TRAININGS.findIndex((t) => t.id === id);

    if (index === -1) {
      return throwError(() => new Error(`Training with id "${id}" not found`));
    }

    MOCK_TRAININGS.splice(index, 1);

    return of(true).pipe(delay(300));
  }
}
