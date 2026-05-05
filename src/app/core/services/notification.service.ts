import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private api  = inject(ApiService);
  private auth = inject(AuthService);

  notifications = signal<Notification[]>([]);
  unreadCount   = computed(() => this.notifications().filter(n => !n.isRead).length);

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  startPolling() {
    if (this.pollInterval) return;
    this.load();
    this.pollInterval = setInterval(() => {
      if (this.auth.isAuthenticated()) this.load();
    }, 30_000);
  }

  stopPolling() {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  load() {
    if (!this.auth.isAuthenticated()) return;
    this.api.get<Notification[]>('/notifications').subscribe({
      next: (list) => this.notifications.set(list ?? []),
      error: () => {}
    });
  }

  markRead(id: number) {
    this.api.post<any>(`/notifications/${id}/read`).subscribe({
      next: () => this.notifications.update(list =>
        list.map(n => n.id === id ? { ...n, isRead: true } : n))
    });
  }

  markAllRead() {
    this.api.post<any>('/notifications/read-all').subscribe({
      next: () => this.notifications.update(list =>
        list.map(n => ({ ...n, isRead: true })))
    });
  }

  delete(id: number) {
    this.api.delete<any>(`/notifications/${id}`).subscribe({
      next: () => this.notifications.update(list => list.filter(n => n.id !== id))
    });
  }

  ngOnDestroy() { this.stopPolling(); }
}
