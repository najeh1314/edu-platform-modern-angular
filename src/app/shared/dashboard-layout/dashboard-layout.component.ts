import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LangService } from '../../core/services/lang.service';
import { NotificationService } from '../../core/services/notification.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">
      <!-- Sidebar -->
      <aside class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 transition-colors duration-200">
        <a [routerLink]="['/']" class="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <span class="flex items-center gap-2">
            <i class="bi bi-mortarboard-fill text-2xl text-blue-700 dark:text-blue-400"></i>
            <span class="font-bold text-blue-900 dark:text-blue-300 text-lg">EduPlatform</span>
          </span>
          <!-- Notification bell badge -->
          @if (notif.unreadCount() > 0) {
            <a [routerLink]="['/notifications']" (click)="$event.stopPropagation()"
               class="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <i class="bi bi-bell-fill text-blue-700 dark:text-blue-400 text-lg"></i>
              <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {{ notif.unreadCount() > 99 ? '99+' : notif.unreadCount() }}
              </span>
            </a>
          }
        </a>

        <!-- User info -->
        <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-blue-700 dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {{ userInitials() }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ auth.role() }}</p>
            </div>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          @for (item of navItems(); track item.route) {
            <a [routerLink]="item.route" routerLinkActive="sidebar-link-active"
               [routerLinkActiveOptions]="{exact: item.route.endsWith('dashboard') || item.route.split('/').length <= 2}"
               class="sidebar-link-inactive flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all">
              <i [class]="'bi ' + item.icon + ' text-base w-4 text-center'"></i>
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- Bottom actions -->
        <div class="px-3 py-3 border-t border-gray-100 dark:border-gray-700 space-y-0.5">
          <a [routerLink]="['/profile']" class="sidebar-link-inactive flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium">
            <i class="bi bi-person-circle text-base w-4 text-center"></i> {{ lang.t().profile }}
          </a>

          <!-- Theme + Lang row -->
          <div class="flex items-center gap-2 px-3 py-2">
            <button (click)="theme.toggle()"
              class="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              [title]="theme.isDark() ? 'Mode clair' : 'Mode sombre'">
              <i [class]="theme.isDark() ? 'bi bi-sun-fill text-yellow-400' : 'bi bi-moon-fill'"></i>
              {{ theme.isDark() ? 'Clair' : 'Sombre' }}
            </button>
            <button (click)="lang.toggle()"
              class="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>{{ langFlag() }}</span>
              <span>{{ lang.lang().toUpperCase() }}</span>
            </button>
          </div>

          <button (click)="logout()" class="w-full sidebar-link-inactive flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
            <i class="bi bi-box-arrow-right text-base w-4 text-center"></i> {{ lang.t().logout }}
          </button>
        </div>
      </aside>

      <!-- Main -->
      <main class="flex-1 overflow-y-auto">
        <div class="p-6">
          <ng-content />
        </div>
      </main>
    </div>
  `
})
export class DashboardLayoutComponent {
  auth   = inject(AuthService);
  theme  = inject(ThemeService);
  lang   = inject(LangService);
  notif  = inject(NotificationService);
  router = inject(Router);

  userInitials() {
    const u = this.auth.user();
    if (!u) return '?';
    return (u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '');
  }

  navItems() {
    const role = this.auth.role();
    const t = this.lang.t();
    if (role === 'student') return [
      { label: t.dashboard,      icon: 'bi-house-door-fill',  route: '/dashboard/student' },
      { label: t.sessions,       icon: 'bi-calendar-check',   route: '/sessions' },
      { label: t.courses,        icon: 'bi-book-half',        route: '/courses' },
      { label: t.teachers,       icon: 'bi-person-video3',    route: '/teachers' },
      { label: t.aiTutor,        icon: 'bi-robot',            route: '/ai' },
      { label: t.notifications,  icon: 'bi-bell',             route: '/notifications' },
    ] as NavItem[];
    if (role === 'teacher') return [
      { label: t.dashboard,      icon: 'bi-house-door-fill', route: '/dashboard/teacher' },
      { label: t.myCourses,      icon: 'bi-book-half',       route: '/teacher/my-courses' },
      { label: t.sessions,       icon: 'bi-calendar-check',  route: '/sessions' },
      { label: t.availability,   icon: 'bi-calendar3',       route: '/teacher/availability' },
      { label: t.notifications,  icon: 'bi-bell',            route: '/notifications' },
    ] as NavItem[];
    if (role === 'admin') return [
      { label: t.dashboard,          icon: 'bi-house-door-fill', route: '/dashboard/admin' },
      { label: t.users,              icon: 'bi-people-fill',     route: '/admin/users' },
      { label: t.courses,            icon: 'bi-book-half',       route: '/admin/courses' },
      { label: t.sessions,           icon: 'bi-calendar-check',  route: '/sessions' },
      { label: t.notifications,      icon: 'bi-bell',            route: '/notifications' },
      { label: t.adminNotifications, icon: 'bi-megaphone-fill',  route: '/admin/notifications' },
    ] as NavItem[];
    return [
      { label: t.dashboard,      icon: 'bi-house-door-fill', route: '/dashboard' },
      { label: t.courses,        icon: 'bi-book-half',       route: '/courses' },
    ] as NavItem[];
  }

  langFlag(): string {
    const flags: Record<string, string> = { fr: '🇫🇷', en: '🇬🇧', ar: '🇸🇦' };
    return flags[this.lang.lang()] ?? '🌐';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
