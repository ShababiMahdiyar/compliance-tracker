import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidenav',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatNavList,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatIcon,
    MatIconButton,
    MatTooltip,
  ],
  templateUrl: './app-sidenav.html',
  styleUrl: './app-sidenav.scss',
})
export class AppSidenav {
  private authService = inject(AuthService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  protected readonly sidenavOpened = signal(true);

  protected readonly user = this.authService.currentUser;
  protected readonly isAdmin = this.authService.isAdmin;

  protected readonly navItems = computed<NavItem[]>(() => {
    if (this.isAdmin()) {
      return [
        { icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
        { icon: 'school', label: 'Trainings', route: '/admin/trainings' },
        { icon: 'people', label: 'Employees', route: '/admin/employees' },
      ];
    }
    return [
      { icon: 'dashboard', label: 'Dashboard', route: '/employee/dashboard' },
      { icon: 'assignment', label: 'My Trainings', route: '/employee/trainings' },
    ];
  });

  protected readonly sidenavMode = computed(() => (this.isMobile() ? 'over' as const : 'side' as const));

  protected toggleSidenav(): void {
    this.sidenavOpened.set(!this.sidenavOpened());
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected getUserInitials(): string {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }
}
