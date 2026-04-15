import { Routes } from '@angular/router';

const loadDashboardLayoutComponent = () =>
  import('@core/layout/dashboard-layout/dashboard-layout.component').then(
    c => c.DashboardLayoutComponent
  );

const loadPlaceholderRoutePageComponent = () =>
  import('@shared/ui/placeholder-route-page/placeholder-route-page.component').then(
    c => c.PlaceholderRoutePageComponent
  );

export const identityRoutes: Routes = [
  // Ruta de login (sin layout, página pública)
  {
    path: 'auth',
    loadComponent: () =>
      import('./auth/pages/login/login.component').then(c => c.LoginComponent),
  },

  // Dashboard home (con layout protegido)
  {
    path: 'home',
    loadComponent: loadDashboardLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./home/pages/home/home.component').then(c => c.HomeComponent),
      },
    ],
  },

  // Onboarding (con layout protegido)
  {
    path: 'onboarding',
    loadComponent: loadDashboardLayoutComponent,
    children: [
      {
        path: 'companies',
        data: {
          placeholder: {
            title: 'Gestion de Empresas',
            description: 'Alta y administracion de empresas taller',
            icon: '🏢',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'users',
        data: {
          placeholder: {
            title: 'Gestion de Usuarios',
            description: 'Administracion de usuarios y roles',
            icon: '👤',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'verification',
        data: {
          placeholder: {
            title: 'Verificacion de Identidad',
            description: 'Proceso de verificacion de documentos e identidad',
            icon: '✅',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'documentation',
        data: {
          placeholder: {
            title: 'Documentacion del Taller',
            description: 'Centro de carga y gestion de documentos',
            icon: '📄',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
    ],
  },

  // Redirect raíz → login
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
];
