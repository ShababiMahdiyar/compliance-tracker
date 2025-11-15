import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'authentication',
    loadComponent: () =>
      import('./components/shared/authentication/authentication').then((m) => m.Authentication),
  },
  { path: '', redirectTo: 'authentication', pathMatch: 'full' },
  { path: '**', redirectTo: 'authentication' },
];
