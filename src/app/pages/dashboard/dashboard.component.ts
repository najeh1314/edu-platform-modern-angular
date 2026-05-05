import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `<div class="flex items-center justify-center h-screen"><div class="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div></div>`
})
export class DashboardComponent implements OnInit {
  auth   = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    const role = this.auth.role();
    if (role === 'admin')        this.router.navigate(['/dashboard/admin'], { replaceUrl: true });
    else if (role === 'teacher') this.router.navigate(['/dashboard/teacher'], { replaceUrl: true });
    else                         this.router.navigate(['/dashboard/student'], { replaceUrl: true });
  }
}
