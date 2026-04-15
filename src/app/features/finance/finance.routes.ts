import { Routes } from '@angular/router';

const loadDashboardLayoutComponent = () =>
  import('@core/layout/dashboard-layout/dashboard-layout.component').then(
    c => c.DashboardLayoutComponent
  );

const loadPlaceholderRoutePageComponent = () =>
  import('@shared/ui/placeholder-route-page/placeholder-route-page.component').then(
    c => c.PlaceholderRoutePageComponent
  );

export const financeRoutes: Routes = [
  {
    path: '',
    loadComponent: loadDashboardLayoutComponent,
    children: [
      {
        path: 'commissions',
        data: {
          placeholder: {
            title: 'Comisiones (10%)',
            description: 'Seguimiento y gestion de comisiones de la plataforma',
            icon: '💰',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'payments',
        data: {
          placeholder: {
            title: 'Gestion de Pagos',
            description: 'Procesamiento y seguimiento de pagos',
            icon: '💳',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'invoices',
        data: {
          placeholder: {
            title: 'Facturacion',
            description: 'Generacion y gestion de facturas electronicas',
            icon: '🧾',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
      {
        path: 'reports',
        data: {
          placeholder: {
            title: 'Reportes Financieros',
            description: 'Analisis y reportes de desempeno economico',
            icon: '📊',
          },
        },
        loadComponent: loadPlaceholderRoutePageComponent,
      },
    ],
  },
];

