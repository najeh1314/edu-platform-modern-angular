import { Component, inject, signal, OnInit, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LangService } from '../../core/services/lang.service';

interface TimeSlot {
  date: Date; label: string; hour: number;
  available: boolean; isBooked: boolean; isPast: boolean;
}
interface DayCol { date: Date; label: string; shortLabel: string; slots: TimeSlot[]; }

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, DashboardLayoutComponent],
  template: `
    @if (auth.isAuthenticated()) {
      <app-dashboard-layout><ng-container *ngTemplateOutlet="content" /></app-dashboard-layout>
    } @else {
      <app-navbar />
      <div class="max-w-5xl mx-auto px-6 py-10"><ng-container *ngTemplateOutlet="content" /></div>
    }

    <ng-template #content>
      @if (loading()) {
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
        </div>
      } @else if (!teacher()) {
        <div class="card p-12 text-center dark:bg-gray-900">
          <p class="text-gray-500">Tuteur introuvable</p>
          <a [routerLink]="['/teachers']" class="btn-primary mt-4 inline-flex">Retour</a>
        </div>
      } @else {
        <div class="space-y-6">
          <a [routerLink]="['/teachers']" class="inline-flex items-center gap-1 text-sm text-blue-700 dark:text-blue-400 hover:underline">
            <i class="bi bi-arrow-left"></i> {{ lang.t().back }}
          </a>

          <!-- Profile card -->
          <div class="card p-6 dark:bg-gray-900">
            <div class="flex items-start gap-5 flex-wrap">
              <div class="w-20 h-20 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shrink-0">
                {{ teacher().firstName?.[0] }}{{ teacher().lastName?.[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ teacher().firstName }} {{ teacher().lastName }}</h1>
                <p class="text-blue-700 dark:text-blue-400 font-medium mt-1">{{ teacher().subjects?.join(' · ') ?? 'Enseignant' }}</p>
                <div class="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <span class="flex items-center gap-1">
                    <i class="bi bi-star-fill text-yellow-400"></i>
                    <strong class="text-gray-900 dark:text-white">{{ teacher().averageRating?.toFixed(1) ?? 'N/A' }}</strong>
                    ({{ teacher().totalReviews ?? 0 }} avis)
                  </span>
                  <span class="flex items-center gap-1"><i class="bi bi-mortarboard-fill text-blue-600"></i> {{ teacher().degree ?? 'Bac+5' }}</span>
                  <span class="flex items-center gap-1"><i class="bi bi-clock-history"></i> {{ teacher().totalHoursCompleted ?? 0 }}{{ lang.t().hoursTaught }}</span>
                  <span class="flex items-center gap-1"><i class="bi bi-geo-alt"></i> France</span>
                </div>
                <p class="text-gray-600 dark:text-gray-400 mt-4 leading-relaxed text-sm">{{ teacherBio() }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-3xl font-bold text-blue-900 dark:text-blue-300">{{ teacher().hourlyRate ?? '—' }}€</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ lang.t().perHour }}</p>
                @if (auth.role() === 'student') {
                  <button (click)="scrollToBooking()" class="btn-primary mt-3 w-full">
                    <i class="bi bi-calendar-plus"></i> {{ lang.t().bookSession }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Availability Calendar -->
          <div class="card p-6 dark:bg-gray-900">
            <div class="flex items-center justify-between mb-4">
              <h2 class="section-title flex items-center gap-2">
                <i class="bi bi-calendar-week text-blue-600"></i> {{ lang.t().availability2 }}
              </h2>
              <div class="flex items-center gap-2">
                <button (click)="prevWeek()" class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <i class="bi bi-chevron-left"></i>
                </button>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32 text-center">{{ weekLabel() }}</span>
                <button (click)="nextWeek()" class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>

            @if (auth.role() === 'student') {
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                <i class="bi bi-info-circle"></i> {{ lang.t().selectSlot }}
              </p>
            }

            <!-- Calendar grid -->
            <div class="overflow-x-auto">
              <div class="grid min-w-[560px]" [style.grid-template-columns]="'60px repeat(' + days().length + ', 1fr)'">
                <!-- Header row -->
                <div class="text-xs text-gray-400 dark:text-gray-500 pb-2"></div>
                @for (day of days(); track day.label) {
                  <div class="text-center pb-2">
                    <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{{ day.shortLabel }}</div>
                    <div [class]="isToday(day.date)
                      ? 'text-sm font-bold text-white bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center mx-auto mt-0.5'
                      : 'text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5'">
                      {{ day.date | date:'d' }}
                    </div>
                  </div>
                }

                <!-- Time rows -->
                @for (hour of hours; track hour) {
                  <div class="text-xs text-gray-400 dark:text-gray-500 flex items-start justify-end pr-3 pt-1 h-10">
                    {{ hour }}:00
                  </div>
                  @for (day of days(); track day.label) {
                    @let slot = getSlot(day, hour);
                    <div class="border-t border-gray-100 dark:border-gray-800 h-10 px-0.5 py-0.5">
                      @if (slot.isPast && slot.available && !slot.isBooked) {
                        <!-- Past available slot — greyed out, not selectable -->
                        <div class="w-full h-full rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 flex items-center justify-center line-through cursor-not-allowed select-none"
                             title="Créneau passé">
                          <i class="bi bi-clock-history text-[10px]"></i>
                        </div>
                      } @else if (slot.isBooked) {
                        <!-- Booked slot — unavailable for new booking -->
                        <div class="w-full h-full rounded text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center"
                             title="Déjà réservée">
                          <i class="bi bi-lock-fill text-[10px]"></i>
                        </div>
                      } @else if (slot.available) {
                        <!-- Available future slot -->
                        <button
                          (click)="auth.role() === 'student' && selectSlot(slot)"
                          [class]="selectedSlot()?.date?.getTime() === slot.date.getTime()
                            ? 'w-full h-full rounded text-xs font-medium bg-blue-600 text-white flex items-center justify-center'
                            : auth.role() === 'student'
                              ? 'w-full h-full rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center cursor-pointer'
                              : 'w-full h-full rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center justify-center'"
                          [disabled]="auth.role() !== 'student'">
                          <i class="bi bi-check-circle-fill text-xs"></i>
                        </button>
                      } @else {
                        <!-- Not in schedule -->
                        <div class="w-full h-full rounded bg-gray-50 dark:bg-gray-800/50"></div>
                      }
                    </div>
                  }
                }
              </div>
            </div>

            <!-- Legend -->
            <div class="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1.5">
                <span class="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 inline-block"></span> Disponible
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/30 inline-block"></span> Déjà réservée
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-4 h-4 rounded bg-blue-600 inline-block"></span> Sélectionné
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 inline-block"></span> Passé
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-4 h-4 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 inline-block"></span> Indisponible
              </span>
            </div>
          </div>

          <!-- Book session (student only) -->
          @if (auth.role() === 'student') {
            <div class="card p-6 dark:bg-gray-900" id="booking-section">
              <h2 class="section-title mb-4 flex items-center gap-2">
                <i class="bi bi-calendar-plus text-blue-600"></i> {{ lang.t().bookSession }}
              </h2>

              @if (selectedSlot()) {
                <div class="alert-success mb-4 flex items-center gap-2 text-sm">
                  <i class="bi bi-check-circle-fill"></i>
                  Créneau sélectionné : {{ selectedSlot()!.date | date:'EEEE d MMMM, HH:mm':'':'fr' }} – {{ (selectedSlot()!.hour + 1) }}:00
                </div>
              }

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ lang.t().subject }}</label>
                  <input type="text" class="input" [(ngModel)]="bookForm.subject" placeholder="Ex: Maths, Physique…">
                </div>
                <div>
                  <label class="label">{{ lang.t().type }}</label>
                  <select class="input" [(ngModel)]="bookForm.type">
                    <option value="private">{{ lang.t().private }}</option>
                    <option value="group">{{ lang.t().group }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">{{ lang.t().startTime }}</label>
                  <input type="datetime-local" class="input" [(ngModel)]="bookForm.startTime">
                </div>
                <div>
                  <label class="label">{{ lang.t().endTime }}</label>
                  <input type="datetime-local" class="input" [(ngModel)]="bookForm.endTime">
                </div>
              </div>

              <!-- Virtual session toggle -->
              <div class="mt-4 flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" [(ngModel)]="bookForm.isVirtual">
                  <div class="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-purple-600 rounded-full peer transition-colors"></div>
                  <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow"></div>
                </label>
                <div>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    <i class="bi bi-camera-video-fill text-purple-600"></i> {{ lang.t().isVirtual }}
                  </p>
                  @if (bookForm.isVirtual) {
                    <p class="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{{ lang.t().virtualInfo }}</p>
                  }
                </div>
              </div>

              <div class="flex items-center gap-3 mt-4">
                <button class="btn-primary px-6" (click)="bookSession()" [disabled]="booking()">
                  <i [class]="booking() ? 'bi bi-hourglass-split' : 'bi bi-send'"></i>
                  {{ booking() ? lang.t().booking : lang.t().book }}
                </button>
                @if (selectedSlot()) {
                  <button class="btn-secondary px-4" (click)="clearSlot()">
                    <i class="bi bi-x-lg"></i> Effacer
                  </button>
                }
              </div>
            </div>
          }

          <!-- Reviews -->
          <div class="card p-6 dark:bg-gray-900">
            <h2 class="section-title mb-4 flex items-center gap-2">
              <i class="bi bi-chat-quote text-blue-600"></i> {{ lang.t().reviews }}
            </h2>
            @if (reviews().length === 0) {
              <p class="text-gray-400 dark:text-gray-500 text-sm">{{ lang.t().noReviews }}</p>
            } @else {
              <div class="space-y-4">
                @for (r of reviews(); track r.id) {
                  <div class="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-medium text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <div class="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">É</div>
                        Élève
                      </span>
                      <div class="flex">
                        @for (i of [1,2,3,4,5]; track i) {
                          <i [class]="i <= r.rating ? 'bi bi-star-fill text-yellow-400 text-sm' : 'bi bi-star text-gray-200 dark:text-gray-600 text-sm'"></i>
                        }
                      </div>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 ml-9">{{ r.comment ?? 'Très bon tuteur !' }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </ng-template>
  `
})
export class TeacherDetailComponent implements OnInit {
  @Input() id!: string;
  api   = inject(ApiService);
  auth  = inject(AuthService);
  toast = inject(ToastService);
  lang  = inject(LangService);

