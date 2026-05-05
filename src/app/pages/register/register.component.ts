import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
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
    '1ère année primaire', '2ème année primaire', '3ème année primaire',
    '4ème année primaire', '5ème année primaire', '6ème année primaire',
    '7ème année de base', '8ème année de base', '9ème année de base',
    '1ère année secondaire', '2ème année secondaire',
    '3ème année secondaire', '4ème année secondaire',
  ],
  FR: [
    'Toute Petite Section', 'Petite Section', 'Moyenne Section', 'Grande Section',
    'CP (Cours Préparatoire)', 'CE1 (Cours Élémentaire 1)', 'CE2 (Cours Élémentaire 2)',
    'CM1 (Cours Moyen 1)', 'CM2 (Cours Moyen 2)',
    '6ème', '5ème', '4ème', '3ème',
    '2nde (Seconde)', '1ère (Première)', 'Terminale',
  ],
  US: [
    'Preschool', 'Kindergarten',
    '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
    '6th Grade', '7th Grade', '8th Grade',
    '9th Grade (Freshman)', '10th Grade (Sophomore)',
    '11th Grade (Junior)', '12th Grade (Senior)',
  ],
  GB: [
    'Nursery', 'Reception',
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
    'Year 12 (Lower Sixth)', 'Year 13 (Upper Sixth)',
  ],
};

