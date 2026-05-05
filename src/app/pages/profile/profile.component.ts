import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../shared/dashboard-layout/dashboard-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { LangService } from '../../core/services/lang.service';

const EDU_SYSTEM_LABELS: Record<string, string> = {
  TN: '🇹🇳 Tunisie',
  FR: '🇫🇷 France',
  US: '🇺🇸 États-Unis',
  GB: '🇬🇧 Royaume-Uni',
};
const EDU_LEVELS: Record<string, string[]> = {
  TN: [
    'Préscolaire',
    '1ère année primaire','2ème année primaire','3ème année primaire',
    '4ème année primaire','5ème année primaire','6ème année primaire',
    '7ème année de base','8ème année de base','9ème année de base',
    '1ère année secondaire','2ème année secondaire',
    '3ème année secondaire','4ème année secondaire',
  ],
  FR: [
    'Toute Petite Section','Petite Section','Moyenne Section','Grande Section',
    'CP (Cours Préparatoire)','CE1 (Cours Élémentaire 1)','CE2 (Cours Élémentaire 2)',
    'CM1 (Cours Moyen 1)','CM2 (Cours Moyen 2)',
    '6ème','5ème','4ème','3ème',
    '2nde (Seconde)','1ère (Première)','Terminale',
  ],
  US: [
    'Preschool','Kindergarten',
    '1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade',
    '6th Grade','7th Grade','8th Grade',
    '9th Grade (Freshman)','10th Grade (Sophomore)',
    '11th Grade (Junior)','12th Grade (Senior)',
  ],
  GB: [
    'Nursery','Reception',
    'Year 1','Year 2','Year 3','Year 4','Year 5','Year 6',
    'Year 7','Year 8','Year 9','Year 10','Year 11',
    'Year 12 (Lower Sixth)','Year 13 (Upper Sixth)',
  ],
};
const ALL_SUBJECTS = [
  'Mathématiques','Physique','Chimie','Biologie / SVT','Sciences',
  'Histoire','Géographie','Histoire-Géo','Français','Anglais','Arabe',
  'Espagnol','Allemand','Italien','Informatique','Algorithmique','Programmation',
  'Économie','Gestion','Comptabilité','Droit','Philosophie','Psychologie',
  'Musique','Arts plastiques','Éducation physique','Préparation Bac','Soutien scolaire',
];

