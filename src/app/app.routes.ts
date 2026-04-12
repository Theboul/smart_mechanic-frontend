import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'identity',
    loadChildren: () => import('./features/identity').then(m => m.identityRoutes)
  },
  {
    path: 'emergencies',
    loadChildren: () => import('./features/emergencies').then(m => m.emergenciesRoutes)
  },
  {
    path: 'monitoring',
    loadChildren: () => import('./features/monitoring').then(m => m.monitoringRoutes)
  },
  {
    path: 'processing',
    loadChildren: () => import('./features/processing').then(m => m.processingRoutes)
  },
  {
    path: 'workshops',
    loadChildren: () => import('./features/workshops').then(m => m.workshopsRoutes)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin').then(m => m.adminRoutes)
  },
  {
    path: 'finance',
    loadChildren: () => import('./features/finance').then(m => m.financeRoutes)
  },
  {
    path: '',
    redirectTo: 'identity',
    pathMatch: 'full'
  }
];
