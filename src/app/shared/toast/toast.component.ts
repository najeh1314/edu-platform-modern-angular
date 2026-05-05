import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" role="alert">
          <div class="flex items-center gap-2">
            @if (toast.type === 'success') { <span>✓</span> }
            @if (toast.type === 'error')   { <span>✕</span> }
            @if (toast.type === 'info')    { <span>ℹ</span> }
            <span>{{ toast.message }}</span>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
