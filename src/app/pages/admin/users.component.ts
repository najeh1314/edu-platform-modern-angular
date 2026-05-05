import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="page-title">Gestion des utilisateurs</h1>
            <p class="text-gray-500 mt-1">{{ filtered().length }} utilisateur(s)</p>
          </div>
        </div>

        <div class="card p-4 flex flex-wrap gap-3">
          <input type="text" class="input w-64" [(ngModel)]="search" (input)="applyFilter()" placeholder="Rechercher…">
          <select class="input w-36" [(ngModel)]="filterRole" (change)="applyFilter()">
            <option value="">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Enseignant</option>
            <option value="student">Élève</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        @if (loading()) {
          <div class="card p-8 text-center"><div class="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full mx-auto"></div></div>
        } @else {
          <div class="card overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="table-th">Utilisateur</th>
                  <th class="table-th">Email</th>
                  <th class="table-th">Rôle</th>
                  <th class="table-th">Statut</th>
                  <th class="table-th">Inscription</th>
                  <th class="table-th">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (u of filtered(); track u.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="table-td">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 bg-blue-900 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {{ u.firstName?.[0] }}{{ u.lastName?.[0] }}
                        </div>
                        <span class="font-medium">{{ u.firstName }} {{ u.lastName }}</span>
                      </div>
                    </td>
                    <td class="table-td text-gray-500">{{ u.email }}</td>
                    <td class="table-td"><span [class]="roleBadge(u.role)">{{ u.role }}</span></td>
                    <td class="table-td"><span [class]="statusBadge(u.status)">{{ u.status ?? 'active' }}</span></td>
                    <td class="table-td text-gray-400 text-xs">{{ formatDate(u.createdAt) }}</td>
                    <td class="table-td">
                      @if (u.status !== 'suspended') {
                        <button (click)="suspend(u)" class="text-xs text-red-600 hover:underline">Suspendre</button>
                      } @else {
                        <button (click)="activate(u)" class="text-xs text-green-700 hover:underline">Activer</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </app-dashboard-layout>
  `
})
export class AdminUsersComponent implements OnInit {
  api   = inject(ApiService);
  toast = inject(ToastService);

  users    = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading  = signal(true);
  search   = '';
  filterRole = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get<any[]>('/users').subscribe({
      next: (u) => { this.users.set(u); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    let list = this.users();
    if (this.search) list = list.filter(u =>
      (`${u.firstName} ${u.lastName} ${u.email}`).toLowerCase().includes(this.search.toLowerCase())
    );
    if (this.filterRole) list = list.filter(u => u.role === this.filterRole);
    this.filtered.set(list);
  }

  suspend(u: any) {
    this.api.post<any>(`/users/${u.id}/suspend`).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(x => x.id === u.id ? { ...x, status: 'suspended' } : x));
        this.applyFilter();
        this.toast.success(`${u.firstName} suspendu`);
      },
      error: () => this.toast.error('Erreur')
    });
  }

  activate(u: any) {
    this.api.post<any>(`/users/${u.id}/activate`).subscribe({
      next: () => {
        this.users.update(list => list.map(x => x.id === u.id ? { ...x, status: 'active' } : x));
        this.applyFilter();
        this.toast.success(`${u.firstName} activé`);
      },
      error: () => this.toast.error('Erreur')
    });
  }

  formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  roleBadge(r: string) {
    const m: Record<string, string> = { admin: 'badge-red', teacher: 'badge-blue', student: 'badge-green', parent: 'badge-purple' };
    return m[r] ?? 'badge-gray';
  }

  statusBadge(s: string) {
    const m: Record<string, string> = { active: 'badge-green', suspended: 'badge-red', pending: 'badge-yellow' };
    return m[s] ?? 'badge-gray';
  }
}
