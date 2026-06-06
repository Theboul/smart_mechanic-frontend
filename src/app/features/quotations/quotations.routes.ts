import { Routes } from '@angular/router';

const loadDashboardLayoutComponent = () =>
  import('@core/layout/dashboard-layout/dashboard-layout.component').then(
    c => c.DashboardLayoutComponent
  );

export const quotationsRoutes: Routes = [
  {
    path: '',
    loadComponent: loadDashboardLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/quotations-dashboard/quotations-dashboard.page').then(m => m.QuotationsDashboardPage),
      },
      {
        path: 'requests/:requestId',
        loadComponent: () => import('./pages/quotation-request-detail/quotation-request-detail.page').then(m => m.QuotationRequestDetailPage),
      },
    ],
  },
];