interface Education  { degree: string; institution: string; field: string; year: string; }
interface Experience { title: string; institution: string; from: string; to: string; }

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6 max-w-2xl">

        <div>
          <h1 class="page-title">{{ lang.t().myProfile }}</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">{{ lang.t().profileSubtitle }}</p>
        </div>

        <!-- Avatar + name card -->
        <div class="card dark:bg-gray-900 p-6">
          <div class="flex items-center gap-5">
            @if (teacherData()?.profileImageUrl || form.avatarUrl) {
              <img [src]="teacherData()?.profileImageUrl || form.avatarUrl"
                   class="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-200 dark:ring-blue-800"
                   alt="Photo de profil">
            } @else {
              <div class="w-20 h-20 bg-blue-900 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                {{ initials() }}
              </div>
            }
            <div>
              <p class="text-xl font-bold text-gray-900 dark:text-white">{{ form.firstName }} {{ form.lastName }}</p>
              <p class="text-gray-500 dark:text-gray-400">{{ auth.user()?.email }}</p>
              <span class="badge-blue mt-1 inline-block capitalize">{{ auth.role() }}</span>
              @if (teacherData()?.title) {
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">{{ teacherData()?.title }}</p>
              }
            </div>
          </div>
        </div>

        <!-- Basic info -->
        <div class="card dark:bg-gray-900 p-6">
          <h2 class="section-title mb-5">{{ lang.t().personalInfo }}</h2>
          @if (success()) { <div class="alert-success mb-4">{{ lang.t().profileUpdated }}</div> }
          @if (error())   { <div class="alert-error mb-4">{{ error() }}</div> }
          <form (ngSubmit)="save()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">{{ lang.t().firstName }}</label>
                <input type="text" class="input" [(ngModel)]="form.firstName" name="firstName">
              </div>
              <div>
                <label class="label">{{ lang.t().lastName }}</label>
                <input type="text" class="input" [(ngModel)]="form.lastName" name="lastName">
              </div>
            </div>
            <div>
              <label class="label">Email</label>
              <input type="email" class="input bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                     [(ngModel)]="form.email" name="email" [disabled]="true">
            </div>
            <div>
              <label class="label">{{ lang.t().phoneNumber }}</label>
              <input type="tel" class="input" [(ngModel)]="form.phone" name="phone" placeholder="+216 xx xxx xxx">
            </div>

            <!-- Education system + level (non-teacher) -->
            @if (auth.role() !== 'teacher') {
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Système éducatif</label>
                  <select class="input mt-1" [(ngModel)]="form.educationSystem" name="educationSystem"
                          (ngModelChange)="onEduSystemChange($event)">
                    <option value="">— Choisir —</option>
                    @for (sys of eduSystems; track sys.value) {
                      <option [value]="sys.value">{{ sys.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="label">Niveau</label>
                  <select class="input mt-1" [(ngModel)]="form.level" name="level"
                          [disabled]="!form.educationSystem">
                    <option value="">— Niveau —</option>
                    @for (l of currentLevels(); track l) {
                      <option [value]="l">{{ l }}</option>
                    }
                  </select>
                </div>
              </div>
            }

            <div>
              <label class="label">{{ lang.t().biography }}</label>
              <textarea class="input h-24 resize-none" [(ngModel)]="form.bio" name="bio"
                        [placeholder]="lang.t().bioPlaceholder"></textarea>
            </div>
            <div class="flex justify-end">
              <button type="submit" class="btn-primary px-6" [disabled]="saving()">
                @if (saving()) { {{ lang.t().saving }} } @else { {{ lang.t().save }} }
              </button>
            </div>
          </form>
        </div>

        <!-- ===== TEACHER-ONLY SECTIONS ===== -->
        @if (auth.role() === 'teacher') {

          <!-- Profile image + title + subjects -->
          <div class="card dark:bg-gray-900 p-6 space-y-4">
            <h2 class="section-title mb-1">Profil public enseignant</h2>
            <p class="text-sm text-gray-400 dark:text-gray-500 -mt-2">Ces informations sont visibles par les élèves sur votre fiche tuteur.</p>

            <div>
              <label class="label">Photo de profil (URL)</label>
              <input type="url" class="input mt-1" [(ngModel)]="teacherForm.profileImageUrl"
                     placeholder="https://exemple.com/votre-photo.jpg">
            </div>
            <div>
              <label class="label">Titre professionnel</label>
              <input type="text" class="input mt-1" [(ngModel)]="teacherForm.title"
                     placeholder="Ex : Professeur agrégé de Mathématiques">
            </div>
            <div>
              <label class="label">Description</label>
              <textarea class="input h-28 resize-none mt-1" [(ngModel)]="teacherForm.description"
                        placeholder="Présentez-vous, votre méthode pédagogique, vos résultats…"></textarea>
            </div>
            <div>
              <label class="label">Tarif horaire (€)</label>
              <input type="number" class="input mt-1" [(ngModel)]="teacherForm.hourlyRate"
                     placeholder="25" min="0" step="1">
            </div>

            <!-- Subjects -->
            <div>
              <label class="label">Matières enseignées</label>
              <div class="flex flex-wrap gap-2 mt-2">
                @for (s of allSubjects; track s) {
                  <button type="button" (click)="toggleSubject(s)"
                    [class]="teacherSubjects().has(s)
                      ? 'px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white'
                      : 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                    class="transition-colors">{{ s }}</button>
                }
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button class="btn-primary px-6" (click)="saveTeacherProfile()" [disabled]="savingTeacher()">
                @if (savingTeacher()) { Sauvegarde… } @else { Sauvegarder le profil }
              </button>
            </div>
          </div>

          <!-- Skills -->
          <div class="card dark:bg-gray-900 p-6 space-y-4">
            <h2 class="section-title">Compétences</h2>
            <div class="flex gap-2">
              <input type="text" class="input flex-1" [(ngModel)]="newSkill"
                     placeholder="Ex : LaTeX, Python, Pédagogie Montessori…"
                     (keydown.enter)="addSkill(); $event.preventDefault()">
              <button class="btn-secondary px-4" (click)="addSkill()">
                <i class="bi bi-plus-lg"></i> Ajouter
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              @for (skill of teacherSkills(); track skill) {
                <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                  {{ skill }}
                  <button (click)="removeSkill(skill)" class="text-blue-400 hover:text-red-500 transition-colors">
                    <i class="bi bi-x-circle-fill text-xs"></i>
                  </button>
                </span>
              }
              @if (teacherSkills().length === 0) {
                <p class="text-sm text-gray-400">Aucune compétence ajoutée</p>
              }
            </div>
            <div class="flex justify-end">
              <button class="btn-primary px-6" (click)="saveTeacherProfile()" [disabled]="savingTeacher()">
                @if (savingTeacher()) { Sauvegarde… } @else { Sauvegarder }
              </button>
            </div>
          </div>

          <!-- Educations -->
          <div class="card dark:bg-gray-900 p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="section-title mb-0">Formation académique</h2>
              <button class="btn-secondary text-sm px-3 py-1.5" (click)="addEducation()">
                <i class="bi bi-plus-lg"></i> Ajouter
              </button>
            </div>
            @for (edu of teacherEducations(); track $index; let i = $index) {
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div class="flex justify-end">
                  <button (click)="removeEducation(i)" class="text-red-400 hover:text-red-600 text-sm">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label text-xs">Diplôme</label>
                    <input type="text" class="input text-sm" [(ngModel)]="edu.degree" [name]="'edu_deg_' + i"
                           placeholder="Ex: Master 2">
                  </div>
                  <div>
                    <label class="label text-xs">Domaine</label>
                    <input type="text" class="input text-sm" [(ngModel)]="edu.field" [name]="'edu_fld_' + i"
                           placeholder="Ex: Mathématiques">
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label text-xs">Établissement</label>
                    <input type="text" class="input text-sm" [(ngModel)]="edu.institution" [name]="'edu_inst_' + i"
                           placeholder="Ex: Université Paris 6">
                  </div>
                  <div>
                    <label class="label text-xs">Année</label>
                    <input type="text" class="input text-sm" [(ngModel)]="edu.year" [name]="'edu_yr_' + i"
                           placeholder="Ex: 2018">
                  </div>
                </div>
              </div>
            }
            @if (teacherEducations().length > 0) {
              <div class="flex justify-end">
                <button class="btn-primary px-6" (click)="saveTeacherProfile()" [disabled]="savingTeacher()">
                  @if (savingTeacher()) { Sauvegarde… } @else { Sauvegarder }
                </button>
              </div>
            }
          </div>

          <!-- Experiences -->
          <div class="card dark:bg-gray-900 p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="section-title mb-0">Expériences professionnelles</h2>
              <button class="btn-secondary text-sm px-3 py-1.5" (click)="addExperience()">
                <i class="bi bi-plus-lg"></i> Ajouter
              </button>
            </div>
            @for (exp of teacherExperiences(); track $index; let i = $index) {
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div class="flex justify-end">
                  <button (click)="removeExperience(i)" class="text-red-400 hover:text-red-600 text-sm">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label text-xs">Poste / Titre</label>
                    <input type="text" class="input text-sm" [(ngModel)]="exp.title" [name]="'exp_ttl_' + i"
                           placeholder="Ex: Professeur de Maths">
                  </div>
                  <div>
                    <label class="label text-xs">Établissement</label>
                    <input type="text" class="input text-sm" [(ngModel)]="exp.institution" [name]="'exp_ins_' + i"
                           placeholder="Ex: Lycée Henri IV">
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label text-xs">De</label>
                    <input type="text" class="input text-sm" [(ngModel)]="exp.from" [name]="'exp_fr_' + i"
                           placeholder="2019">
                  </div>
                  <div>
                    <label class="label text-xs">À</label>
                    <input type="text" class="input text-sm" [(ngModel)]="exp.to" [name]="'exp_to_' + i"
                           placeholder="Présent">
                  </div>
                </div>
              </div>
            }
            @if (teacherExperiences().length > 0) {
              <div class="flex justify-end">
                <button class="btn-primary px-6" (click)="saveTeacherProfile()" [disabled]="savingTeacher()">
                  @if (savingTeacher()) { Sauvegarde… } @else { Sauvegarder }
                </button>
              </div>
            }
          </div>

        } <!-- end teacher sections -->

        <!-- Password -->
        <div class="card dark:bg-gray-900 p-6">
          <h2 class="section-title mb-5">{{ lang.t().changePassword }}</h2>
          <form (ngSubmit)="changePassword()" class="space-y-4">
            <div>
              <label class="label">{{ lang.t().newPassword }}</label>
              <input type="password" class="input" [(ngModel)]="pwForm.password" name="password"
                     [placeholder]="lang.t().minChars">
            </div>
            <div>
              <label class="label">{{ lang.t().confirmPassword }}</label>
              <input type="password" class="input" [(ngModel)]="pwForm.confirm" name="confirm"
                     [placeholder]="lang.t().repeatPassword">
            </div>
            <div class="flex justify-end">
              <button type="submit" class="btn-outline px-6" [disabled]="savingPw()">
                @if (savingPw()) { … } @else { {{ lang.t().changeBtn }} }
              </button>
            </div>
          </form>
        </div>

      </div>
    </app-dashboard-layout>
  `
})
export class ProfileComponent implements OnInit {
  auth  = inject(AuthService);
  api   = inject(ApiService);
  toast = inject(ToastService);
  lang  = inject(LangService);

  form = { firstName: '', lastName: '', email: '', phone: '', bio: '', avatarUrl: '', educationSystem: '', level: '' };
  pwForm = { password: '', confirm: '' };
  saving      = signal(false);
  savingPw    = signal(false);
  savingTeacher = signal(false);
  success     = signal(false);
  error       = signal('');

  // Teacher-specific
  teacherData  = signal<any>(null);
  teacherForm  = { profileImageUrl: '', title: '', description: '', hourlyRate: 0 };
  _teacherSubjects  = signal<Set<string>>(new Set());
  _teacherSkills    = signal<string[]>([]);
  _teacherEducations= signal<Education[]>([]);
  _teacherExperiences=signal<Experience[]>([]);
  teacherSubjects   = computed(() => this._teacherSubjects());
  teacherSkills     = computed(() => this._teacherSkills());
  teacherEducations = computed(() => this._teacherEducations());
  teacherExperiences= computed(() => this._teacherExperiences());
  newSkill = '';

  allSubjects = ALL_SUBJECTS;
  eduSystems = Object.entries(EDU_SYSTEM_LABELS).map(([value, label]) => ({ value, label }));

  // Signal dédié pour que computed() soit réactif
  _eduSystem = signal('');
  currentLevels = computed(() => EDU_LEVELS[this._eduSystem()] ?? []);

  onEduSystemChange(val: string) {
    this._eduSystem.set(val);
    this.form.level = '';
  }

  ngOnInit() {
    const u = this.auth.user();
    if (u) {
      this.form.firstName       = u.firstName ?? '';
      this.form.lastName        = u.lastName  ?? '';
      this.form.email           = u.email     ?? '';
      this.form.phone           = (u as any).phone ?? '';
      this.form.bio             = (u as any).bio   ?? '';
      this.form.educationSystem = (u as any).educationSystem ?? '';
      this.form.level           = (u as any).level ?? '';
      this.form.avatarUrl       = (u as any).avatarUrl ?? '';
      // Sync le signal pour que currentLevels() soit réactif dès le chargement
      this._eduSystem.set(this.form.educationSystem);
    }
    if (this.auth.role() === 'teacher') this.loadTeacherProfile();
  }

  initials() {
    return (this.form.firstName?.[0] ?? '') + (this.form.lastName?.[0] ?? '');
  }

  // ── Teacher profile load ────────────────────────────────────────────
  loadTeacherProfile() {
    const userId = this.auth.user()?.id;
    this.api.get<any[]>('/teachers').subscribe({
      next: (teachers) => {
        const t = (teachers ?? []).find((t: any) => t.userId === userId);
        if (!t) return;
        this.teacherData.set(t);
        this.teacherForm.profileImageUrl = t.profileImageUrl ?? '';
        this.teacherForm.title           = t.title           ?? '';
        this.teacherForm.description     = t.description     ?? '';
        this.teacherForm.hourlyRate      = t.hourlyRate      ?? 0;

        const subjs = t.subjects ? t.subjects.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        this._teacherSubjects.set(new Set(subjs));

        const skills = this.parseJson(t.skills, []);
        this._teacherSkills.set(skills);

        const edus = this.parseJson(t.educations, []);
        this._teacherEducations.set(edus);

        const exps = this.parseJson(t.experiences, []);
        this._teacherExperiences.set(exps);
      },
      error: () => {}
    });
  }

  private parseJson(raw: string | null | undefined, fallback: any) {
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  // ── Subjects ──────────────────────────────────────────────────────
  toggleSubject(s: string) {
    this._teacherSubjects.update(set => {
      const n = new Set(set);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
  }

  // ── Skills ────────────────────────────────────────────────────────
  addSkill() {
    const s = this.newSkill.trim();
    if (!s) return;
    if (!this._teacherSkills().includes(s)) this._teacherSkills.update(arr => [...arr, s]);
    this.newSkill = '';
  }
  removeSkill(s: string) {
    this._teacherSkills.update(arr => arr.filter(x => x !== s));
  }

  // ── Educations ───────────────────────────────────────────────────
  addEducation() {
    this._teacherEducations.update(arr => [...arr, { degree: '', institution: '', field: '', year: '' }]);
  }
  removeEducation(i: number) {
    this._teacherEducations.update(arr => arr.filter((_, idx) => idx !== i));
  }

  // ── Experiences ──────────────────────────────────────────────────
  addExperience() {
    this._teacherExperiences.update(arr => [...arr, { title: '', institution: '', from: '', to: '' }]);
  }
  removeExperience(i: number) {
    this._teacherExperiences.update(arr => arr.filter((_, idx) => idx !== i));
  }

  // ── Save teacher profile ─────────────────────────────────────────
  saveTeacherProfile() {
    const td = this.teacherData();
    if (!td) return;
    this.savingTeacher.set(true);
    const subjects = Array.from(this._teacherSubjects()).join(',');
    const payload = {
      profileImageUrl: this.teacherForm.profileImageUrl || null,
      title:           this.teacherForm.title           || null,
      description:     this.teacherForm.description     || null,
      hourlyRate:      this.teacherForm.hourlyRate       || null,
      subjects,
      subject:         subjects.split(',')[0]?.trim() || 'Math',
      skills:          JSON.stringify(this._teacherSkills()),
      educations:      JSON.stringify(this._teacherEducations()),
      experiences:     JSON.stringify(this._teacherExperiences()),
      firstName:       this.form.firstName,
      lastName:        this.form.lastName,
      phone:           this.form.phone,
    };
    this.api.put<any>(`/teachers/${td.id}/profile`, payload).subscribe({
      next: (t) => {
        this.teacherData.set(t);
        this.toast.success('Profil enseignant mis à jour !');
        this.savingTeacher.set(false);
      },
      error: () => { this.toast.error('Erreur lors de la mise à jour'); this.savingTeacher.set(false); }
    });
  }

  // ── Save basic user info ─────────────────────────────────────────
  save() {
    this.saving.set(true);
    this.success.set(false);
    this.error.set('');
    const userId = this.auth.user()?.id;
    this.api.put<any>(`/users/${userId}`, {
      firstName:       this.form.firstName,
      lastName:        this.form.lastName,
      phone:           this.form.phone,
      bio:             this.form.bio,
      educationSystem: this.form.educationSystem || null,
      level:           this.form.level           || null,
    }).subscribe({
      next: (u) => {
        this.auth.login(this.auth.token()!, { ...this.auth.user()!, ...u });
        this.success.set(true);
        this.saving.set(false);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: () => { this.error.set(this.lang.t().updateError); this.saving.set(false); }
    });
  }

  changePassword() {
    if (this.pwForm.password !== this.pwForm.confirm) { this.toast.error(this.lang.t().passwordMismatch); return; }
    if (this.pwForm.password.length < 6) { this.toast.error(this.lang.t().passwordTooShort); return; }
    this.savingPw.set(true);
    const userId = this.auth.user()?.id;
    this.api.put<any>(`/users/${userId}`, { password: this.pwForm.password }).subscribe({
      next: () => { this.toast.success(this.lang.t().passwordChanged); this.savingPw.set(false); this.pwForm = { password: '', confirm: '' }; },
      error: () => { this.toast.error(this.lang.t().updateError); this.savingPw.set(false); }
    });
  }
}
