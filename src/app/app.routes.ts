import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/role.guard';
import { employeeGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'authentication',
    loadComponent: () =>
      import('./components/shared/authentication/authentication').then((m) => m.Authentication),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layout/sidenav/app-sidenav').then((m) => m.AppSidenav),
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/admin/dashboard/dashboard').then((m) => m.AdminDashboard),
      },
    ],
  },
  {
    path: 'employee',
    loadComponent: () =>
      import('./layout/sidenav/app-sidenav').then((m) => m.AppSidenav),
    canActivate: [authGuard, employeeGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/employee/dashboard/dashboard/dashboard').then(
            (m) => m.EmployeeDashboard
          ),
      },
    ],
  },
  { path: '', redirectTo: 'authentication', pathMatch: 'full' },
  { path: '**', redirectTo: 'authentication' },
];
