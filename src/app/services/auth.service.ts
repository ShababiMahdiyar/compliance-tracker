import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '../models/user.model';
import { MOCK_USERS, MOCK_PASSWORDS } from './mock-data';

const TOKEN_KEY = 'ct_auth_token';
const USER_KEY = 'ct_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  loading = signal(false);

  constructor() {
    this.restoreSession();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    const storedPassword = MOCK_PASSWORDS.get(request.email);

    if (!storedPassword || storedPassword !== request.password) {
      return throwError(() => new Error('Invalid credentials'));
    }

    const user = MOCK_USERS.find((u) => u.email === request.email);

    if (!user) {
      return throwError(() => new Error('Invalid credentials'));
    }

    const token = this.generateToken(user);
    const response: LoginResponse = { token, user };

    return of(response).pipe(
      delay(500),
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  register(request: RegisterRequest): Observable<LoginResponse> {
    const exists = MOCK_USERS.some((u) => u.email === request.email);

    if (exists) {
      return throwError(() => new Error('Email already registered'));
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      role: 'employee',
      department: request.department,
      avatarUrl: '',
      createdAt: new Date(),
    };

    MOCK_USERS.push(user);
    MOCK_PASSWORDS.set(request.email, request.password);

    const token = this.generateToken(user);
    const response: LoginResponse = { token, user };

    return of(response).pipe(
      delay(500),
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/authentication']);
  }

  private restoreSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (token && userJson && !this.isTokenExpired(token)) {
      this.currentUser.set(JSON.parse(userJson) as User);
    }
  }

  private generateToken(user: User): string {
    return btoa(
      JSON.stringify({
        email: user.email,
        role: user.role,
        exp: Date.now() + 86400000,
      })
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token));
      return payload.exp < Date.now();
    } catch {
      return true;
    }
  }
}
