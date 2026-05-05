import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-email-verify',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div class="card dark:bg-gray-900 w-full max-w-md p-10 text-center space-y-6">

        @if (status() === 'loading') {
          <div class="flex flex-col items-center gap-4">
            <span class="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            <p class="text-gray-500 dark:text-gray-400">Vérification en cours…</p>
          </div>
        }

        @if (status() === 'success') {
          <div class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <i class="bi bi-check-circle-fill text-4xl text-green-600 dark:text-green-400"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Email vérifié !</h2>
          <p class="text-gray-500 dark:text-gray-400">Votre compte est maintenant actif. Bienvenue sur EduPlatform !</p>
          <a routerLink="/dashboard" class="btn-primary w-full py-3 block text-center">
            Accéder à mon tableau de bord
          </a>
        }

        @if (status() === 'error') {
          <div class="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <i class="bi bi-x-circle-fill text-4xl text-red-500 dark:text-red-400"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Lien invalide</h2>
          <p class="text-gray-500 dark:text-gray-400">{{ errorMsg() }}</p>
          <div class="space-y-2">
            <a routerLink="/register" class="btn-primary w-full py-2.5 block text-center">Créer un nouveau compte</a>
            <a routerLink="/login" class="btn-outline w-full py-2.5 block text-center">Se connecter</a>
          </div>
        }

        @if (status() === 'no-token') {
          <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <i class="bi bi-envelope-x text-4xl text-gray-400"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Aucun token</h2>
          <p class="text-gray-500 dark:text-gray-400">Ce lien ne contient pas de token de vérification valide.</p>
          <a routerLink="/register" class="btn-primary w-full py-2.5 block text-center">S'inscrire</a>
        }

      </div>
    </div>
  `
})
export class EmailVerifyComponent implements OnInit {
  api    = inject(ApiService);
  auth   = inject(AuthService);
  router = inject(Router);
  route  = inject(ActivatedRoute);

  status   = signal<'loading' | 'success' | 'error' | 'no-token'>('loading');
  errorMsg = signal('Ce lien est invalide ou expiré.');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('no-token');
      return;
    }
    this.api.get<any>(`/auth/verify-email?token=${encodeURIComponent(token)}`).subscribe({
      next: (res) => {
        if (res.token && res.user) {
          this.auth.login(res.token, res.user);
        }
        this.status.set('success');
        const role = res.user?.role;
        setTimeout(() => {
          if (role === 'admin')        this.router.navigate(['/dashboard/admin']);
          else if (role === 'teacher') this.router.navigate(['/dashboard/teacher']);
          else                         this.router.navigate(['/dashboard/student']);
        }, 2000);
      },
      error: (e) => {
        this.errorMsg.set(e?.error?.message ?? 'Ce lien est invalide ou expiré.');
        this.status.set('error');
      }
    });
  }
}
