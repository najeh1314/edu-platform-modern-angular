import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = signal<boolean>(this.load());
  readonly isDark = this._dark.asReadonly();

  private load(): boolean {
    return localStorage.getItem('edu_theme') === 'dark';
  }

  init() {
    document.documentElement.classList.toggle('dark', this._dark());
  }

  toggle() {
    const next = !this._dark();
    this._dark.set(next);
    localStorage.setItem('edu_theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }
}
