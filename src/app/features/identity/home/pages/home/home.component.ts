import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HomeDashboardComponent } from '../../components/home-dashboard/home-dashboard.component';
import { HomeKpi, HomeQuickAction } from '../../models/home-dashboard.model';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { EmergenciesService } from '@features/emergencies/data-access/emergencies.service';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import {
  BadgeCheck,
  Siren,
  Users,
  Wallet,
  Activity,
  Radar,
  ClipboardList,
  Building2,
  BookOpen,
} from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HomeDashboardComponent],
  template: `
    <app-home-dashboard
      [title]="title()"
      [subtitle]="subtitle()"
      [kpis]="kpis()"
      [incidents]="recentIncidents()"
      [isSyncing]="incidentsQuery.isFetching()"
      [quickActions]="quickActions()"
      (quickActionSelected)="onQuickActionSelected($event)"
    ></app-home-dashboard>
  `,
})
export class HomeComponent {
  private authStore          = inject(AuthStore);
  private emergenciesService = inject(EmergenciesService);
  private workshopsService   = inject(WorkshopsService);
  private router             = inject(Router);

  // ── Rol ───────────────────────────────────────────────────────────────────
  userRole     = computed(() => this.authStore.user()?.rol_nombre || 'cliente');
  isSuperAdmin = computed(() => this.userRole() === 'superadmin');

  title = computed(() =>
    this.isSuperAdmin() ? 'Panel de Control Global' : 'Gestión de Taller'
  );

  subtitle = computed(() =>
    this.isSuperAdmin()
      ? 'Monitoreo total de la red de asistencia mecánica en tiempo real.'
      : 'Control operativo y seguimiento de incidentes asignados a tu taller.'
  );

  // ── Datos ─────────────────────────────────────────────────────────────────
  incidentsQuery = injectQuery(() => ({
    queryKey: ['home-recent-incidents', this.userRole()],
    queryFn: () => {
      if (this.isSuperAdmin()) {
        return lastValueFrom(this.emergenciesService.getAllIncidents());
      } else {
        return lastValueFrom(this.workshopsService.getAssignments());
      }
    },
    refetchInterval: 30000,
  }));

  recentIncidents = computed(() => (this.incidentsQuery.data() || []).slice(0, 5));

  kpis = computed<HomeKpi[]>(() => {
    const data      = this.incidentsQuery.data() || [];
    const active    = data.filter(i => ['EN_CAMINO', 'EN_PROGRESO', 'EN_ATENCION', 'FINALIZADO'].includes(i.estado_incidente ?? '')).length;
    const completed = data.filter(i => i.estado_incidente === 'COMPLETADO').length;

    return [
      {
        label:  this.isSuperAdmin() ? 'Emergencias Globales' : 'Mis Emergencias',
        value:  data.length.toString(),
        icon:   Siren,
        detail: 'Total registradas en el sistema',
        trend:  0,
      },
      {
        label:  this.isSuperAdmin() ? 'En Atención Activa' : 'En Progreso',
        value:  active.toString(),
        icon:   Activity,
        detail: 'Servicios actualmente en campo',
        trend:  active > 0 ? 5 : 0,
      },
      {
        label:  'Servicios Finalizados',
        value:  completed.toString(),
        icon:   BadgeCheck,
        detail: 'Historial de éxito',
        trend:  10,
      },
    ];
  });

  // ── Acciones rápidas dinámicas por rol ────────────────────────────────────
  quickActions = computed<HomeQuickAction[]>(() => {
    if (this.isSuperAdmin()) {
      return [
        {
          key:         'monitor',
          label:       'Monitor en Tiempo Real',
          icon:        Radar,
          description: 'Ver emergencias activas en el mapa.',
          route:       '/emergencies/active',
        },
        {
          key:         'workshops',
          label:       'Gestionar Talleres',
          icon:        Building2,
          description: 'Administrar talleres afiliados a la plataforma.',
          route:       '/monitoring/workshops',
        },
        {
          key:         'history',
          label:       'Historial Global',
          icon:        BookOpen,
          description: 'Auditoría completa de todos los servicios.',
          route:       '/monitoring/history',
        },
        {
          key:         'finance',
          label:       'Consolidado Financiero',
          icon:        Wallet,
          description: 'Ver comisiones y liquidaciones del período.',
          route:       '/finance/dashboard',
        },
      ];
    }

    // AdminTaller
    return [
      {
        key:         'view-assignments',
        label:       'Ver Solicitudes',
        icon:        ClipboardList,
        description: 'Ir al tablero Kanban de incidentes.',
        route:       '/workshops/assignments',
      },
      {
        key:         'manage-team',
        label:       'Gestionar Equipo',
        icon:        Users,
        description: 'Administrar técnicos y disponibilidad.',
        route:       '/workshops/team',
      },
      {
        key:         'monitor',
        label:       'Monitor de Incidentes',
        icon:        Radar,
        description: 'Ver emergencias asignadas a tu taller.',
        route:       '/emergencies/active',
      },
      {
        key:         'finance',
        label:       'Mis Finanzas',
        icon:        Wallet,
        description: 'Resumen financiero y comisiones.',
        route:       '/finance/dashboard',
      },
    ];
  });

  // ── Navegación ────────────────────────────────────────────────────────────
  onQuickActionSelected(action: HomeQuickAction): void {
    if (action.route) {
      void this.router.navigate([action.route]);
    }
  }
}
