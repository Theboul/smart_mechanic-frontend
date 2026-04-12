import { Routes } from '@angular/router';

export const identityRoutes: Routes = [
  // Aquí puedes referenciar a login.component directamente, 
  // o hacer lazy load interno a hijos de identidad.
  {
    path: 'auth',
    loadComponent: () => import('./auth/pages/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  }
];
