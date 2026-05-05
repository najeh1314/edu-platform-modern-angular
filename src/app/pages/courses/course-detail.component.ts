import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, DashboardLayoutComponent],
  template: `
    @if (auth.isAuthenticated()) {
      <app-dashboard-layout>
        <ng-container *ngTemplateOutlet="content" />
      </app-dashboard-layout>
    } @else {
      <app-navbar />
      <div class="max-w-4xl mx-auto px-6 py-10"><ng-container *ngTemplateOutlet="content" /></div>
    }

    <ng-template #content>
      @if (loading()) {
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
        </div>
      } @else if (!course()) {
        <div class="card p-12 text-center">
          <p class="text-4xl mb-3">😕</p>
          <p class="text-gray-500">Cours introuvable</p>
          <a routerLink="/courses" class="btn-primary mt-4 inline-flex">Retour aux cours</a>
        </div>
      } @else {
        <div class="space-y-6">
          <a routerLink="/courses" class="text-sm text-blue-700 hover:underline flex items-center gap-1">← Retour aux cours</a>

          <div class="card p-6">
            <div class="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge-blue">{{ course().subject }}</span>
                  <span class="badge-gray">{{ course().targetLevel }}</span>
                  <span [class]="statusBadge(course().status)">{{ course().status }}</span>
                </div>
                <h1 class="text-2xl font-bold text-gray-900">{{ course().title }}</h1>
                <p class="text-gray-500 mt-1">par {{ course().teacherName }}</p>
              </div>
              @if (auth.role() === 'student') {
                <button (click)="enroll()" class="btn-primary px-6 py-2.5" [disabled]="enrolling()">
                  @if (enrolling()) { Inscription… } @else { S'inscrire au cours }
                </button>
              }
            </div>
            <p class="text-gray-600 leading-relaxed">{{ course().description ?? 'Pas de description disponible.' }}</p>
          </div>

          <div class="grid md:grid-cols-3 gap-4">
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-blue-900">{{ course().enrolledCount ?? 0 }}/{{ course().maxCapacity }}</p>
              <p class="text-sm text-gray-500 mt-1">Élèves inscrits</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-blue-900">{{ course().price ?? 0 }}€</p>
              <p class="text-sm text-gray-500 mt-1">Prix</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-blue-900">{{ formatDate(course().startDate) }}</p>
              <p class="text-sm text-gray-500 mt-1">Début</p>
            </div>
          </div>

          @if (course().schedule) {
            <div class="card p-5">
              <h2 class="section-title mb-2">Planning</h2>
              <p class="text-gray-600">{{ course().schedule }}</p>
            </div>
          }
        </div>
      }
    </ng-template>
  `
})
export class CourseDetailComponent implements OnInit {
  @Input() id!: string;
  api   = inject(ApiService);
  auth  = inject(AuthService);
  toast = inject(ToastService);

  course   = signal<any>(null);
  loading  = signal(true);
  enrolling = signal(false);

  ngOnInit() {
    this.api.get<any>(`/spring/api/courses/${this.id}`).subscribe({
      next: (c) => { this.course.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  enroll() {
    this.enrolling.set(true);
    this.api.post<any>(`/spring/api/courses/${this.id}/enroll`).subscribe({
      next: () => { this.toast.success('Inscrit au cours !'); this.enrolling.set(false); },
      error: (e) => { this.toast.error(e?.error?.message ?? 'Erreur'); this.enrolling.set(false); }
    });
  }

  formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  statusBadge(s: string) {
    const m: Record<string, string> = { ACTIVE: 'badge-green', PLANNED: 'badge-blue', COMPLETED: 'badge-gray', CANCELLED: 'badge-red' };
    return m[s] ?? 'badge-gray';
  }
}
