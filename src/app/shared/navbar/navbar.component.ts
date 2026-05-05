import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LangService, Lang } from '../../core/services/lang.service';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [`
    .notif-dot { animation: pulse-dot 2s infinite; }
    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.2); }
    }
  `],
  template: `
    <nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center gap-8">
            <a [routerLink]="['/']" class="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300 text-lg">
              <i class="bi bi-mortarboard-fill text-2xl text-blue-700 dark:text-blue-400"></i>
              EduPlatform
            </a>
            <div class="hidden md:flex items-center gap-6">
              <a [routerLink]="['/teachers']" routerLinkActive="text-blue-900 dark:text-blue-300 font-semibold"
                 class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <i class="bi bi-person-video3"></i> {{ lang.t().teachers }}
              </a>
              <a [routerLink]="['/courses']" routerLinkActive="text-blue-900 dark:text-blue-300 font-semibold"
                 class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <i class="bi bi-book"></i> {{ lang.t().courses }}
              </a>
            </div>
          </div>

          <!-- Right controls -->
          <div class="flex items-center gap-2">
            <!-- Language toggle -->
            <button (click)="lang.toggle()"
              class="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[52px] justify-center"
              [title]="nextLangLabel()">
              <span>{{ langFlag() }}</span>
              <span>{{ lang.lang().toUpperCase() }}</span>
            </button>

            <!-- Theme toggle -->
            <button (click)="theme.toggle()"
              class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              [title]="theme.isDark() ? 'Mode clair' : 'Mode sombre'">
              <i [class]="theme.isDark() ? 'bi bi-sun-fill text-yellow-400' : 'bi bi-moon-fill'"></i>
            </button>

            @if (auth.isAuthenticated()) {
              <!-- Notification Bell -->
              <div class="relative" (click)="$event.stopPropagation()">
                <button (click)="toggleNotifPanel()"
                  class="relative w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  [title]="lang.t().notifications">
                  <i class="bi bi-bell-fill text-base"></i>
                  @if (notif.unreadCount() > 0) {
                    <span class="notif-dot absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {{ notif.unreadCount() > 99 ? '99+' : notif.unreadCount() }}
                    </span>
                  }
                </button>

                <!-- Dropdown panel -->
                @if (showNotifPanel()) {
                  <div class="absolute end-0 top-11 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <span class="font-semibold text-sm text-gray-900 dark:text-white">
                        {{ lang.t().notifications }}
                        @if (notif.unreadCount() > 0) {
                          <span class="ms-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {{ notif.unreadCount() }}
                          </span>
                        }
                      </span>
                      @if (notif.unreadCount() > 0) {
                        <button (click)="markAllRead()"
                          class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                          {{ lang.t().markAllRead }}
                        </button>
                      }
                    </div>

                    <!-- List -->
                    <div class="max-h-80 overflow-y-auto">
                      @if (notif.notifications().length === 0) {
                        <div class="py-10 text-center">
                          <i class="bi bi-bell-slash text-3xl text-gray-300 dark:text-gray-600 block mb-2"></i>
                          <p class="text-sm text-gray-400 dark:text-gray-500">{{ lang.t().noNotifications }}</p>
                        </div>
                      } @else {
                        @for (n of notif.notifications(); track n.id) {
                          <div [class]="n.isRead
                              ? 'flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer'
                              : 'flex gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer'"
                               (click)="onNotifClick(n)">
                            <!-- Icon -->
                            <div [class]="notifIconBg(n.type)" class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm mt-0.5">
                              <i [class]="notifIcon(n.type)"></i>
                            </div>
                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                              <div class="flex items-start justify-between gap-1">
                                <p class="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{{ n.title }}</p>
                                @if (!n.isRead) {
                                  <span class="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1"></span>
                                }
                              </div>
                              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-2">{{ n.message }}</p>
                              <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{{ formatTime(n.createdAt) }}</p>
                            </div>
                          </div>
                        }
                      }
                    </div>

                    <!-- Footer -->
                    @if (notif.notifications().length > 0) {
                      <div class="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-center">
                        <a [routerLink]="['/sessions']" (click)="closeNotifPanel()"
                           class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                          {{ lang.t().viewSession }}
                        </a>
                      </div>
                    }
                  </div>
                }
              </div>

              <a [routerLink]="['/dashboard']"
                 class="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ms-1">
                <i class="bi bi-grid-1x2"></i> {{ lang.t().dashboard }}
              </a>
              <button (click)="logout()"
                class="btn-outline text-sm px-3 py-1.5 flex items-center gap-1.5">
                <i class="bi bi-box-arrow-right"></i>
                <span class="hidden sm:inline">{{ lang.t().logout }}</span>
              </button>
            } @else {
              <a [routerLink]="['/login']" class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ms-1">
                <i class="bi bi-person"></i> {{ lang.t().login }}
              </a>
              <a [routerLink]="['/register']" class="btn-primary text-sm px-4 py-1.5 flex items-center gap-1.5">
                <i class="bi bi-person-plus"></i> {{ lang.t().register }}
              </a>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  auth   = inject(AuthService);
  theme  = inject(ThemeService);
  lang   = inject(LangService);
  router = inject(Router);
  notif  = inject(NotificationService);

  showNotifPanel = signal(false);

  @HostListener('document:click')
  onDocumentClick() { this.showNotifPanel.set(false); }

  toggleNotifPanel() {
    const next = !this.showNotifPanel();
    this.showNotifPanel.set(next);
    if (next) this.notif.load();
  }

  closeNotifPanel() { this.showNotifPanel.set(false); }

  markAllRead() {
    this.notif.markAllRead();
  }

  onNotifClick(n: Notification) {
    if (!n.isRead) this.notif.markRead(n.id);
    this.closeNotifPanel();
    if (n.link) this.router.navigateByUrl(n.link);
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
    };
    return m[type] ?? 'bi bi-bell-fill';
  }

  notifIconBg(type: string): string {
    const m: Record<string, string> = {
      new_session:       'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      session_confirmed: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      session_rejected:  'bg-red-100 text-red-500 dark:bg-red-900/20 dark:text-red-400',
      session_cancelled: 'bg-orange-100 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400',
      session_completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      completion_pending:'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      ncmeet_ready:      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return m[type] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `Il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7)    return `Il y a ${diffD}j`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  langFlag(): string {
    const flags: Record<Lang, string> = { fr: '🇫🇷', en: '🇬🇧', ar: '🇸🇦' };
    return flags[this.lang.lang()];
  }

  nextLangLabel(): string {
    const order: Lang[] = ['fr', 'en', 'ar'];
    const next = order[(order.indexOf(this.lang.lang()) + 1) % order.length];
    const labels: Record<Lang, string> = { fr: 'Français', en: 'English', ar: 'العربية' };
    return `Passer en ${labels[next]}`;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
