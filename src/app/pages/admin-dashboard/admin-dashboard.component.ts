import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LangService } from '../../core/services/lang.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div>
          <h1 class="page-title">{{ lang.t().adminTitle }}</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">{{ lang.t().platformOverview }}</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (s of stats(); track s.label) {
            <div class="stat-card">
              <p class="text-3xl font-bold" [class]="s.color">{{ s.value }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ s.label }}</p>
            </div>
          }
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Recent users -->
          <div class="card dark:bg-gray-900 p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="section-title">{{ lang.t().recentUsers }}</h2>
              <a routerLink="/admin/users" class="text-xs text-blue-700 dark:text-blue-400 hover:underline">{{ lang.t().viewAll }}</a>
            </div>
            @if (loadingUsers()) {
              <div class="space-y-3">@for (i of [1,2,3]; track i) {<div class="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>}</div>
            } @else {
              <div class="divide-y divide-gray-100 dark:divide-gray-700">
                @for (u of users().slice(0,5); track u.id) {
                  <div class="flex items-center justify-between py-2.5">
                    <div class="flex items-center gap-3">
                      <div class="w-7 h-7 bg-blue-900 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {{ u.firstName?.[0] }}{{ u.lastName?.[0] }}
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ u.firstName }} {{ u.lastName }}</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500">{{ u.email }}</p>
                      </div>
                    </div>
                    <span [class]="roleBadge(u.role)">{{ u.role }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Recent sessions -->
          <div class="card dark:bg-gray-900 p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="section-title">{{ lang.t().recentSessions }}</h2>
              <a routerLink="/sessions" class="text-xs text-blue-700 dark:text-blue-400 hover:underline">{{ lang.t().viewAll }}</a>
            </div>
            @if (loadingSessions()) {
              <div class="space-y-3">@for (i of [1,2,3]; track i) {<div class="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>}</div>
            } @else {
              <div class="divide-y divide-gray-100 dark:divide-gray-700">
                @for (s of sessions().slice(0,5); track s.id) {
                  <div class="flex items-center justify-between py-2.5">
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ s.subject }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">{{ s.teacherName }} · {{ formatDate(s.startTime) }}</p>
                    </div>
                    <span [class]="statusBadge(s.status)">{{ s.status }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Quick links -->
        <div class="card dark:bg-gray-900 p-5">
          <h2 class="section-title mb-4">{{ lang.t().adminTitle }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            @for (a of adminLinks(); track a.label) {
              @if (a.external) {
                <a [href]="a.route" target="_blank"
                   class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 rounded-xl transition-all text-center">
                  <span class="text-2xl">{{ a.icon }}</span>
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ a.label }}</span>
                </a>
              } @else {
                <a [routerLink]="a.route"
                   class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 rounded-xl transition-all text-center">
                  <span class="text-2xl">{{ a.icon }}</span>
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ a.label }}</span>
                </a>
              }
            }
          </div>
        </div>
      </div>
    </app-dashboard-layout>
  `
})
export class AdminDashboardComponent implements OnInit {
  api  = inject(ApiService);
  auth = inject(AuthService);
  lang = inject(LangService);

  users    = signal<any[]>([]);
  sessions = signal<any[]>([]);
  courses  = signal<any[]>([]);
  loadingUsers    = signal(true);
  loadingSessions = signal(true);

  stats = signal<{ label: string; value: string; color: string }[]>([]);

  adminLinks() {
    const t = this.lang.t();
    return [
      { icon: '👥', label: t.users,       route: '/admin/users',     external: false },
      { icon: '📚', label: t.courses,     route: '/admin/courses',   external: false },
      { icon: '📅', label: t.sessions,    route: '/sessions',        external: false },
      { icon: '📖', label: 'Swagger API', route: '/spring/swagger-ui.html', external: true },
    ];
  }

  ngOnInit() {
    const l = this.lang.lang();
    this.stats.set([
      { label: l === 'ar' ? 'المستخدمون' : (l === 'en' ? 'Users' : 'Utilisateurs'),       value: '…', color: 'text-blue-900 dark:text-blue-400' },
      { label: l === 'ar' ? 'المدرسون' : (l === 'en' ? 'Teachers' : 'Enseignants'),       value: '…', color: 'text-green-700 dark:text-green-400' },
      { label: l === 'ar' ? 'إجمالي الجلسات' : (l === 'en' ? 'Total sessions' : 'Séances totales'), value: '…', color: 'text-purple-700 dark:text-purple-400' },
      { label: l === 'ar' ? 'دورات نشطة' : (l === 'en' ? 'Active courses' : 'Cours actifs'),        value: '…', color: 'text-orange-600 dark:text-orange-400' },
    ]);

    this.api.get<any[]>('/users').subscribe({
      next: (u) => {
        this.users.set(u);
        const teachers = u.filter((x: any) => x.role === 'teacher').length;
        this.stats.update(st => st.map((s, i) => {
          if (i === 0) return { ...s, value: String(u.length) };
          if (i === 1) return { ...s, value: String(teachers) };
          return s;
        }));
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false)
    });
    this.api.get<any[]>('/sessions').subscribe({
      next: (s) => {
        this.sessions.set(s);
        this.stats.update(st => st.map((x, i) => i === 2 ? { ...x, value: String(s.length) } : x));
        this.loadingSessions.set(false);
      },
      error: () => this.loadingSessions.set(false)
    });
    this.api.get<any[]>('/courses').subscribe({
      next: (c) => {
        this.courses.set(c);
        this.stats.update(st => st.map((x, i) => i === 3 ? { ...x, value: String(c.length) } : x));
      }
    });
  }

  formatDate(d: string) {
    if (!d) return '—';
    const locale = this.lang.lang() === 'ar' ? 'ar-SA' : (this.lang.lang() === 'en' ? 'en-GB' : 'fr-FR');
    return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  }

  roleBadge(r: string) {
    const m: Record<string, string> = { admin: 'badge-red', teacher: 'badge-blue', student: 'badge-green', parent: 'badge-purple' };
    return m[r] ?? 'badge-gray';
  }

  statusBadge(s: string) {
    const m: Record<string, string> = { SCHEDULED: 'badge-blue', COMPLETED: 'badge-green', CANCELLED: 'badge-red' };
    return m[s] ?? 'badge-gray';
  }
}
