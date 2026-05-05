import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  profilePhotoUrl?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

const AUTH_KEY = 'edu_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _state = signal<AuthState>(this.loadFromStorage());

  readonly token   = computed(() => this._state().token);
  readonly user    = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => !!this._state().token);
  readonly role    = computed(() => this._state().user?.role ?? null);

  private loadFromStorage(): AuthState {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { token: null, user: null };
  }

  login(token: string, user: User) {
    const state = { token, user };
    this._state.set(state);
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  }

  logout() {
    this._state.set({ token: null, user: null });
    localStorage.removeItem(AUTH_KEY);
  }

  getToken(): string | null {
    return this._state().token;
  }
}
