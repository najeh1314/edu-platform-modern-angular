import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LangService } from '../../core/services/lang.service';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, DashboardLayoutComponent],
  template: `
    @if (auth.isAuthenticated()) {
      <app-dashboard-layout><ng-container *ngTemplateOutlet="content" /></app-dashboard-layout>
    } @else {
      <app-navbar />
      <div class="max-w-7xl mx-auto px-6 py-10"><ng-container *ngTemplateOutlet="content" /></div>
    }

    <ng-template #content>
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="page-title">{{ lang.t().ourTutors }}</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">{{ filtered().length }} {{ lang.t().teachers.toLowerCase() }}</p>
          </div>
          <input type="text" class="input w-64" [(ngModel)]="search" (input)="applyFilter()"
                 [placeholder]="lang.t().searchTutor">
        </div>

        <div class="flex flex-wrap gap-2">
          @for (s of subjects; track s) {
            <button (click)="toggleSubject(s)"
              [class]="filterSubject === s ? 'badge-blue cursor-pointer' : 'badge-gray cursor-pointer hover:bg-gray-200'"
              class="px-3 py-1 text-xs rounded-full font-medium transition-all">{{ s }}</button>
          }
        </div>

        @if (loading()) {
          <div class="grid md:grid-cols-3 gap-5">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="card dark:bg-gray-900 p-5 space-y-3 animate-pulse">
                <div class="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            }
          </div>
        } @else if (filtered().length === 0) {
          <div class="card dark:bg-gray-900 p-12 text-center">
            <p class="text-4xl mb-3">👨‍🏫</p>
            <p class="text-gray-500 dark:text-gray-400">{{ lang.t().noTutors }}</p>
          </div>
        } @else {
          <div class="grid md:grid-cols-3 gap-5">
            @for (t of filtered(); track t.id) {
              <div class="card dark:bg-gray-900 p-5 hover:shadow-md transition-shadow flex flex-col">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0">
                    {{ t.firstName?.[0] }}{{ t.lastName?.[0] }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-gray-900 dark:text-white truncate">{{ t.firstName }} {{ t.lastName }}</p>
                    <div class="flex items-center gap-1 text-sm text-amber-500">
                      @for (i of [1,2,3,4,5]; track i) {
                        <i [class]="i <= (t.rating ?? 0) ? 'bi bi-star-fill' : 'bi bi-star'" class="text-xs"></i>
                      }
                      <span class="text-gray-400 dark:text-gray-500 text-xs ms-1">({{ t.reviewCount ?? 0 }})</span>
                    </div>
                  </div>
                </div>

                @if (t.subjects?.length) {
                  <div class="flex flex-wrap gap-1 mb-3">
                    @for (s of t.subjects.slice(0,3); track s) {
                      <span class="badge-blue text-xs">{{ s }}</span>
                    }
                  </div>
                }

                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 flex-1 line-clamp-2">
                  {{ t.bio ?? '' }}
                </p>

                <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span class="font-semibold text-blue-900 dark:text-blue-400">{{ t.hourlyRate ?? '—' }}€/h</span>
                  <span class="text-xs">{{ t.totalHours ?? 0 }}{{ lang.t().perHour === 'par heure' ? 'h enseignées' : (lang.t().perHour === 'per hour' ? 'h taught' : 'ساعة') }}</span>
                </div>

                <a [routerLink]="['/teachers', t.id]" class="btn-primary text-center w-full">
                  {{ lang.t().seeProfile }}
                </a>
              </div>
            }
          </div>
        }
      </div>
    </ng-template>
  `
})
export class TeachersComponent implements OnInit {
  api  = inject(ApiService);
  auth = inject(AuthService);
  lang = inject(LangService);

  teachers = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading  = signal(true);
  search   = '';
  filterSubject = '';

  subjects = ['Maths', 'Français', 'Physique', 'Chimie', 'Histoire', 'Anglais', 'Arabe', 'SVT'];

  ngOnInit() {
    this.api.get<any[]>('/teachers').subscribe({
      next: (t) => { this.teachers.set(t); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    let list = this.teachers();
    if (this.search) list = list.filter(t =>
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(this.search.toLowerCase()) ||
      t.subjects?.some((s: string) => s.toLowerCase().includes(this.search.toLowerCase())));
    if (this.filterSubject) list = list.filter(t => t.subjects?.includes(this.filterSubject));
    this.filtered.set(list);
  }

  toggleSubject(s: string) {
    this.filterSubject = this.filterSubject === s ? '' : s;
    this.applyFilter();
  }
}
