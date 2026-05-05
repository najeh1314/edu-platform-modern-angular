import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { LangService } from '../../core/services/lang.service';
import { ToastService } from '../../core/services/toast.service';

type Filter = 'all' | 'unread' | 'sessions' | 'ncmeet' | 'broadcast';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">

        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 class="page-title">
              <i class="bi bi-bell-fill me-2 text-blue-700 dark:text-blue-400"></i>
              {{ lang.t().notifPage }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {{ notif.unreadCount() }} {{ lang.t().filterUnread.toLowerCase() }}
              · {{ notif.notifications().length }} {{ lang.t().filterAll.toLowerCase() }}
            </p>
          </div>
          <div class="flex gap-2 flex-wrap">
            @if (notif.unreadCount() > 0) {
              <button (click)="markAllRead()"
                class="btn-secondary text-sm flex items-center gap-1.5">
                <i class="bi bi-check2-all"></i> {{ lang.t().markAllRead }}
              </button>
            }
            @if (hasRead()) {
              <button (click)="deleteRead()"
                class="btn-outline text-sm flex items-center gap-1.5 text-red-500 hover:text-red-700 border-red-200 hover:border-red-400">
                <i class="bi bi-trash3"></i> {{ lang.t().deleteRead }}
              </button>
            }
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          @for (f of filters; track f.id) {
            <button (click)="activeFilter.set(f.id)"
              [class]="activeFilter() === f.id
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-900 dark:text-blue-300 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5">
              <i [class]="f.icon"></i>
              {{ f.label }}
              @if (f.count() > 0) {
                <span class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-1.5 rounded-full">
                  {{ f.count() }}
                </span>
              }
            </button>
          }
        </div>

        <!-- Notification list -->
        @if (notif.notifications().length === 0) {
          <div class="card p-16 text-center dark:bg-gray-900">
            <i class="bi bi-bell-slash text-6xl text-gray-300 dark:text-gray-600 block mb-4"></i>
            <p class="text-lg font-semibold text-gray-600 dark:text-gray-400">{{ lang.t().notifEmpty }}</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">{{ lang.t().notifEmptyDesc }}</p>
          </div>
        } @else if (filtered().length === 0) {
          <div class="card p-12 text-center dark:bg-gray-900">
            <i class="bi bi-funnel text-4xl text-gray-300 dark:text-gray-600 block mb-3"></i>
            <p class="text-gray-500 dark:text-gray-400">Aucune notification dans cette catégorie</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (n of filtered(); track n.id) {
              <div [class]="n.isRead
                  ? 'card p-4 dark:bg-gray-900 flex gap-4 items-start opacity-75 hover:opacity-100 transition-opacity'
                  : 'card p-4 dark:bg-gray-900 flex gap-4 items-start border-l-4 border-l-blue-500'"
                   (click)="onNotifClick(n)" style="cursor: pointer">

                <!-- Icon -->
                <div [class]="iconBg(n.type)"
                     class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg">
                  <i [class]="notifIcon(n.type)"></i>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ n.title }}</p>
                        @if (!n.isRead) {
                          <span class="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        }
                        <span [class]="typeBadge(n.type)" class="badge text-xs">{{ typeLabel(n.type) }}</span>
                      </div>
                      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{{ n.message }}</p>
                    </div>
                    <div class="flex flex-col items-end gap-2 shrink-0">
                      <p class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{{ formatTime(n.createdAt) }}</p>
                      <button (click)="remove($event, n.id)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <i class="bi bi-x-lg text-xs"></i>
                      </button>
                    </div>
                  </div>

                  @if (n.link) {
                    <div class="mt-2">
                      <a [routerLink]="[n.link]" (click)="markIfUnread(n)"
                         class="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        <i class="bi bi-arrow-right-circle"></i> {{ lang.t().viewSession }}
                      </a>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Swagger link (admin quick access) -->
        <div class="card p-4 dark:bg-gray-900 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <i class="bi bi-braces text-green-600 dark:text-green-400"></i>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">API Documentation</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Swagger UI — Spring Boot</p>
            </div>
          </div>
          <a href="/spring/swagger-ui.html" target="_blank"
             class="btn-secondary text-xs flex items-center gap-1.5">
            <i class="bi bi-box-arrow-up-right"></i> Ouvrir Swagger
          </a>
        </div>

      </div>
    </app-dashboard-layout>
  `
})
export class NotificationsComponent {
  notif  = inject(NotificationService);
  lang   = inject(LangService);
  toast  = inject(ToastService);

  activeFilter = signal<Filter>('all');

  filters = [
    {
      id: 'all' as Filter,
      label: this.lang.t().filterAll,
      icon: 'bi bi-bell',
      count: computed(() => this.notif.notifications().filter(n => !n.isRead).length)
    },
    {
      id: 'unread' as Filter,
      label: this.lang.t().filterUnread,
      icon: 'bi bi-circle-fill text-blue-500',
      count: computed(() => this.notif.notifications().filter(n => !n.isRead).length)
    },
    {
      id: 'sessions' as Filter,
      label: this.lang.t().filterSessions,
      icon: 'bi bi-calendar-check',
      count: computed(() => this.notif.notifications().filter(n =>
        !n.isRead && ['new_session','session_confirmed','session_rejected','session_cancelled','session_completed','completion_pending'].includes(n.type)
      ).length)
    },
    {
      id: 'ncmeet' as Filter,
      label: this.lang.t().filterNcMeet,
      icon: 'bi bi-camera-video',
      count: computed(() => this.notif.notifications().filter(n => !n.isRead && n.type === 'ncmeet_ready').length)
    },
    {
      id: 'broadcast' as Filter,
      label: this.lang.t().filterBroadcast,
      icon: 'bi bi-megaphone',
      count: computed(() => this.notif.notifications().filter(n => !n.isRead && n.type === 'admin_broadcast').length)
    },
  ];

  filtered = computed(() => {
    const all = this.notif.notifications();
    switch (this.activeFilter()) {
      case 'unread':   return all.filter(n => !n.isRead);
      case 'sessions': return all.filter(n =>
        ['new_session','session_confirmed','session_rejected','session_cancelled','session_completed','completion_pending'].includes(n.type));
      case 'ncmeet':    return all.filter(n => n.type === 'ncmeet_ready');
      case 'broadcast': return all.filter(n => n.type === 'admin_broadcast');
      default:          return all;
    }
  });

  hasRead = computed(() => this.notif.notifications().some(n => n.isRead));

  markAllRead() {
    this.notif.markAllRead();
    this.toast.success(this.lang.t().markAllRead);
  }

  deleteRead() {
    const read = this.notif.notifications().filter(n => n.isRead);
    read.forEach(n => this.notif.delete(n.id));
    this.toast.success(`${read.length} supprimée(s)`);
  }

  onNotifClick(n: Notification) {
    if (!n.isRead) this.notif.markRead(n.id);
  }

  markIfUnread(n: Notification) {
    if (!n.isRead) this.notif.markRead(n.id);
  }

  remove(event: Event, id: number) {
    event.stopPropagation();
    this.notif.delete(id);
  }

  notifIcon(type: string): string {
    const m: Record<string, string> = {
      new_session:       'bi bi-calendar-plus-fill',
      session_confirmed: 'bi bi-check-circle-fill',
      session_rejected:  'bi bi-x-circle-fill',
      session_cancelled: 'bi bi-calendar-x-fill',
      session_completed: 'bi bi-trophy-fill',
      completion_pending:'bi bi-hourglass-split',
      ncmeet_ready:      'bi bi-camera-video-fill',
      admin_broadcast:   'bi bi-megaphone-fill',
    };
    return m[type] ?? 'bi bi-bell-fill';
  }

  iconBg(type: string): string {
    const m: Record<string, string> = {
      new_session:       'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      session_confirmed: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      session_rejected:  'bg-red-100 text-red-500 dark:bg-red-900/20 dark:text-red-400',
      session_cancelled: 'bg-orange-100 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400',
      session_completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      completion_pending:'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      ncmeet_ready:      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      admin_broadcast:   'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return m[type] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  }

  typeBadge(type: string): string {
    const m: Record<string, string> = {
      new_session: 'badge-blue', session_confirmed: 'badge-green',
      session_rejected: 'badge-red', session_cancelled: 'badge-red',
      session_completed: 'badge-green', completion_pending: 'badge-yellow',
      ncmeet_ready:    'badge-purple',
      admin_broadcast: 'badge-orange',
    };
    return m[type] ?? 'badge-gray';
  }

  typeLabel(type: string): string {
    const t = this.lang.t();
    const m: Record<string, string> = {
      new_session: 'Nouvelle séance',
      session_confirmed: t.notifSessionConfirmed,
      session_rejected: t.notifSessionRejected,
      session_cancelled: t.notifSessionCancelled,
      session_completed: t.notifSessionCompleted,
      completion_pending: 'En attente',
      ncmeet_ready:    t.notifNcMeetReady,
      admin_broadcast: t.notifBroadcastLabel,
    };
    return m[type] ?? type;
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const lang = this.lang.lang();
    if (lang === 'ar') {
      if (diffMin < 1)  return 'الآن';
      if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
      const h = Math.floor(diffMin / 60);
      if (h < 24) return `منذ ${h} ساعة`;
      return `منذ ${Math.floor(h / 24)} يوم`;
    }
    if (lang === 'en') {
      if (diffMin < 1)  return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const h = Math.floor(diffMin / 60);
      if (h < 24) return `${h}h ago`;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    }
    if (diffMin < 1)  return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const h = Math.floor(diffMin / 60);
    if (h < 24) return `Il y a ${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
}
