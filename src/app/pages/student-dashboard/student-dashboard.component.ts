import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { LangService } from '../../core/services/lang.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div>
          <h1 class="page-title">{{ lang.t().helloUser }}, {{ auth.user()?.firstName }} ! 👋</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">{{ lang.t().yourDashboard }}</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (s of stats(); track s.label) {
            <div class="stat-card">
              <p class="text-3xl font-bold text-blue-900 dark:text-blue-400">{{ s.value }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ s.label }}</p>
            </div>
          }
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Upcoming sessions -->
          <div class="card dark:bg-gray-900 p-5">
            <h2 class="section-title mb-4">{{ lang.t().upcomingSessions }}</h2>
            @if (loading()) {
              <div class="space-y-3">
                @for (i of [1,2,3]; track i) { <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div> }
              </div>
            } @else if (sessions().length === 0) {
              <div class="text-center py-8 text-gray-400 dark:text-gray-500">
                <p class="text-2xl mb-2">📅</p>
                <p class="text-sm">{{ lang.t().noUpcomingSessions }}</p>
                <a routerLink="/teachers" class="btn-primary mt-3 text-xs px-4 py-1.5 inline-flex">{{ lang.t().findTutor }}</a>
              </div>
            } @else {
              <div class="space-y-3">
                @for (s of sessions().slice(0,4); track s.id) {
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ s.subject }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ s.teacherName }} · {{ formatDate(s.startTime) }}</p>
                    </div>
                    <span [class]="statusBadge(s.status)">{{ s.status }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Enrolled courses -->
          <div class="card dark:bg-gray-900 p-5">
            <h2 class="section-title mb-4">{{ lang.t().myCourses }}</h2>
            @if (courses().length === 0) {
              <div class="text-center py-8 text-gray-400 dark:text-gray-500">
                <p class="text-2xl mb-2">📚</p>
                <p class="text-sm">{{ lang.t().noEnrolledCourses }}</p>
                <a routerLink="/courses" class="btn-primary mt-3 text-xs px-4 py-1.5 inline-flex">{{ lang.t().exploreCourses }}</a>
              </div>
            } @else {
              <div class="space-y-3">
                @for (c of courses().slice(0,4); track c.id) {
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ c.title }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ c.subject }} · {{ c.teacherName }}</p>
                    </div>
                    <span class="badge-blue">{{ c.targetLevel }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Quick actions -->
        <div class="card dark:bg-gray-900 p-5">
          <h2 class="section-title mb-4">{{ lang.t().quickActions }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            @for (action of quickActions(); track action.label) {
              <a [routerLink]="action.route"
                 class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 border border-transparent rounded-xl transition-all cursor-pointer text-center">
                <span class="text-2xl">{{ action.icon }}</span>
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ action.label }}</span>
              </a>
            }
          </div>
        </div>
      </div>
    </app-dashboard-layout>
  `
})
export class StudentDashboardComponent implements OnInit {
  auth = inject(AuthService);
  api  = inject(ApiService);
  lang = inject(LangService);

  sessions = signal<any[]>([]);
  courses  = signal<any[]>([]);
  loading  = signal(true);

  stats = signal<{ label: string; value: string }[]>([]);

  quickActions() {
    const t = this.lang.t();
    return [
      { icon: '🔍', label: t.findTutor,    route: '/teachers' },
      { icon: '📅', label: t.sessions,      route: '/sessions' },
      { icon: '📚', label: t.exploreCourses,route: '/courses' },
      { icon: '🤖', label: t.aiTutor,       route: '/ai' },
    ];
  }

  ngOnInit() {
    this.updateStatLabels();
    this.api.get<any[]>('/spring/api/sessions', { studentId: this.auth.user()?.id }).subscribe({
      next: (s) => {
        this.sessions.set(s);
        const monthly = s.filter(x => new Date(x.startTime).getMonth() === new Date().getMonth()).length;
        const hours = s.reduce((acc: number, x: any) => acc + (x.durationHours || 0), 0);
        this.stats.update(st => st.map((item, i) => {
          if (i === 0) return { ...item, value: String(monthly) };
          if (i === 1) return { ...item, value: hours.toFixed(1) + 'h' };
          return item;
        }));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.api.get<any[]>('/spring/api/courses').subscribe({
      next: (c) => {
        this.courses.set(c);
        this.stats.update(st => st.map((item, i) => i === 2 ? { ...item, value: String(c.length) } : item));
      }
    });
  }

  private updateStatLabels() {
    const t = this.lang.t();
    const l = this.lang.lang();
    this.stats.set([
      { label: l === 'ar' ? 'جلسات هذا الشهر' : (l === 'en' ? 'Sessions this month' : 'Séances ce mois'), value: '0' },
      { label: l === 'ar' ? 'ساعات إجمالية' : (l === 'en' ? 'Total hours' : 'Heures totales'), value: '0h' },
      { label: l === 'ar' ? 'دورات مسجلة' : (l === 'en' ? 'Enrolled courses' : 'Cours inscrits'), value: '0' },
      { label: l === 'ar' ? 'المعدل' : (l === 'en' ? 'Average' : 'Moyenne'), value: '—' },
    ]);
  }

  formatDate(d: string) {
    if (!d) return '—';
    const locale = this.lang.lang() === 'ar' ? 'ar-SA' : (this.lang.lang() === 'en' ? 'en-GB' : 'fr-FR');
    return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  statusBadge(s: string) {
    const m: Record<string, string> = {
      SCHEDULED: 'badge-blue', COMPLETED: 'badge-green',
      CANCELLED: 'badge-red',  NO_SHOW: 'badge-yellow'
    };
    return m[s] ?? 'badge-gray';
  }
}
