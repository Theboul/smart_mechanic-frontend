import { Routes } from '@angular/router';

const loadDashboardLayoutComponent = () =>
  import('@core/layout/dashboard-layout/dashboard-layout.component').then(
    c => c.DashboardLayoutComponent
  );

const loadPlaceholderRoutePageComponent = () =>
  import('@shared/ui/placeholder-route-page/placeholder-route-page.component').then(
    c => c.PlaceholderRoutePageComponent
  );

export const emergenciesRoutes: Routes = [
  {
    path: '',
    loadComponent: loadDashboardLayoutComponent,
    children: [
      {
        path: 'active',
        data: {
          placeholder: {
            title: 'Emergencias Activas',
            description: 'Solicitudes de asistencia en tiempo real',
            icon: '🚨',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'history',
        data: {
          placeholder: {
            title: 'Historial de Emergencias',
            description: 'Registro completo de solicitudes atendidas',
            icon: '📋',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'assignments',
        data: {
          placeholder: {
            title: 'Asignaciones de Emergencias',
            description: 'Gestion de asignaciones de solicitudes a talleres',
            icon: '🔗',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'statuses',
        data: {
          placeholder: {
            title: 'Estados de Emergencias',
            description: 'Configuracion y seguimiento del ciclo de vida',
            icon: '🔄',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
    ],
  },
];

