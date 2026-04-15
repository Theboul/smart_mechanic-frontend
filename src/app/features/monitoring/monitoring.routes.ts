import { Routes } from '@angular/router';

const loadDashboardLayoutComponent = () =>
  import('@core/layout/dashboard-layout/dashboard-layout.component').then(
    c => c.DashboardLayoutComponent
  );

const loadPlaceholderRoutePageComponent = () =>
  import('@shared/ui/placeholder-route-page/placeholder-route-page.component').then(
    c => c.PlaceholderRoutePageComponent
  );

export const monitoringRoutes: Routes = [
  {
    path: '',
    loadComponent: loadDashboardLayoutComponent,
    children: [
      {
        path: 'tracking',
        data: {
          placeholder: {
            title: 'Rastreo y Trazabilidad',
            description: 'Seguimiento en tiempo real de talleres y vehiculos',
            icon: '📍',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'locations',
        data: {
          placeholder: {
            title: 'Gestion de Ubicaciones',
            description: 'Administracion de zonas de cobertura y servicio',
            icon: '🗺️',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'quality',
        data: {
          placeholder: {
            title: 'Control de Calidad',
            description: 'Estandares y metricas de calidad del servicio',
            icon: '🏆',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'customer-experience',
        data: {
          placeholder: {
            title: 'Experiencia del Cliente',
            description: 'Monitoreo de satisfaccion y experiencia final',
            icon: '😊',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
    ],
  },
];