const ALL_SUBJECTS = [
  'Mathématiques', 'Physique', 'Chimie', 'Biologie / SVT', 'Sciences',
  'Histoire', 'Géographie', 'Histoire-Géo',
  'Français', 'Anglais', 'Arabe', 'Espagnol', 'Allemand', 'Italien',
  'Informatique', 'Algorithmique', 'Programmation',
  'Économie', 'Gestion', 'Comptabilité', 'Droit',
  'Philosophie', 'Psychologie',
  'Musique', 'Arts plastiques', 'Éducation physique',
  'Préparation Bac', 'Préparation concours', 'Soutien scolaire',
];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">

      <!-- Email sent confirmation -->
      @if (emailSent()) {
        <div class="card dark:bg-gray-900 w-full max-w-md p-8 text-center space-y-5">
          <div class="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <i class="bi bi-envelope-check-fill text-4xl text-blue-600 dark:text-blue-400"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Vérifiez votre email !</h2>
          <p class="text-gray-500 dark:text-gray-400">
            Un email de confirmation a été envoyé à
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ form.email }}</span>.
            Cliquez sur le lien pour activer votre compte.
          </p>
          <p class="text-sm text-gray-400 dark:text-gray-500">
            Vous n'avez pas reçu l'email ? Vérifiez vos spams.
          </p>
          <a routerLink="/login" class="btn-primary w-full py-2.5 block text-center">Aller à la connexion</a>
        </div>
      } @else {

      <div class="card dark:bg-gray-900 w-full max-w-lg p-8">
        <div class="text-center mb-6">
          <div class="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <i class="bi bi-mortarboard-fill text-2xl text-white"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ lang.t().createAccount }}</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">{{ lang.t().joinToday }}</p>
        </div>

        @if (error()) {
          <div class="alert-error mb-4">{{ error() }}</div>
        }

        <form (ngSubmit)="register()" class="space-y-4">

          <!-- Name -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">{{ lang.t().firstName }}</label>
              <input type="text" class="input" [(ngModel)]="form.firstName" name="firstName" required autocomplete="given-name">
            </div>
            <div>
              <label class="label">{{ lang.t().lastName }}</label>
              <input type="text" class="input" [(ngModel)]="form.lastName" name="lastName" required autocomplete="family-name">
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="label">Email</label>
            <input type="email" class="input" [(ngModel)]="form.email" name="email" required autocomplete="email">
          </div>

          <!-- Phone -->
          <div>
            <label class="label">{{ lang.t().phoneNumber }}</label>
            <input type="tel" class="input" [(ngModel)]="form.phone" name="phone" placeholder="+216 xx xxx xxx">
          </div>

          <!-- Password -->
          <div>
            <label class="label">{{ lang.t().password }}</label>
            <div class="relative">
              <input [type]="showPw() ? 'text' : 'password'" class="input pr-10"
                     [(ngModel)]="form.password" name="password"
                     placeholder="Min. 6 caractères" required minlength="6">
              <button type="button" (click)="togglePw()"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i [class]="showPw() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Role -->
          <div>
            <label class="label">{{ lang.t().iAm }}</label>
            <div class="grid grid-cols-3 gap-2 mt-1">
              @for (r of roles; track r.value) {
                <button type="button"
                  (click)="form.role = r.value"
                  [class]="form.role === r.value
                    ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'"
                  class="rounded-xl p-3 text-sm flex flex-col items-center gap-1 transition-all">
                  <span class="text-xl">{{ r.icon }}</span>
                  <span>{{ r.label }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Teacher subjects -->
          @if (form.role === 'teacher') {
            <div>
              <label class="label">Matières enseignées</label>
              <p class="text-xs text-gray-400 mb-2">Sélectionnez une ou plusieurs matières</p>
              <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto py-1">
                @for (s of allSubjects; track s) {
                  <button type="button" (click)="toggleSubject(s)"
                    [class]="selectedSubjects().has(s)
                      ? 'px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white'
                      : 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
                    class="transition-colors">
                    {{ s }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- Educational system (student + parent) -->
          @if (form.role !== 'teacher') {
            <div class="grid grid-cols-2 gap-3">
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

          <!-- Submit -->
          <button type="submit" class="btn-primary w-full py-3 mt-2 text-base font-semibold" [disabled]="loading()">
            @if (loading()) {
              <span class="flex items-center justify-center gap-2">
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Inscription…
              </span>
            } @else {
              {{ lang.t().createMyAccount }}
            }
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          {{ lang.t().alreadyMember }}
          <a routerLink="/login" class="text-blue-700 dark:text-blue-400 font-medium hover:underline ms-1">{{ lang.t().signInLink }}</a>
        </p>
      </div>

      }
    </div>
  `
})
export class RegisterComponent {
  api    = inject(ApiService);
  auth   = inject(AuthService);
  toast  = inject(ToastService);
  router = inject(Router);
  lang   = inject(LangService);

  form = {
    firstName: '', lastName: '', email: '', phone: '',
    password: '', role: 'student',
    educationSystem: '', level: '',
  };

  loading   = signal(false);
  error     = signal('');
  showPw    = signal(false);
  emailSent = signal(false);

  togglePw() { this.showPw.set(!this.showPw()); }
  _selectedSubjects = signal<Set<string>>(new Set());
  selectedSubjects  = computed(() => this._selectedSubjects());

  // Signal dédié pour que computed() soit réactif au changement de système éducatif
  _eduSystem = signal('');
  currentLevels = computed(() => EDU_LEVELS[this._eduSystem()] ?? []);

  onEduSystemChange(val: string) {
    this._eduSystem.set(val);
    this.form.level = '';
  }

  allSubjects = ALL_SUBJECTS;
  eduSystems = Object.entries(EDU_SYSTEM_LABELS).map(([value, label]) => ({ value, label }));

  roles = [
    { value: 'student', label: 'Élève', icon: '🎒' },
    { value: 'teacher', label: 'Enseignant', icon: '👨‍🏫' },
    { value: 'parent',  label: 'Parent',     icon: '👨‍👩‍👧' },
  ];

  toggleSubject(s: string) {
    this._selectedSubjects.update(set => {
      const next = new Set(set);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  register() {
    if (!this.form.firstName || !this.form.email || !this.form.password) {
      this.error.set('Veuillez remplir les champs obligatoires.');
      return;
    }
    if (this.form.password.length < 6) {
      this.error.set(this.lang.t().passwordTooShort);
      return;
    }
    if (this.form.role === 'teacher' && this._selectedSubjects().size === 0) {
      this.error.set('Veuillez sélectionner au moins une matière.');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    const payload: Record<string, string> = {
      firstName: this.form.firstName,
      lastName:  this.form.lastName,
      email:     this.form.email,
      phone:     this.form.phone,
      password:  this.form.password,
      role:      this.form.role,
    };
    if (this.form.educationSystem) payload['educationSystem'] = this.form.educationSystem;
    if (this.form.level)           payload['level']           = this.form.level;
    if (this._selectedSubjects().size > 0) {
      payload['subjects'] = Array.from(this._selectedSubjects()).join(',');
    }

    this.api.post<any>('/auth/register', payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.requiresVerification) {
          this.emailSent.set(true);
        } else {
          this.auth.login(res.token, res.user);
          this.toast.success(this.lang.t().accountCreated);
          const role = res.user?.role;
          if (role === 'admin')        this.router.navigate(['/dashboard/admin']);
          else if (role === 'teacher') this.router.navigate(['/dashboard/teacher']);
          else                         this.router.navigate(['/dashboard/student']);
        }
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? this.lang.t().updateError);
        this.loading.set(false);
      }
    });
  }
}
