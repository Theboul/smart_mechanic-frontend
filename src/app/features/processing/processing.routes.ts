import { Routes } from '@angular/router';

const loadDashboardLayoutComponent = () =>
  import('@core/layout/dashboard-layout/dashboard-layout.component').then(
    c => c.DashboardLayoutComponent
  );

const loadPlaceholderRoutePageComponent = () =>
  import('@shared/ui/placeholder-route-page/placeholder-route-page.component').then(
    c => c.PlaceholderRoutePageComponent
  );

export const processingRoutes: Routes = [
  {
    path: '',
    loadComponent: loadDashboardLayoutComponent,
    children: [
      {
        path: 'auto-assignment',
        data: {
          placeholder: {
            title: 'Asignacion Automatica',
            description: 'Motor inteligente de asignacion de emergencias',
            icon: '🤖',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'algorithms',
        data: {
          placeholder: {
            title: 'Algoritmos de Procesamiento',
            description: 'Gestion y configuracion de algoritmos',
            icon: '⚡',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'queue',
        data: {
          placeholder: {
            title: 'Cola de Procesamiento',
            description: 'Gestion de solicitudes pendientes de procesar',
            icon: '📥',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'rules',
        data: {
          placeholder: {
            title: 'Reglas de Negocio',
            description: 'Configuracion de reglas del procesamiento',
            icon: '📏',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
    ],
  },
];

