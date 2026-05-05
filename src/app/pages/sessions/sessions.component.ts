import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LangService } from '../../core/services/lang.service';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 class="page-title">{{ lang.t().sessions }}</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">{{ sessions().length }} séance(s)</p>
          </div>
          @if (auth.role() === 'student') {
            <a [routerLink]="['/teachers']" class="btn-primary">
              <i class="bi bi-calendar-plus"></i> {{ lang.t().bookSession }}
            </a>
          }
        </div>

        <!-- Filters -->
        <div class="card p-4 flex flex-wrap gap-3 dark:bg-gray-900">
          <select class="input w-44" [(ngModel)]="filterStatus" (change)="load()">
            <option value="">Tous les statuts</option>
            <option value="PENDING">{{ lang.t().pending }}</option>
            <option value="SCHEDULED">{{ lang.t().scheduled }}</option>
            <option value="COMPLETED">{{ lang.t().completed }}</option>
            <option value="CANCELLED">{{ lang.t().cancelled }}</option>
          </select>
          <select class="input w-36" [(ngModel)]="filterType" (change)="load()">
            <option value="">Tous les types</option>
            <option value="real">{{ lang.t().real }}</option>
            <option value="virtual">{{ lang.t().virtual }}</option>
          </select>
          <input type="date" class="input w-44" [(ngModel)]="filterFrom" (change)="load()">
          <input type="date" class="input w-44" [(ngModel)]="filterTo" (change)="load()">
          <button class="btn-secondary" (click)="resetFilters()">
            <i class="bi bi-x-circle"></i> Réinitialiser
          </button>
        </div>

        <!-- Sessions list -->
        @if (loading()) {
          <div class="card p-8 text-center dark:bg-gray-900">
            <div class="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full mx-auto"></div>
          </div>
        } @else if (sessions().length === 0) {
          <div class="card p-12 text-center dark:bg-gray-900">
            <i class="bi bi-calendar-x text-5xl text-gray-300 dark:text-gray-600 block mb-3"></i>
            <p class="text-gray-500 dark:text-gray-400">Aucune séance trouvée</p>
          </div>
        } @else {
          <div class="space-y-3">
            @for (s of sessions(); track s.id) {
              <div [class]="cardClass(s)" class="card p-4 dark:bg-gray-900 transition-all">
                <div class="flex flex-wrap items-start gap-4">

                  <!-- Icon + type -->
                  <div class="shrink-0">
                    <div [class]="iconBg(s.status)"
                         class="w-12 h-12 rounded-xl flex items-center justify-center text-xl">
                      <i [class]="s.isVirtual ? 'bi bi-camera-video-fill' : 'bi bi-person-fill'"></i>
                    </div>
                  </div>

                  <!-- Main info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="font-semibold text-gray-900 dark:text-white">{{ s.subject || '—' }}</span>
                      <span [class]="statusBadge(s.status)" class="badge text-xs">{{ statusLabel(s.status) }}</span>
                      @if (s.isVirtual) {
                        <span class="badge badge-purple text-xs">
                          <i class="bi bi-camera-video-fill me-1"></i>{{ lang.t().virtual }}
                        </span>
                      } @else {
                        <span class="badge badge-gray text-xs">
                          <i class="bi bi-person-fill me-1"></i>{{ lang.t().real }}
                        </span>
                      }
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      @if (auth.role() !== 'teacher') {
                        <span class="flex items-center gap-1">
                          <i class="bi bi-person-video3"></i> {{ s.teacherName }}
                        </span>
                      }
                      @if (auth.role() !== 'student') {
                        <span class="flex items-center gap-1">
                          <i class="bi bi-mortarboard-fill"></i> {{ s.studentName || '—' }}
                        </span>
                      }
                      <span class="flex items-center gap-1">
                        <i class="bi bi-calendar-event"></i> {{ formatDate(s.startTime) }}
                      </span>
                      <span class="flex items-center gap-1">
                        <i class="bi bi-clock"></i> {{ s.durationHours?.toFixed(1) ?? '—' }}h
                      </span>
                    </div>

                    <!-- Completion status for SCHEDULED real sessions -->
                    @if (s.status === 'SCHEDULED' && !s.isVirtual) {
                      <div class="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span [class]="s.teacherCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                          <i [class]="s.teacherCompleted ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
                          Prof
                        </span>
                        <span [class]="s.studentCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                          <i [class]="s.studentCompleted ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
                          Élève
                        </span>
                        <span class="italic">{{ lang.t().bothMustConfirm }}</span>
                      </div>
                    }

                    <!-- ncMeet JOIN button (prominent) -->
                    @if (s.isVirtual && s.status === 'SCHEDULED' && s.meetingLink) {
                      <div class="mt-3 flex items-center gap-2 flex-wrap">
                        <button (click)="joinNcMeet(s)"
                                class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                          <i class="bi bi-camera-video-fill"></i>
                          {{ lang.t().joinNcMeet }}
                        </button>
                        <button (click)="copyLink(s.meetingLink)"
                                class="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors">
                          <i class="bi bi-clipboard"></i> {{ lang.t().copyLink }}
                        </button>
                      </div>
                    }

                    <!-- ncMeet CREATE room (teacher, no link yet) -->
                    @if (s.isVirtual && s.status === 'SCHEDULED' && !s.meetingLink && auth.role() === 'teacher') {
                      <div class="mt-3">
                        <button (click)="createNcMeetRoom(s)" [disabled]="busy()[s.id]"
                                class="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-sm font-semibold rounded-xl transition-colors border border-purple-200 dark:border-purple-800">
                          @if (busy()[s.id]) {
                            <div class="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          } @else {
                            <i class="bi bi-plus-circle-fill"></i>
                          }
                          {{ lang.t().createRoom }}
                        </button>
                      </div>
                    }

                    @if (s.isVirtual && s.status === 'SCHEDULED') {
                      <p class="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                        <i class="bi bi-robot"></i> {{ lang.t().virtualInfo }}
                      </p>
                    }
                  </div>

                  <!-- Actions -->
                  <div class="flex flex-wrap gap-2 shrink-0">

                    <!-- PENDING: teacher confirms or rejects -->
                    @if (s.status === 'PENDING' && auth.role() === 'teacher') {
                      <button (click)="confirm(s)" [disabled]="busy()[s.id]"
                              class="btn-primary text-xs py-1.5 px-3">
                        @if (busy()[s.id]) {
                          <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        } @else {
                          <i class="bi bi-check-lg"></i>
                        }
                        {{ lang.t().confirm }}
                      </button>
                      <button (click)="rejectSession(s.id)" [disabled]="busy()[s.id]"
                              class="btn-danger text-xs py-1.5 px-3">
                        <i class="bi bi-x-lg"></i> {{ lang.t().reject }}
                      </button>
                    }

                    <!-- PENDING: student waits -->
                    @if (s.status === 'PENDING' && auth.role() === 'student') {
                      <span class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <i class="bi bi-hourglass-split"></i> {{ lang.t().waitingConfirm }}
                      </span>
                    }

                    <!-- SCHEDULED real: mark complete (teacher or student) -->
                    @if (s.status === 'SCHEDULED' && !s.isVirtual) {
                      @if (auth.role() === 'teacher' && !s.teacherCompleted) {
                        <button (click)="markComplete(s.id)"
                                [disabled]="busy()[s.id] || !sessionEnded(s)"
                                [title]="!sessionEnded(s) ? lang.t().sessionNotEndedYet : ''"
                                class="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">
                          <i class="bi bi-check-circle"></i> {{ lang.t().markComplete }}
                        </button>
                      }
                      @if (auth.role() === 'student' && !s.studentCompleted) {
                        <button (click)="markComplete(s.id)"
                                [disabled]="busy()[s.id] || !sessionEnded(s)"
                                [title]="!sessionEnded(s) ? lang.t().sessionNotEndedYet : ''"
                                class="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">
                          <i class="bi bi-check-circle"></i> {{ lang.t().markComplete }}
                        </button>
                      }
                      @if (auth.role() === 'teacher' && s.teacherCompleted && !s.studentCompleted) {
                        <span class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <i class="bi bi-hourglass-split"></i> {{ lang.t().waitingStudent }}
                        </span>
                      }
                      @if (auth.role() === 'student' && s.studentCompleted && !s.teacherCompleted) {
                        <span class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <i class="bi bi-hourglass-split"></i> {{ lang.t().waitingTeacher }}
                        </span>
                      }
                    }

                    <!-- SCHEDULED virtual: show ncMeet badge -->
                    @if (s.status === 'SCHEDULED' && s.isVirtual) {
                      <span class="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <i class="bi bi-robot"></i> ncMeet
                      </span>
                    }

                    <!-- Cancel for PENDING or SCHEDULED -->
                    @if (s.status === 'PENDING' || s.status === 'SCHEDULED') {
                      <button (click)="cancel(s.id)" [disabled]="busy()[s.id]"
                              class="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1">
                        <i class="bi bi-x-circle"></i> {{ lang.t().cancel }}
                      </button>
                    }

                    <!-- COMPLETED: student rates the session -->
                    @if (s.status === 'COMPLETED' && auth.role() === 'student') {
                      @if (reviewedSessions().has(s.id)) {
                        <span class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <i class="bi bi-check-circle-fill"></i> {{ lang.t().alreadyReviewed }}
                        </span>
                      } @else {
                        <button (click)="openReviewModal(s)"
                                class="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1">
                          <i class="bi bi-star-fill"></i> {{ lang.t().rateSession }}
                        </button>
                      }
                    }

                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Review Modal -->
      @if (reviewModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-1">{{ lang.t().rateSession }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">{{ reviewModal()?.teacherName }}</p>

            <!-- Star rating -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ lang.t().yourRating }}</label>
              <div class="flex gap-2">
                @for (star of [1,2,3,4,5]; track star) {
                  <button (click)="reviewRating.set(star)"
                          class="text-2xl transition-transform hover:scale-110"
                          [class.text-amber-400]="star <= reviewRating()"
                          [class.text-gray-300]="star > reviewRating()"
                          [class.dark:text-gray-600]="star > reviewRating()">
                    <i class="bi bi-star-fill"></i>
                  </button>
                }
              </div>
            </div>

            <!-- Comment -->
            <div class="mb-5">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ lang.t().yourComment }}</label>
              <textarea [(ngModel)]="reviewComment" rows="3"
                        [placeholder]="lang.t().reviewPlaceholder"
                        class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none">
              </textarea>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button (click)="closeReviewModal()"
                      class="flex-1 btn-secondary text-sm py-2.5">
                {{ lang.t().cancelReview }}
              </button>
              <button (click)="submitReview()"
                      [disabled]="reviewRating() === 0 || reviewSubmitting()"
                      class="flex-1 btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                @if (reviewSubmitting()) {
                  <span class="flex items-center justify-center gap-2">
                    <span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  </span>
                } @else {
                  <i class="bi bi-send"></i> {{ lang.t().submitReview }}
                }
              </button>
            </div>
          </div>
        </div>
      }

    </app-dashboard-layout>
  `
})
export class SessionsComponent implements OnInit {
  api   = inject(ApiService);
  auth  = inject(AuthService);
  toast = inject(ToastService);
  lang  = inject(LangService);

  sessions    = signal<any[]>([]);
  loading     = signal(true);
  busy        = signal<Record<number, boolean>>({});

  // Review system
  reviewModal       = signal<any | null>(null);   // session being reviewed
  reviewRating      = signal(0);
  reviewComment     = '';
  reviewSubmitting  = signal(false);
  reviewedSessions  = signal<Set<number>>(new Set());

  filterStatus = '';
  filterType   = '';
  filterFrom   = '';
  filterTo     = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = {};
    if (this.filterStatus) params['status'] = this.filterStatus;
    if (this.filterFrom)   params['from']   = new Date(this.filterFrom).toISOString();
    if (this.filterTo)     params['to']     = new Date(this.filterTo).toISOString();
    this.api.get<any[]>('/sessions', params).subscribe({
      next: (s) => {
        let list = s ?? [];
        if (this.filterType === 'virtual') list = list.filter((x: any) => x.isVirtual);
        if (this.filterType === 'real')    list = list.filter((x: any) => !x.isVirtual);
        this.sessions.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  resetFilters() {
    this.filterStatus = '';
    this.filterType   = '';
    this.filterFrom   = '';
    this.filterTo     = '';
    this.load();
  }

  private setBusy(id: number, val: boolean) {
    this.busy.update(b => ({ ...b, [id]: val }));
  }

  // ── ncMeet ──────────────────────────────────────────────────────────────────

  /**
   * Normalize any stored meeting link to a local /ncmeet/room/{roomId} path.
   * Handles legacy absolute URLs like https://meet.ncmeet.io/room/xyz
   * as well as correct relative paths like /ncmeet/room/xyz.
   */
  private normalizeNcMeetLink(link: string): string {
    if (!link) return '/ncmeet/';
    // Extract room ID from any URL format: /room/roomId or /ncmeet/room/roomId
    const match = link.match(/\/room\/([^/?#\s]+)/);
    if (match) return `/ncmeet/room/${match[1]}`;
    // Already a relative path starting with /ncmeet/ — use as-is
    if (link.startsWith('/ncmeet/')) return link;
    return '/ncmeet/';
  }

  /** Open the ncMeet room securely: first obtain a join token from Spring Boot. */
  async joinNcMeet(s: any) {
    this.setBusy(s.id, true);
    try {
      // Request a single-use join token for this session
      const tokenRes = await fetch(`/spring/api/ncmeet/sessions/${s.id}/join-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('edu_token') ?? ''}`
        }
      });
      if (!tokenRes.ok) {
        const err: any = await tokenRes.json();
        this.toast.error(err?.error ?? this.lang.t().ncMeetError);
        this.setBusy(s.id, false);
        return;
      }
      const { token, roomId, displayName } = await tokenRes.json() as any;

      // Store display name for the ncMeet UI
      sessionStorage.setItem('nc_displayName', displayName);

      // Build correct local URL with the join token as query param
      const localLink = `/ncmeet/room/${roomId}?token=${encodeURIComponent(token)}`;

      // Silently fix wrong stored link if needed
      const storedLink = this.normalizeNcMeetLink(s.meetingLink);
      if (s.meetingLink !== storedLink) {
        this.api.put<any>(`/sessions/${s.id}`, { meetingLink: storedLink }).subscribe({
          next: (updated) => this.sessions.update(list => list.map(x => x.id === s.id ? updated : x))
        });
      }

      this.toast.success(this.lang.t().openingNcMeet);
      window.open(localLink, '_blank');
    } catch {
      this.toast.error(this.lang.t().ncMeetError);
    } finally {
      this.setBusy(s.id, false);
    }
  }

  /** Create an ncMeet room for this session and save the link. */
  async createNcMeetRoom(s: any) {
    this.setBusy(s.id, true);
    try {
      const res = await fetch('/ncmeet/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: s.id, displayName: s.subject || 'Séance' }),
      });
      if (!res.ok) throw new Error('ncMeet API error');
      const data: any = await res.json();
      // joinUrl is like /ncmeet/room/:roomId — use it as the meeting link
      const link = data.joinUrl;
      this.api.put<any>(`/sessions/${s.id}`, { meetingLink: link }).subscribe({
        next: (updated) => {
          this.sessions.update(list => list.map(x => x.id === s.id ? updated : x));
          this.toast.success(this.lang.t().ncMeetCreated);
          this.setBusy(s.id, false);
        },
        error: () => { this.toast.error(this.lang.t().ncMeetError); this.setBusy(s.id, false); }
      });
    } catch {
      this.toast.error(this.lang.t().ncMeetError);
      this.setBusy(s.id, false);
    }
  }

  // ── Session actions ─────────────────────────────────────────────────────────

  /** Confirm session — auto-creates ncMeet room if virtual. */
  confirm(s: any) {
    this.setBusy(s.id, true);
    this.api.post<any>(`/sessions/${s.id}/confirm`).subscribe({
      next: async (confirmed) => {
        this.sessions.update(list => list.map(x => x.id === s.id ? confirmed : x));
        this.toast.success(this.lang.t().sessionConfirmed);

        // Auto-create ncMeet room for virtual sessions without a link
        if (confirmed.isVirtual && !confirmed.meetingLink) {
          try {
            const res = await fetch('/ncmeet/api/rooms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: s.id, displayName: confirmed.subject || 'Séance virtuelle' }),
            });
            if (res.ok) {
              const data: any = await res.json();
              this.api.put<any>(`/sessions/${s.id}`, { meetingLink: data.joinUrl }).subscribe({
                next: (updated) => {
                  this.sessions.update(list => list.map(x => x.id === s.id ? updated : x));
                  this.toast.success(this.lang.t().ncMeetCreated);
                }
              });
            }
          } catch { /* Silent fail — teacher can create manually */ }
        }
        this.setBusy(s.id, false);
      },
      error: (e) => { this.toast.error(e?.error?.message ?? 'Erreur'); this.setBusy(s.id, false); }
    });
  }

  rejectSession(id: number) {
    this.setBusy(id, true);
    this.api.post<any>(`/sessions/${id}/reject`).subscribe({
      next: (s) => {
        this.sessions.update(list => list.map(x => x.id === id ? s : x));
        this.toast.info(this.lang.t().sessionRejected);
        this.setBusy(id, false);
      },
      error: (e) => { this.toast.error(e?.error?.message ?? 'Erreur'); this.setBusy(id, false); }
    });
  }

  cancel(id: number) {
    this.setBusy(id, true);
    this.api.post<any>(`/sessions/${id}/cancel`).subscribe({
      next: (s) => {
        this.sessions.update(list => list.map(x => x.id === id ? s : x));
        this.toast.info(this.lang.t().sessionCancelled);
        this.setBusy(id, false);
      },
      error: (e) => { this.toast.error(e?.error?.message ?? 'Erreur'); this.setBusy(id, false); }
    });
  }

  markComplete(id: number) {
    this.setBusy(id, true);
    this.api.post<any>(`/sessions/${id}/complete`).subscribe({
      next: (s) => {
        this.sessions.update(list => list.map(x => x.id === id ? s : x));
        const msg = s._message === 'sessionCompleted'
          ? this.lang.t().sessionCompleted
          : this.lang.t().markedComplete;
        this.toast.success(msg);
        this.setBusy(id, false);
      },
      error: (e) => { this.toast.error(e?.error?.message ?? 'Erreur'); this.setBusy(id, false); }
    });
  }

  copyLink(link: string) {
    const local = this.normalizeNcMeetLink(link);
    navigator.clipboard.writeText(window.location.origin + local)
      .then(() => this.toast.success(this.lang.t().linkCopied));
  }

  /** Returns true when the session's end time is in the past (session has ended). */
  sessionEnded(s: any): boolean {
    if (!s.endTime) {
      // Fallback: compute from startTime + durationHours
      if (!s.startTime) return false;
      const end = new Date(s.startTime).getTime() + (s.durationHours ?? 1) * 3600000;
      return Date.now() >= end;
    }
    return Date.now() >= new Date(s.endTime).getTime();
  }

  // ── Review modal ──────────────────────────────────────────────────────────

  openReviewModal(s: any) {
    this.reviewRating.set(0);
    this.reviewComment = '';
    this.reviewModal.set(s);
  }

  closeReviewModal() {
    this.reviewModal.set(null);
  }

  submitReview() {
    const s = this.reviewModal();
    if (!s || this.reviewRating() === 0) return;
    this.reviewSubmitting.set(true);

    const body = {
      teacherId: s.teacherId,
      sessionId: s.id,
      rating: this.reviewRating(),
      comment: this.reviewComment.trim() || null
    };

    this.api.post<any>('/reviews', body).subscribe({
      next: () => {
        this.reviewedSessions.update(set => new Set([...set, s.id]));
        this.toast.success(this.lang.t().reviewSent);
        this.closeReviewModal();
        this.reviewSubmitting.set(false);
      },
      error: (e: any) => {
        this.toast.error(e?.error?.error ?? this.lang.t().reviewError);
        this.reviewSubmitting.set(false);
      }
    });
  }

  // ── Utilities ───────────────────────────────────────────────────────────

  formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  statusLabel(s: string) {
    const t = this.lang.t();
    const m: Record<string, string> = {
      PENDING: t.pending, SCHEDULED: t.scheduled,
      COMPLETED: t.completed, CANCELLED: t.cancelled
    };
    return m[s] ?? s;
  }

  statusBadge(s: string) {
    const m: Record<string, string> = {
      PENDING: 'badge-yellow', SCHEDULED: 'badge-blue',
      COMPLETED: 'badge-green', CANCELLED: 'badge-red', NO_SHOW: 'badge-gray'
    };
    return m[s] ?? 'badge-gray';
  }

  cardClass(s: any): string {
    if (s.status === 'PENDING')   return 'border-l-4 border-l-amber-400';
    if (s.status === 'SCHEDULED') return s.isVirtual ? 'border-l-4 border-l-purple-500' : 'border-l-4 border-l-blue-500';
    if (s.status === 'COMPLETED') return 'border-l-4 border-l-green-500 opacity-80';
    if (s.status === 'CANCELLED') return 'border-l-4 border-l-red-400 opacity-60';
    return '';
  }

  iconBg(status: string): string {
    const m: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      SCHEDULED: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      COMPLETED: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-400 dark:bg-red-900/20 dark:text-red-400'
    };
    return m[status] ?? 'bg-gray-100 text-gray-400';
  }
}
