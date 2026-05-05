import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { LangService } from '../../core/services/lang.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div>
          <h1 class="page-title">{{ lang.t().teacherDashTitle }}</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">{{ lang.t().helloUser }}, {{ auth.user()?.firstName }} !</p>
        </div>

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
            <div class="flex items-center justify-between mb-4">
              <h2 class="section-title">{{ lang.t().upcomingSessions }}</h2>
              <a routerLink="/sessions" class="text-xs text-blue-700 dark:text-blue-400 hover:underline">{{ lang.t().viewAll }}</a>
            </div>
            @if (loading()) {
              <div class="space-y-3">@for (i of [1,2]; track i) {<div class="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>}</div>
            } @else if (sessions().length === 0) {
              <div class="text-center py-8 text-gray-400 dark:text-gray-500">
                <p class="text-2xl mb-2">📅</p>
                <p class="text-sm">{{ lang.t().noUpcomingTeacher }}</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (s of sessions().slice(0,4); track s.id) {
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ s.subject }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ s.studentName ?? lang.t().students }} · {{ formatDate(s.startTime) }}</p>
                    </div>
                    <span [class]="statusBadge(s.status)">{{ s.status }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- My courses -->
          <div class="card dark:bg-gray-900 p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="section-title">{{ lang.t().myCourses }}</h2>
              <a routerLink="/teacher/my-courses" class="text-xs text-blue-700 dark:text-blue-400 hover:underline">{{ lang.t().manage }}</a>
            </div>
            @if (courses().length === 0) {
              <div class="text-center py-8 text-gray-400 dark:text-gray-500">
                <p class="text-2xl mb-2">📚</p>
                <p class="text-sm">{{ lang.t().noCourseTeacher }}</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (c of courses().slice(0,4); track c.id) {
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ c.title }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ c.enrolledCount ?? 0 }} {{ lang.t().students }} · {{ c.targetLevel }}</p>
                    </div>
                    <span class="badge-green">{{ c.status }}</span>
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
            @for (a of quickActions(); track a.label) {
              <a [routerLink]="a.route"
                 class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 rounded-xl transition-all text-center">
                <span class="text-2xl">{{ a.icon }}</span>
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ a.label }}</span>
              </a>
            }
          </div>
        </div>
      </div>
    </app-dashboard-layout>
  `
})
export class TeacherDashboardComponent implements OnInit {
  auth = inject(AuthService);
  api  = inject(ApiService);
  lang = inject(LangService);

  sessions = signal<any[]>([]);
  courses  = signal<any[]>([]);
  loading  = signal(true);
  stats    = signal<{ label: string; value: string }[]>([]);

  quickActions() {
    const t = this.lang.t();
    return [
      { icon: '📚', label: t.myCourses,    route: '/teacher/my-courses' },
      { icon: '📅', label: t.sessions,     route: '/sessions' },
      { icon: '🗓️', label: t.availability, route: '/teacher/availability' },
      { icon: '👤', label: t.profile,      route: '/profile' },
    ];
  }

  ngOnInit() {
    const l = this.lang.lang();
    this.stats.set([
      { label: l === 'ar' ? 'جلسات هذا الشهر' : (l === 'en' ? 'Sessions this month' : 'Séances ce mois'),    value: '0' },
      { label: l === 'ar' ? 'ساعات تدريس' : (l === 'en' ? 'Hours taught' : 'Heures enseignées'),              value: '0h' },
      { label: l === 'ar' ? 'دورات نشطة' : (l === 'en' ? 'Active courses' : 'Cours actifs'),                  value: '0' },
      { label: l === 'ar' ? 'طلاب متابعون' : (l === 'en' ? 'Students followed' : 'Élèves suivis'),            value: '0' },
    ]);

    const userId = this.auth.user()?.id;
    this.api.get<any[]>('/teachers').subscribe({
      next: (teachers) => {
        const me = teachers.find((t: any) => t.userId === userId);
        if (me) {
          this.api.get<any[]>('/spring/api/sessions', { teacherId: me.id }).subscribe({
            next: (s) => {
              this.sessions.set(s.filter((x: any) => x.status === 'SCHEDULED'));
              const monthly = s.filter((x: any) => new Date(x.startTime).getMonth() === new Date().getMonth()).length;
              const hours = s.filter((x: any) => x.status === 'COMPLETED').reduce((acc: number, x: any) => acc + (x.durationHours || 0), 0);
              this.stats.update(st => st.map((item, i) => {
                if (i === 0) return { ...item, value: String(monthly) };
                if (i === 1) return { ...item, value: hours.toFixed(1) + 'h' };
                return item;
              }));
              this.loading.set(false);
            },
            error: () => this.loading.set(false)
          });
          this.api.get<any[]>('/spring/api/courses', { teacherId: me.id }).subscribe({
            next: (c) => {
              this.courses.set(c);
              this.stats.update(st => st.map((item, i) => i === 2 ? { ...item, value: String(c.length) } : item));
            }
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
    const locale = this.lang.lang() === 'ar' ? 'ar-SA' : (this.lang.lang() === 'en' ? 'en-GB' : 'fr-FR');
    return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  statusBadge(s: string) {
    const m: Record<string, string> = { SCHEDULED: 'badge-blue', COMPLETED: 'badge-green', CANCELLED: 'badge-red' };
    return m[s] ?? 'badge-gray';
  }
}
