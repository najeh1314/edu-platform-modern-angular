import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { LangService } from '../../core/services/lang.service';
import { ToastService } from '../../core/services/toast.service';

type Audience = 'all' | 'teachers' | 'students' | 'parents' | 'admins' | 'private';

interface BroadcastUser { id: number; firstName: string; lastName: string; email: string; role: string; }
interface HistoryItem  { id: number; title: string; message: string; audience: string; createdAt: string; recipientCount?: number; }

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-8 max-w-4xl mx-auto">

        <!-- Header -->
        <div>
          <h1 class="page-title flex items-center gap-2">
            <i class="bi bi-megaphone-fill text-blue-700 dark:text-blue-400"></i>
            {{ lang.t().adminNotifTitle }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Envoyez des notifications ciblées aux utilisateurs de la plateforme
          </p>
        </div>

        <!-- Compose form -->
        <div class="card p-6 dark:bg-gray-900 space-y-5">
          <h2 class="section-title">Composer un message</h2>

          <!-- Audience selector -->
          <div>
            <label class="label mb-2">Destinataires</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              @for (opt of audienceOptions; track opt.value) {
                <button type="button"
                  (click)="form.audience = opt.value; form.targetUserId = null"
                  [class]="form.audience === opt.value
                    ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400'"
                  class="rounded-xl p-3 text-sm text-left flex items-center gap-2 transition-all">
                  <i [class]="'bi ' + opt.icon"></i>
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <!-- User picker (private mode) -->
          @if (form.audience === 'private') {
            <div>
              <label class="label">{{ lang.t().selectUser }}</label>
              <select class="input mt-1" [(ngModel)]="form.targetUserId">
                <option [ngValue]="null" disabled>— Choisir —</option>
                @for (u of users(); track u.id) {
                  <option [ngValue]="u.id">
                    {{ u.firstName }} {{ u.lastName }} ({{ u.email }}) · {{ u.role }}
                  </option>
                }
              </select>
            </div>
          }

          <!-- Title -->
          <div>
            <label class="label">Titre</label>
            <input type="text" class="input mt-1" [(ngModel)]="form.title"
              placeholder="Ex: Maintenance prévue samedi" maxlength="120">
          </div>

          <!-- Message -->
          <div>
            <label class="label">Message</label>
            <textarea class="input mt-1 h-28 resize-none" [(ngModel)]="form.message"
              placeholder="Rédigez votre message…" maxlength="500"></textarea>
            <p class="text-xs text-gray-400 mt-1 text-right">{{ form.message.length }}/500</p>
          </div>

          <!-- Link (optional) -->
          <div>
            <label class="label">Lien (optionnel)</label>
            <input type="text" class="input mt-1" [(ngModel)]="form.link"
              placeholder="Ex: /sessions">
          </div>

          <!-- Send button -->
          <div class="flex justify-end">
            <button class="btn-primary flex items-center gap-2 px-6 py-2.5"
              (click)="send()" [disabled]="sending()">
              @if (sending()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Envoi…
              } @else {
                <i class="bi bi-send-fill"></i>
                {{ lang.t().sendNotif }}
              }
            </button>
          </div>
        </div>

        <!-- History -->
        <div class="card p-6 dark:bg-gray-900 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="section-title mb-0">{{ lang.t().broadcastHistory }}</h2>
            <button (click)="loadHistory()" class="btn-secondary text-xs flex items-center gap-1.5">
              <i class="bi bi-arrow-clockwise"></i> Actualiser
            </button>
          </div>

          @if (loadingHistory()) {
            <div class="flex justify-center py-8">
              <span class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            </div>
          } @else if (history().length === 0) {
            <div class="text-center py-10 text-gray-400 dark:text-gray-500">
              <i class="bi bi-inbox text-5xl block mb-3"></i>
              Aucun envoi pour le moment
            </div>
          } @else {
            <div class="space-y-3">
              @for (item of history(); track item.id) {
                <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex gap-4 items-start">
                  <div [class]="audienceBadgeBg(item.audience)"
                       class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg">
                    <i [class]="audienceIcon(item.audience)"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold text-gray-900 dark:text-white text-sm">{{ item.title }}</span>
                      <span [class]="audienceBadge(item.audience)" class="badge text-xs">
                        {{ audienceLabel(item.audience) }}
                      </span>
                      @if (item.recipientCount) {
                        <span class="text-xs text-gray-400">· {{ item.recipientCount }} {{ lang.t().recipientCount }}</span>
                      }
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{{ item.message }}</p>
                  </div>
                  <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">{{ formatTime(item.createdAt) }}</span>
                </div>
              }
            </div>
          }
        </div>

      </div>
    </app-dashboard-layout>
  `
})
export class AdminNotificationsComponent implements OnInit {
  api   = inject(ApiService);
  lang  = inject(LangService);
  toast = inject(ToastService);

  users          = signal<BroadcastUser[]>([]);
  history        = signal<HistoryItem[]>([]);
  sending        = signal(false);
  loadingHistory = signal(true);

  form: { title: string; message: string; audience: Audience; targetUserId: number | null; link: string } = {
    title: '', message: '', audience: 'all', targetUserId: null, link: ''
  };

  audienceOptions: { value: Audience; label: string; icon: string }[] = [];

  ngOnInit() {
    this.buildOptions();
    this.loadUsers();
    this.loadHistory();
  }

  buildOptions() {
    const t = this.lang.t();
    this.audienceOptions = [
      { value: 'all',      label: t.audienceAll,      icon: 'bi-globe2' },
      { value: 'teachers', label: t.audienceTeachers,  icon: 'bi-person-video3' },
      { value: 'students', label: t.audienceStudents,  icon: 'bi-mortarboard' },
      { value: 'parents',  label: t.audienceParents,   icon: 'bi-people-fill' },
      { value: 'admins',   label: t.audienceAdmins,    icon: 'bi-shield-fill' },
      { value: 'private',  label: t.audiencePrivate,   icon: 'bi-person-lock' },
    ];
  }

  loadUsers() {
    this.api.get<BroadcastUser[]>('/spring/api/notifications/admin/users').subscribe({
      next: (u) => this.users.set(u ?? []),
      error: () => {}
    });
  }

  loadHistory() {
    this.loadingHistory.set(true);
    this.api.get<HistoryItem[]>('/spring/api/notifications/admin/history').subscribe({
      next: (h) => { this.history.set(h ?? []); this.loadingHistory.set(false); },
      error: () => this.loadingHistory.set(false)
    });
  }

  send() {
    if (!this.form.title.trim() || !this.form.message.trim()) {
      this.toast.error('Titre et message obligatoires');
      return;
    }
    if (this.form.audience === 'private' && !this.form.targetUserId) {
      this.toast.error(this.lang.t().selectUser);
      return;
    }
    this.sending.set(true);
    const payload: Record<string, unknown> = {
      title:    this.form.title.trim(),
      message:  this.form.message.trim(),
      audience: this.form.audience,
      type:     'admin_broadcast',
      link:     this.form.link.trim() || null
    };
    if (this.form.audience === 'private') payload['targetUserId'] = this.form.targetUserId;

    this.api.post<any>('/notifications/admin/broadcast', payload).subscribe({
      next: (res) => {
        this.toast.success(`${this.lang.t().notifSent} (${res.sent} ${this.lang.t().recipientCount})`);
        this.form = { title: '', message: '', audience: 'all', targetUserId: null, link: '' };
        this.sending.set(false);
        this.loadHistory();
      },
      error: (e) => {
        this.toast.error(e?.error?.message ?? 'Erreur lors de l\'envoi');
        this.sending.set(false);
      }
    });
  }

  audienceLabel(aud: string): string {
    const t = this.lang.t();
    const m: Record<string, string> = {
      all: t.audienceAll, teachers: t.audienceTeachers, students: t.audienceStudents,
      parents: t.audienceParents, admins: t.audienceAdmins, private: t.audiencePrivate
    };
    return m[aud] ?? aud;
  }

  audienceIcon(aud: string): string {
    const m: Record<string, string> = {
      all: 'bi bi-globe2', teachers: 'bi bi-person-video3', students: 'bi bi-mortarboard',
      parents: 'bi bi-people-fill', admins: 'bi bi-shield-fill', private: 'bi bi-person-lock'
    };
    return m[aud] ?? 'bi bi-megaphone';
  }

  audienceBadgeBg(aud: string): string {
    const m: Record<string, string> = {
      all: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      teachers: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      students: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      parents:  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      admins:   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      private:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    };
    return m[aud] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  }

  audienceBadge(aud: string): string {
    const m: Record<string, string> = {
      all: 'badge-blue', teachers: 'badge-purple', students: 'badge-green',
      parents: 'badge-yellow', admins: 'badge-red', private: 'badge-gray'
    };
    return m[aud] ?? 'badge-gray';
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