  teacher      = signal<any>(null);
  reviews      = signal<any[]>([]);
  bookedSlots  = signal<any[]>([]);
  loading      = signal(true);
  booking      = signal(false);
  selectedSlot = signal<TimeSlot | null>(null);

  private weekOffset = signal(0);

  readonly hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  bookForm = {
    subject: '', startTime: '', endTime: '',
    type: 'private', isVirtual: false
  };

  readonly teacherBio = computed(() => {
    const t = this.teacher();
    if (t?.bio) return t.bio as string;
    return 'Enseignant passionné, totalement dévoué à la progression de chaque élève.';
  });

  readonly days = computed<DayCol[]>(() => {
    const t = this.lang.t();
    const dayNames = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];
    const now = new Date();

    // Build calendar in UTC wall-clock time (consistent with bookSession + Spring Boot validation).
    // All slot timestamps are UTC so comparison with UTC session timestamps is correct.
    const utcDay    = now.getUTCDay(); // 0=Sun, 1=Mon, ...
    const daysToMon = (utcDay + 6) % 7;
    const mondayMs  = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
                      - daysToMon * 86_400_000
                      + this.weekOffset() * 7 * 86_400_000;

    const booked = this.bookedSlots();

    return dayNames.map((shortLabel, i) => {
      const dayMs     = mondayMs + i * 86_400_000;
      const date      = new Date(dayMs); // UTC midnight of this calendar day
      const dayOfWeek = i; // 0=Mon … 6=Sun (matches availability.component.ts 0-indexed)

      const avail = this.teacher()?.availabilities ?? [];
      const hasAvailabilities = avail.length > 0;

      const nowMs = now.getTime();

      const slots: TimeSlot[] = this.hours.map(hour => {
        const slotStartMs = dayMs + hour * 3_600_000;
        const slotEndMs   = slotStartMs + 3_600_000;

        // A slot is past if its end time is already gone
        const isPast = slotEndMs <= nowMs;

        const inAvail = avail.some((a: any) =>
          a.dayOfWeek === dayOfWeek &&
          this.timeToMin(a.startTime) <= hour * 60 &&
          this.timeToMin(a.endTime)   >  hour * 60
        );
        const available = inAvail || (!hasAvailabilities && this.defaultAvailable(dayOfWeek, hour));

        // Compare UTC ms directly — sessions are stored in UTC, slots are UTC wall-clock
        const isBooked = booked.some(b => {
          const bStartMs = new Date(b.startTime).getTime();
          const bEndMs   = new Date(b.endTime).getTime();
          return bStartMs < slotEndMs && bEndMs > slotStartMs;
        });

        // slot.date = exact UTC start instant of this slot (dayMs + hour×3600s)
        return { date: new Date(slotStartMs), label: `${hour}:00`, hour, available, isBooked, isPast };
      });

      return {
        date,
        label: date.toLocaleDateString('fr', { weekday: 'long', timeZone: 'UTC' }),
        shortLabel,
        slots
      };
    });
  });

  readonly weekLabel = computed(() => {
    const cols = this.days();
    if (!cols.length) return '';
    const first = cols[0].date;
    const last  = cols[6].date;
    const fmt = (d: Date) => d.toLocaleDateString('fr', { day: 'numeric', month: 'short', timeZone: 'UTC' });
    return `${fmt(first)} – ${fmt(last)}`;
  });

  ngOnInit() {
    this.api.get<any>(`/teachers/${this.id}`).subscribe({
      next: (t) => { this.teacher.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.api.get<any[]>('/reviews', { teacherId: Number(this.id) }).subscribe({
      next: (r) => this.reviews.set(r ?? []),
      error: () => {}
    });
    this.loadBookedSlots();
  }

  private loadBookedSlots() {
    // Load the next 60 days of booked slots to populate the calendar
    const from = new Date().toISOString();
    const to   = new Date(Date.now() + 60 * 24 * 3600000).toISOString();
    this.api.get<any[]>(`/teachers/${this.id}/booked-slots`, { from, to }).subscribe({
      next: (slots) => this.bookedSlots.set(slots ?? []),
      error: () => {}
    });
  }

  private timeToMin(t: string): number {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private defaultAvailable(dayOfWeek: number, hour: number): boolean {
    // 0=Lundi … 4=Vendredi are weekdays; 5=Samedi, 6=Dimanche are weekend
    if (dayOfWeek >= 5) return false;
    return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18);
  }

  getSlot(day: DayCol, hour: number): TimeSlot {
    return day.slots.find(s => s.hour === hour)
      ?? { date: day.date, label: '', hour, available: false, isBooked: false, isPast: false };
  }

  isToday(date: Date): boolean {
    const now = new Date();
    return date.getUTCFullYear() === now.getUTCFullYear()
        && date.getUTCMonth()    === now.getUTCMonth()
        && date.getUTCDate()     === now.getUTCDate();
  }

  prevWeek() { this.weekOffset.update(v => v - 1); }
  nextWeek() { this.weekOffset.update(v => v + 1); }

  selectSlot(slot: TimeSlot) {
    if (slot.isBooked) {
      this.toast.error(this.lang.t().slotUnavailable);
      return;
    }
    if (slot.isPast) {
      this.toast.error('Ce créneau est déjà passé');
      return;
    }
    this.selectedSlot.set(slot);
    // slot.date is already the exact UTC start instant of this slot (dayMs + hour×3600s)
    // DO NOT add slot.hour again — that would double-count the offset
    const startMs = slot.date.getTime();
    const endMs   = startMs + 3_600_000;
    this.bookForm.startTime = this.toDatetimeLocal(new Date(startMs));
    this.bookForm.endTime   = this.toDatetimeLocal(new Date(endMs));
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  clearSlot() {
    this.selectedSlot.set(null);
    this.bookForm.startTime = '';
    this.bookForm.endTime   = '';
  }

  scrollToBooking() {
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private toDatetimeLocal(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }

  bookSession() {
    if (!this.bookForm.subject || !this.bookForm.startTime || !this.bookForm.endTime) {
      this.toast.error('Veuillez remplir tous les champs');
      return;
    }
    // Treat datetime-local as wall-clock UTC time (no timezone conversion).
    // This ensures the extracted HH:MM in Spring Boot matches the stored availability times.
    const toUtc = (s: string) => new Date(s.length === 16 ? s + ':00.000Z' : s + '.000Z');
    const start = toUtc(this.bookForm.startTime);
    const end   = toUtc(this.bookForm.endTime);
    if (end <= start) {
      this.toast.error('L\'heure de fin doit être après l\'heure de début');
      return;
    }
    this.booking.set(true);
    const payload = {
      teacherId: Number(this.id),
      subject:   this.bookForm.subject,
      type:      this.bookForm.type,
      isVirtual: this.bookForm.isVirtual,
      startTime: start.toISOString(),
      endTime:   end.toISOString()
    };
    this.api.post<any>('/sessions', payload).subscribe({
      next: () => {
        this.toast.success(this.lang.t().sessionCreated);
        this.booking.set(false);
        this.selectedSlot.set(null);
        this.bookForm = { subject: '', startTime: '', endTime: '', type: 'private', isVirtual: false };
        this.loadBookedSlots(); // Refresh calendar to show the new pending slot
      },
      error: (e) => {
        this.toast.error(e?.error?.message ?? 'Erreur lors de la réservation');
        this.booking.set(false);
      }
    });
  }
}
