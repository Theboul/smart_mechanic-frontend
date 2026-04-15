import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HomeDashboardComponent } from '../../components/home-dashboard/home-dashboard.component';
import { HomeAlert, HomeKpi, HomeQuickAction } from '../../models/home-dashboard.model';
import {
  BadgeCheck,
  ChartLine,
  Settings,
  Siren,
  Star,
  Users,
  Wallet,
  Wrench,
} from 'lucide-angular';

@Component({
  selector: 'app-home',
  imports: [HomeDashboardComponent],
  template: `
    <app-home-dashboard
      [title]="title"
      [subtitle]="subtitle"
      [kpis]="kpis"
      [highlights]="highlights"
      [alerts]="alerts"
      [quickActions]="quickActions"
      (quickActionSelected)="onQuickActionSelected($event)"
    ></app-home-dashboard>
  `,
})
export class HomeComponent {
  private router = inject(Router);

  title = 'Centro de Operaciones Smart Mechanic';
  subtitle =
    'Monitoreo en tiempo real de emergencias, talleres y rendimiento financiero de la plataforma.';

  kpis: HomeKpi[] = [
    {
      label: 'Emergencias activas',
      value: '24',
      icon: Siren,
      detail: 'Atendidas en este momento',
      trend: 8,
    },
    {
      label: 'Ingresos del mes',
      value: '$15,234',
      icon: Wallet,
      detail: 'Comision acumulada (10%)',
      trend: 12,
    },
    {
      label: 'Talleres operativos',
      value: '156',
      icon: Wrench,
      detail: 'Con disponibilidad vigente',
      trend: 5,
    },
    {
      label: 'Satisfaccion cliente',
      value: '4.8/5',
      icon: Star,
      detail: 'Promedio de los ultimos 30 dias',
      trend: 2,
    },
    {
      label: 'Solicitudes completadas',
      value: '1,823',
      icon: BadgeCheck,
      detail: 'Servicios cerrados este mes',
      trend: 15,
    },
    {
      label: 'Usuarios activos',
      value: '3,421',
      icon: Users,
      detail: 'Clientes con actividad reciente',
      trend: 10,
    },
  ];

  highlights = [
    'Conexión entre clientes y talleres',
    'Gestión de emergencias en tiempo real',
    'Asignación inteligente de solicitudes',
    'Seguimiento y monitoreo completo',
    'Control centralizado de calidad y SLA',
  ];

  alerts: HomeAlert[] = [
    {
      title: 'Demora de respuesta en zona norte',
      description: '3 casos superaron el umbral de 15 minutos en la ultima hora.',
      level: 'high',
    },
    {
      title: 'Capacidad ajustada en talleres premium',
      description: 'Disponibilidad al 82%, se recomienda redistribuir carga.',
      level: 'medium',
    },
    {
      title: 'Incremento de satisfaccion en onboarding',
      description: 'El flujo de alta de talleres mejoro +9% esta semana.',
      level: 'low',
    },
  ];

  quickActions: HomeQuickAction[] = [
    {
      key: 'create-emergency',
      label: 'Crear Emergencia',
      icon: Siren,
      description: 'Registrar solicitud y priorizar despacho inmediato.',
    },
    {
      key: 'view-reports',
      label: 'Ver Reportes',
      icon: ChartLine,
      description: 'Explorar metricas operativas y financieras.',
    },
    {
      key: 'manage-workshops',
      label: 'Gestionar Talleres',
      icon: Wrench,
      description: 'Revisar capacidad, servicios y calendario de equipos.',
    },
    {
      key: 'open-settings',
      label: 'Configuracion',
      icon: Settings,
      description: 'Ajustar parametros generales e integraciones.',
    },
  ];

  onQuickActionSelected(action: HomeQuickAction): void {
    const routeByAction: Record<HomeQuickAction['key'], string> = {
      'create-emergency': '/emergencies/active',
      'view-reports': '/finance/reports',
      'manage-workshops': '/workshops/services',
      'open-settings': '/admin/settings',
    };

    void this.router.navigate([routeByAction[action.key]]);
  }
}
