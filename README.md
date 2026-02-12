# Compliance Tracker

An Angular application for managing employee training compliance. Features role-based dashboards for admins and employees, training assignment workflows, and compliance monitoring with visual analytics.

## Features

**Admin**
- Dashboard with compliance overview, heatmaps, and score distributions
- Training management (create, edit, list)
- Employee compliance tracking table
- Assign trainings to employees via dialog

**Employee**
- Personal dashboard with compliance progress
- Training list with status tracking
- Training detail view with assignment timeline

**Shared**
- Role-based authentication (admin/employee)
- Route guards for authorization
- Visual components: charts (bar, donut, radial), heatmap, stat cards, status badges

## Screenshots

### Authentication

![Login](docs/screenshots/login.png)

### Admin

![Admin Dashboard](docs/screenshots/admin-dashboard.png)
![Training Programs](docs/screenshots/admin-training-programs.png)
![Edit Training](docs/screenshots/admin-edit-training.png)
![Employee Compliance](docs/screenshots/admin-employee-compliance.png)

### Employee

![Employee Dashboard](docs/screenshots/employee-dashboard.png)
![My Trainings](docs/screenshots/employee-my-trainings.png)

## Tech Stack

- Angular 20 with standalone components and lazy-loaded routes
- Angular Material + CDK
- D3.js for data visualizations
- SCSS for styling
- Mock data services (no backend required)

## Getting Started

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200/`. The app redirects to the login page where you can sign in as an admin or employee.

## Build

```bash
ng build
```

## Tests

```bash
ng test
```
