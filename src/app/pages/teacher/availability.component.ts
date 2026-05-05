import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div>
          <h1 class="page-title">Mes disponibilités</h1>
          <p class="text-gray-500 mt-1">Gérez vos créneaux horaires</p>
        </div>

        <!-- Add slot -->
        <div class="card p-5">
          <h2 class="section-title mb-4">Ajouter un créneau</h2>
          <div class="flex flex-wrap items-end gap-3">
            <div>
              <label class="label">Jour</label>
              <select class="input w-36" [(ngModel)]="newSlot.dayOfWeek">
                @for (d of days; track $index) {
                  <option [value]="$index">{{ d }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label">Début</label>
              <input type="time" class="input w-32" [(ngModel)]="newSlot.startTime">
            </div>
            <div>
              <label class="label">Fin</label>
              <input type="time" class="input w-32" [(ngModel)]="newSlot.endTime">
            </div>
            <div class="flex items-center gap-2 pb-0.5">
              <input type="checkbox" [(ngModel)]="newSlot.isRecurring" id="recurring" class="w-4 h-4">
              <label for="recurring" class="text-sm text-gray-700">Récurrent</label>
            </div>
            <button class="btn-primary" (click)="addSlot()" [disabled]="adding()">
              @if (adding()) { … } @else { + Ajouter }
            </button>
          </div>
        </div>

        <!-- Slots by day -->
        @if (loading()) {
          <div class="card p-8 text-center"><div class="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full mx-auto"></div></div>
        } @else if (slots().length === 0) {
          <div class="card p-12 text-center">
            <p class="text-4xl mb-3">🗓️</p>
            <p class="text-gray-500">Aucun créneau défini. Ajoutez vos disponibilités ci-dessus.</p>
          </div>
        } @else {
          <div class="grid md:grid-cols-2 gap-4">
            @for (day of days; track $index) {
              @if (slotsForDay($index).length > 0) {
                <div class="card p-4">
                  <h3 class="font-semibold text-gray-800 mb-3">{{ day }}</h3>
                  <div class="space-y-2">
                    @for (slot of slotsForDay($index); track slot.id) {
                      <div class="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                        <div class="flex items-center gap-2">
                          <span class="text-blue-900 font-medium text-sm">{{ slot.startTime }} – {{ slot.endTime }}</span>
                          @if (slot.isRecurring) {
                            <span class="badge-blue text-xs">Récurrent</span>
                          }
                        </div>
                        <button (click)="deleteSlot(slot.id)" class="text-red-400 hover:text-red-600 transition-colors text-sm">✕</button>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        }
      </div>
    </app-dashboard-layout>
  `
})
export class AvailabilityComponent implements OnInit {
  api   = inject(ApiService);
  toast = inject(ToastService);

  slots   = signal<any[]>([]);
  loading = signal(true);
  adding  = signal(false);
  days    = DAYS;

  newSlot = { dayOfWeek: 0, startTime: '09:00', endTime: '11:00', isRecurring: true };

  ngOnInit() {
    this.api.get<any[]>('/availability').subscribe({
      next: (s) => { this.slots.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  slotsForDay(day: number) {
    return this.slots().filter(s => s.dayOfWeek === day);
  }

  addSlot() {
    if (!this.newSlot.startTime || !this.newSlot.endTime) { this.toast.error('Remplissez les horaires'); return; }
    this.adding.set(true);
    this.api.post<any>('/availability', { ...this.newSlot, dayOfWeek: Number(this.newSlot.dayOfWeek) }).subscribe({
      next: (s) => { this.slots.update(list => [...list, s]); this.toast.success('Créneau ajouté'); this.adding.set(false); },
      error: () => { this.toast.error('Erreur lors de l\'ajout'); this.adding.set(false); }
    });
  }

  deleteSlot(id: number) {
    this.api.delete<any>(`/availability/${id}`).subscribe({
      next: () => { this.slots.update(list => list.filter(s => s.id !== id)); this.toast.success('Créneau supprimé'); },
      error: () => this.toast.error('Erreur')
    });
  }
}
