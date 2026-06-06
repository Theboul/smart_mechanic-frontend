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
        path: 'register',
        loadComponent: () => import('./pages/register-workshop/register-workshop').then(m => m.RegisterWorkshop),
      },
      {
        path: 'assignments',
        loadComponent: () => import('./pages/workshop-assignments/workshop-assignments').then(m => m.WorkshopAssignments),
      },
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
        loadComponent: () => import('./pages/manage-team/manage-team.component').then(m => m.ManageTeamComponent),
      },
      {
        path: 'branches',
        loadComponent: () => import('./pages/branch-management/branch-management.component').then(m => m.BranchManagementComponent),
      },
      {
        path: 'my-branch',
        loadComponent: () => import('./pages/my-branch-settings/my-branch-settings.component').then(m => m.MyBranchSettingsComponent),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./pages/calendar/calendar').then(m => m.CalendarPageComponent),
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

