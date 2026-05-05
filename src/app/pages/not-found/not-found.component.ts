import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <p class="text-8xl font-bold text-blue-900 mb-4">404</p>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Page introuvable</h1>
        <p class="text-gray-500 mb-6">La page que vous cherchez n'existe pas.</p>
        <a routerLink="/" class="btn-primary">Retour à l'accueil</a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
