import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="page-title">Gestion des cours</h1>
            <p class="text-gray-500 mt-1">{{ courses().length }} cours</p>
          </div>
          <button class="btn-primary" (click)="openCreate()">+ Nouveau cours</button>
        </div>

        <div class="card p-4 flex flex-wrap gap-3">
          <input type="text" class="input w-64" [(ngModel)]="search" (input)="applyFilter()" placeholder="Rechercher…">
        </div>

        @if (loading()) {
          <div class="card p-8 text-center"><div class="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full mx-auto"></div></div>
        } @else {
          <div class="card overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="table-th">Titre</th><th class="table-th">Matière</th>
                  <th class="table-th">Enseignant</th><th class="table-th">Niveau</th>
                  <th class="table-th">Élèves</th><th class="table-th">Statut</th><th class="table-th">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (c of filtered(); track c.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="table-td font-medium">{{ c.title }}</td>
                    <td class="table-td"><span class="badge-blue">{{ c.subject }}</span></td>
                    <td class="table-td text-gray-500">{{ c.teacherName }}</td>
                    <td class="table-td text-gray-500">{{ c.targetLevel }}</td>
                    <td class="table-td text-gray-500">{{ c.enrolledCount ?? 0 }}/{{ c.maxCapacity }}</td>
                    <td class="table-td"><span [class]="statusBadge(c.status)">{{ c.status }}</span></td>
                    <td class="table-td">
                      <button (click)="openEdit(c)" class="text-xs text-blue-700 hover:underline mr-3">Modifier</button>
                      <button (click)="deleteCourse(c.id)" class="text-xs text-red-600 hover:underline">Supprimer</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click.self)="closeModal()">
          <div class="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 class="section-title mb-5">{{ editingId() ? 'Modifier' : 'Créer' }} un cours</h2>
            <form (ngSubmit)="save()" class="space-y-4">
              <div><label class="label">Titre</label><input type="text" class="input" [(ngModel)]="form.title" name="title" required></div>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="label">Matière</label><input type="text" class="input" [(ngModel)]="form.subject" name="subject"></div>
                <div><label class="label">Niveau</label><input type="text" class="input" [(ngModel)]="form.targetLevel" name="targetLevel" placeholder="Ex: Terminale"></div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="label">ID Enseignant</label><input type="number" class="input" [(ngModel)]="form.teacherId" name="teacherId"></div>
                <div><label class="label">Capacité max</label><input type="number" class="input" [(ngModel)]="form.maxCapacity" name="maxCapacity"></div>
              </div>
              <div><label class="label">Description</label><textarea class="input h-20 resize-none" [(ngModel)]="form.description" name="description"></textarea></div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="btn-secondary" (click)="closeModal()">Annuler</button>
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  @if (saving()) { … } @else { {{ editingId() ? 'Modifier' : 'Créer' }} }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </app-dashboard-layout>
  `
})
export class AdminCoursesComponent implements OnInit {
  api   = inject(ApiService);
  toast = inject(ToastService);

  courses  = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading  = signal(true);
  search   = '';
  showModal = signal(false);
  editingId = signal<number | null>(null);
  saving    = signal(false);

  form = { title: '', subject: '', targetLevel: '', teacherId: null as number | null, maxCapacity: 20, description: '' };

  ngOnInit() { this.load(); }

  load() {
    this.api.get<any[]>('/spring/api/courses').subscribe({
      next: (c) => { this.courses.set(c); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    const s = this.search.toLowerCase();
    this.filtered.set(s ? this.courses().filter(c => c.title.toLowerCase().includes(s) || c.subject?.toLowerCase().includes(s)) : this.courses());
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { title: '', subject: '', targetLevel: '', teacherId: null, maxCapacity: 20, description: '' };
    this.showModal.set(true);
  }

  openEdit(c: any) {
    this.editingId.set(c.id);
    this.form = { title: c.title, subject: c.subject, targetLevel: c.targetLevel, teacherId: c.teacherId, maxCapacity: c.maxCapacity, description: c.description ?? '' };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    this.saving.set(true);
    const id = this.editingId();
    const req = id
      ? this.api.put<any>(`/spring/api/courses/${id}`, this.form)
      : this.api.post<any>('/spring/api/courses', this.form);

    req.subscribe({
      next: (c) => {
        if (id) this.courses.update(list => list.map(x => x.id === id ? c : x));
        else this.courses.update(list => [c, ...list]);
        this.applyFilter();
        this.toast.success(id ? 'Cours modifié' : 'Cours créé');
        this.saving.set(false);
        this.closeModal();
      },
      error: () => { this.toast.error('Erreur'); this.saving.set(false); }
    });
  }

  deleteCourse(id: number) {
    if (!confirm('Supprimer ce cours ?')) return;
    this.api.delete<any>(`/courses/${id}`).subscribe({
      next: () => { this.courses.update(list => list.filter(c => c.id !== id)); this.applyFilter(); this.toast.success('Cours supprimé'); },
      error: () => this.toast.error('Erreur')
    });
  }

  statusBadge(s: string) {
    const m: Record<string, string> = { ACTIVE: 'badge-green', PLANNED: 'badge-blue', COMPLETED: 'badge-gray', CANCELLED: 'badge-red' };
    return m[s] ?? 'badge-gray';
  }
}
