import { Routes } from '@angular/router';

const loadDashboardLayoutComponent = () =>
  import('@core/layout/dashboard-layout/dashboard-layout.component').then(
    c => c.DashboardLayoutComponent
  );

const loadPlaceholderRoutePageComponent = () =>
  import('@shared/ui/placeholder-route-page/placeholder-route-page.component').then(
    c => c.PlaceholderRoutePageComponent
  );

export const workshopsRoutes: Routes = [
  {
    path: '',
    loadComponent: loadDashboardLayoutComponent,
    children: [
      {
        path: 'services',
        data: {
          placeholder: {
            title: 'Servicios del Taller',
            description: 'Catalogo de servicios ofrecidos por talleres',
            icon: '🔧',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'team',
        data: {
          placeholder: {
            title: 'Equipo del Taller',
            description: 'Gestion del personal tecnico del taller',
            icon: '👷',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'calendar',
        data: {
          placeholder: {
            title: 'Calendario del Taller',
            description: 'Citas y agenda de atenciones programadas',
            icon: '📅',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'availability',
        data: {
          placeholder: {
            title: 'Disponibilidad del Taller',
            description: 'Gestion de horarios y capacidad operativa',
            icon: '🕐',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
    ],
  },
];

