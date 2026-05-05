import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, teacherGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/auth/email-verify.component').then(m => m.EmailVerifyComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'dashboard/student',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent)
  },
  {
    path: 'dashboard/teacher',
    canActivate: [authGuard, teacherGuard],
    loadComponent: () => import('./pages/teacher-dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent)
  },
  {
    path: 'dashboard/admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'sessions',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/sessions/sessions.component').then(m => m.SessionsComponent)
  },
  {
    path: 'courses',
    loadComponent: () => import('./pages/courses/courses.component').then(m => m.CoursesComponent)
  },
  {
    path: 'courses/:id',
    loadComponent: () => import('./pages/courses/course-detail.component').then(m => m.CourseDetailComponent)
  },
  {
    path: 'teachers',
    loadComponent: () => import('./pages/teachers/teachers.component').then(m => m.TeachersComponent)
  },
  {
    path: 'teachers/:id',
    loadComponent: () => import('./pages/teachers/teacher-detail.component').then(m => m.TeacherDetailComponent)
  },
  {
    path: 'ai',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/ai/ai.component').then(m => m.AiComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/users.component').then(m => m.AdminUsersComponent)
  },
  {
    path: 'admin/courses',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin-courses.component').then(m => m.AdminCoursesComponent)
  },
  {
    path: 'teacher/my-courses',
    canActivate: [authGuard, teacherGuard],
    loadComponent: () => import('./pages/teacher/my-courses.component').then(m => m.MyCoursesComponent)
  },
  {
    path: 'teacher/availability',
    canActivate: [authGuard, teacherGuard],
    loadComponent: () => import('./pages/teacher/availability.component').then(m => m.AvailabilityComponent)
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent)
  },
  {
    path: 'admin/notifications',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin-notifications.component').then(m => m.AdminNotificationsComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
