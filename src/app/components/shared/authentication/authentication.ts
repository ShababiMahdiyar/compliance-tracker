import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-authentication',
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatIcon,
    MatInput,
    MatProgressSpinner,
  ],
  templateUrl: './authentication.html',
  styleUrl: './authentication.scss',
})
export class Authentication {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  protected hidePassword = signal(true);
  protected loading = signal(false);
  protected errorMessage = signal('');

  protected loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected onLogin(): void {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.getRawValue();
    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const route = res.user.role === 'admin' ? '/admin' : '/employee';
        this.router.navigate([route]);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }

  protected togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword.update((v) => !v);
  }
}
