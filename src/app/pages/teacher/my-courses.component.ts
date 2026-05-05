import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div>
          <h1 class="page-title">Mes cours</h1>
          <p class="text-gray-500 mt-1">{{ courses().length }} cours que vous enseignez</p>
        </div>

        @if (loading()) {
          <div class="grid md:grid-cols-3 gap-5">
            @for (i of [1,2,3]; track i) {
              <div class="card p-5 space-y-3 animate-pulse">
                <div class="h-5 bg-gray-200 rounded w-3/4"></div>
                <div class="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            }
          </div>
        } @else if (courses().length === 0) {
          <div class="card p-12 text-center">
            <p class="text-4xl mb-3">📚</p>
            <p class="text-gray-500 mb-2">Vous n'enseignez aucun cours pour l'instant.</p>
            <p class="text-sm text-gray-400">Contactez un administrateur pour être assigné à un cours.</p>
          </div>
        } @else {
          <div class="grid md:grid-cols-3 gap-5">
            @for (c of courses(); track c.id) {
              <div class="card p-5 hover:shadow-md transition-shadow flex flex-col">
                <div class="flex items-center justify-between mb-3">
                  <span class="badge-blue">{{ c.subject }}</span>
                  <span [class]="statusBadge(c.status)">{{ c.status }}</span>
                </div>
                <h3 class="font-semibold text-gray-900 mb-1">{{ c.title }}</h3>
                <p class="text-sm text-gray-500 mb-3 flex-1">{{ c.description ?? 'Aucune description' }}</p>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-500">Niveau</span>
                    <span class="font-medium">{{ c.targetLevel }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-500">Élèves</span>
                    <span class="font-medium">{{ c.enrolledCount ?? 0 }}/{{ c.maxCapacity }}</span>
                  </div>
                  @if (c.startDate) {
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">Début</span>
                      <span class="font-medium">{{ formatDate(c.startDate) }}</span>
                    </div>
                  }
                </div>
                <!-- Progress bar -->
                <div class="mt-4">
                  <div class="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Remplissage</span>
                    <span>{{ ((c.enrolledCount ?? 0) / (c.maxCapacity || 1) * 100) | number:'1.0-0' }}%</span>
                  </div>
                  <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-900 rounded-full transition-all"
                         [style.width.%]="(c.enrolledCount ?? 0) / (c.maxCapacity || 1) * 100"></div>
                  </div>
                </div>
                <a [routerLink]="['/courses', c.id]" class="btn-outline text-center mt-4 w-full text-sm">Voir le cours →</a>
              </div>
            }
          </div>
        }
      </div>
    </app-dashboard-layout>
  `
})
export class MyCoursesComponent implements OnInit {
  api  = inject(ApiService);
  auth = inject(AuthService);

  courses = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    const userId = this.auth.user()?.id;
    this.api.get<any[]>('/teachers').subscribe({
      next: (teachers) => {
        const me = teachers.find((t: any) => t.userId === userId);
        if (me) {
          this.api.get<any[]>('/spring/api/courses', { teacherId: me.id }).subscribe({
            next: (c) => { this.courses.set(c); this.loading.set(false); },
            error: () => this.loading.set(false)
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statusBadge(s: string) {
    const m: Record<string, string> = { ACTIVE: 'badge-green', PLANNED: 'badge-blue', COMPLETED: 'badge-gray', CANCELLED: 'badge-red' };
    return m[s] ?? 'badge-gray';
  }
}
