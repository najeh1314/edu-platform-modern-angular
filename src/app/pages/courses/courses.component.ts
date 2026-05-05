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
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, DashboardLayoutComponent],
  template: `
    @if (auth.isAuthenticated()) {
      <app-dashboard-layout>
        <ng-container *ngTemplateOutlet="content" />
      </app-dashboard-layout>
    } @else {
      <app-navbar />
      <div class="max-w-7xl mx-auto px-6 py-10">
        <ng-container *ngTemplateOutlet="content" />
      </div>
    }

    <ng-template #content>
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="page-title">{{ lang.t().courseCatalogue }}</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">{{ filtered().length }} {{ lang.t().courses.toLowerCase() }}</p>
          </div>
          <input type="text" class="input w-64" [(ngModel)]="search" (input)="applyFilter()"
                 [placeholder]="lang.t().searchCourse">
        </div>

        <!-- Subject filter -->
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
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
              </div>
            }
          </div>
        } @else if (filtered().length === 0) {
          <div class="card dark:bg-gray-900 p-12 text-center">
            <p class="text-4xl mb-3">📚</p>
            <p class="text-gray-500 dark:text-gray-400">{{ lang.t().noCourses }}</p>
          </div>
        } @else {
          <div class="grid md:grid-cols-3 gap-5">
            @for (c of filtered(); track c.id) {
              <div class="card dark:bg-gray-900 p-5 hover:shadow-md transition-shadow flex flex-col">
                <div class="flex items-start justify-between mb-3">
                  <span class="badge-blue">{{ c.subject }}</span>
                  <span class="badge-gray text-xs">{{ c.targetLevel }}</span>
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ c.title }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 flex-1">
                  {{ c.description ?? lang.t().noDescription }}
                </p>
                <div class="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>👨‍🏫 {{ c.teacherName }}</span>
                  <span>{{ c.enrolledCount ?? 0 }}/{{ c.maxCapacity ?? '?' }} {{ lang.t().students }}</span>
                </div>
                <a [routerLink]="['/courses', c.id]" class="btn-primary text-center w-full">
                  {{ lang.t().viewCourse }}
                </a>
              </div>
            }
          </div>
        }
      </div>
    </ng-template>
  `
})
export class CoursesComponent implements OnInit {
  api  = inject(ApiService);
  auth = inject(AuthService);
  lang = inject(LangService);

  courses  = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading  = signal(true);
  search   = '';
  filterSubject = '';

  subjects = ['Maths', 'Français', 'Physique', 'Chimie', 'Histoire', 'Anglais', 'Arabe', 'SVT'];

  ngOnInit() {
    this.api.get<any[]>('/spring/api/courses').subscribe({
      next: (c) => { this.courses.set(c); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    let list = this.courses();
    if (this.search) list = list.filter(c =>
      c.title.toLowerCase().includes(this.search.toLowerCase()) ||
      c.subject?.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterSubject) list = list.filter(c => c.subject === this.filterSubject);
    this.filtered.set(list);
  }

  toggleSubject(s: string) {
    this.filterSubject = this.filterSubject === s ? '' : s;
    this.applyFilter();
  }
}
