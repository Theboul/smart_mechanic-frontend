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
        path: 'command-center',
        loadComponent: () => import('./pages/command-center/command-center.page').then(m => m.CommandCenterPage),
      },
      {
        path: 'sla-alerts',
        loadComponent: () => import('./pages/sla-alerts/sla-alerts.page').then(m => m.SlaAlertsPage),
      },
      {
        path: 'workshops',
        loadComponent: () => import('./pages/workshop-management/workshop-management.page').then(m => m.WorkshopManagementPage),
      },
      {
        path: 'history',
        loadComponent: () => import('./pages/global-history/global-history.page').then(m => m.GlobalHistoryPage),
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audit-logs/audit-logs.page').then(m => m.AuditLogsPage),
      }
    ],
  },
];
