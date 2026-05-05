import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { LangService } from '../../core/services/lang.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-16">
      <div class="card dark:bg-gray-900 w-full max-w-md p-8">
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ lang.t().welcome }}</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">{{ lang.t().loginSubtitle }}</p>
        </div>

        @if (error()) {
          <div class="alert-error mb-4">{{ error() }}</div>
        }

        <form (ngSubmit)="login()" class="space-y-4">
          <div>
            <label class="label">Email</label>
            <input type="email" class="input" [(ngModel)]="form.email" name="email"
                   [placeholder]="lang.lang() === 'ar' ? 'أنت@مثال.com' : 'vous@exemple.com'"
                   required autocomplete="email">
          </div>
          <div>
            <label class="label">{{ lang.t().password }}</label>
            <input type="password" class="input" [(ngModel)]="form.password" name="password"
                   placeholder="••••••••" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn-primary w-full py-2.5" [disabled]="loading()">
            @if (loading()) { <span>{{ lang.t().signingIn }}</span> } @else { <span>{{ lang.t().signIn }}</span> }
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {{ lang.t().noAccount }}
          <a routerLink="/register" class="text-blue-700 dark:text-blue-400 font-medium hover:underline ms-1">{{ lang.t().signUpLink }}</a>
        </p>

        <div class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <p class="text-xs text-gray-400 text-center mb-3">{{ lang.t().demoAccountsLabel }}</p>
          <div class="grid grid-cols-2 gap-2">
            @for (demo of demoAccounts; track demo.email) {
              <button type="button" (click)="fillDemo(demo)"
                class="text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-left transition-colors">
                <span class="font-medium text-gray-700 dark:text-gray-300">{{ demo.label }}</span><br>
                <span class="text-gray-400">{{ demo.email }}</span>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  api    = inject(ApiService);
  auth   = inject(AuthService);
  toast  = inject(ToastService);
  router = inject(Router);
  lang   = inject(LangService);

  form = { email: '', password: '' };
  loading = signal(false);
  error   = signal('');

  get demoAccounts() {
    const t = this.lang.t();
    const l = this.lang.lang();
    return [
      { label: l === 'ar' ? 'مشرف' : (l === 'en' ? 'Admin' : 'Admin'), email: 'admin@eduplatform.com', password: 'admin123' },
      { label: l === 'ar' ? 'مدرس' : (l === 'en' ? 'Teacher' : 'Enseignant'), email: 'sophie@eduplatform.com', password: 'teacher123' },
      { label: l === 'ar' ? 'طالب' : (l === 'en' ? 'Student' : 'Élève'), email: 'ahmed@eduplatform.com', password: 'student123' },
      { label: l === 'ar' ? 'ولي أمر' : (l === 'en' ? 'Parent' : 'Parent'), email: 'fatima@eduplatform.com', password: 'parent123' },
    ];
  }

  fillDemo(demo: { email: string; password: string }) {
    this.form.email = demo.email;
    this.form.password = demo.password;
  }

  login() {
    if (!this.form.email || !this.form.password) {
      this.error.set(this.lang.t().fillFields);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.post<{ token: string; user: any }>('/spring/api/auth/login', this.form).subscribe({
      next: (res) => {
        this.auth.login(res.token, res.user);
        this.toast.success(this.lang.t().loginSuccess);
        const role = res.user?.role;
        if (role === 'admin')        this.router.navigate(['/dashboard/admin']);
        else if (role === 'teacher') this.router.navigate(['/dashboard/teacher']);
        else                         this.router.navigate(['/dashboard/student']);
      },
      error: () => {
        this.error.set(this.lang.t().invalidCredentials);
        this.loading.set(false);
      }
    });
  }
}
