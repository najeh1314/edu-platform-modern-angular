import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast/toast.component';
import { ThemeService } from './core/services/theme.service';
import { LangService } from './core/services/lang.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet />
    <app-toast />
  `
})
export class AppComponent implements OnInit {
  private notif = inject(NotificationService);

  constructor() {
    inject(ThemeService).init();
    inject(LangService).init();
  }

  ngOnInit() {
    this.notif.startPolling();
  }
}
