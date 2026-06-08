import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideAngularModule, AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-angular';

import { AuthStore } from '@features/identity/auth/state/auth.store';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { SucursalResponse, TallerResponse } from '@core/models/workshops.model';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SelectComponent,
  SelectOption,
} from '@shared/ui';
import { MonitoringService } from '../../data-access/monitoring.service';
import { SlaAlertsResponse } from '../../models/monitoring.model';

@Component({
  selector: 'app-sla-alerts',
  standalone: true,
  providers: [DecimalPipe],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    SelectComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Alertas SLA"
        subtitle="Seguimiento de retrasos operativos, riesgos de incumplimiento y casos estancados.">
        <div actions class="header-actions">
          <a mat-stroked-button routerLink="/monitoring/command-center" class="secondary-btn">
            Volver al Dashboard
          </a>
          <button mat-stroked-button class="secondary-btn" (click)="alertsQuery.refetch()">
            <lucide-icon [img]="refreshIcon" [size]="16"></lucide-icon>
            Actualizar
          </button>
        </div>
      </app-page-header>

      <div class="filters-container sm-glass-card">
        <div class="filters-grid">
          @if (isSuperAdmin()) {
            <app-select
              class="sm-select"
              [value]="selectedWorkshop()"
              (valueChange)="onWorkshopChange($event)"
              placeholder="Global o taller"
              [options]="workshopOptions()">
            </app-select>
          }

          @if (canFilterBranches()) {
            <app-select
              class="sm-select"
              [value]="selectedBranch()"
              (valueChange)="selectedBranch.set($event)"
              placeholder="Todas las sucursales"
              [options]="branchOptions()">
            </app-select>
          } @else if (isAdminSucursal()) {
            <span class="fixed-context sm-glass-card">Sucursal actual: {{ myBranchName() }}</span>
          }

          <app-select
            class="sm-select"
            [value]="selectedTipoAlerta()"
            (valueChange)="selectedTipoAlerta.set($event)"
            placeholder="Todas las alertas"
            [options]="alertTypeOptions">
          </app-select>

          <app-select
            class="sm-select"
            [value]="selectedSlaStatus()"
            (valueChange)="selectedSlaStatus.set($event)"
            placeholder="Todos los estados SLA"
            [options]="slaStatusOptions">
          </app-select>

          <app-select
            class="sm-select"
            [value]="selectedPrioridad()"
            (valueChange)="selectedPrioridad.set($event)"
            placeholder="Todas las prioridades"
            [options]="priorityOptions">
          </app-select>

          <mat-form-field appearance="outline" class="date-field" subscriptSizing="dynamic">
            <input matInput type="date" [ngModel]="dateFrom()" (ngModelChange)="dateFrom.set($event)" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="date-field" subscriptSizing="dynamic">
            <input matInput type="date" [ngModel]="dateTo()" (ngModelChange)="dateTo.set($event)" />
          </mat-form-field>
        </div>
      </div>

      @if (alertsQuery.isLoading()) {
        <app-loading-state message="Calculando alertas operativas..."></app-loading-state>
      } @else if (alertsQuery.isError()) {
        <div class="error-state sm-glass-card">No se pudieron cargar las alertas SLA.</div>
      } @else if (alertsData(); as response) {
        <div class="mini-stats-grid">
          <div class="stat-box sm-glass-card">
            <div class="icon-wrap red"><lucide-icon [img]="alertIcon" [size]="20"></lucide-icon></div>
            <div class="info"><span class="label">Alertas activas</span><span class="value">{{ response.summary.total_alertas }}</span></div>
          </div>
          <div class="stat-box sm-glass-card">
            <div class="icon-wrap orange"><lucide-icon [img]="shieldIcon" [size]="20"></lucide-icon></div>
            <div class="info"><span class="label">En riesgo</span><span class="value">{{ response.summary.en_riesgo }}</span></div>
          </div>
          <div class="stat-box sm-glass-card">
            <div class="icon-wrap red"><lucide-icon [img]="shieldIcon" [size]="20"></lucide-icon></div>
            <div class="info"><span class="label">Incumplidas</span><span class="value">{{ response.summary.incumplidas }}</span></div>
          </div>
          <div class="stat-box sm-glass-card">
            <div class="icon-wrap emerald"><lucide-icon [img]="shieldIcon" [size]="20"></lucide-icon></div>
            <div class="info"><span class="label">Cumplidas</span><span class="value">{{ response.summary.cumplidas }}</span></div>
          </div>
        </div>

        <mat-card class="table-card sm-glass-card">
          <div class="table-header">
            <lucide-icon [img]="alertIcon" [size]="18"></lucide-icon>
            <span>Alertas detectadas</span>
          </div>

          @if (response.alerts.length === 0) {
            <app-empty-state
              [icon]="alertIcon"
              title="Sin alertas para este filtro"
              message="No hay incidentes en riesgo o incumplidos con los filtros seleccionados.">
            </app-empty-state>
          } @else {
            <div class="alerts-list">
              @for (alert of response.alerts; track alert.id_incidente + alert.tipo_alerta) {
                <div class="alert-row">
                  <div class="alert-main">
                    <div class="alert-head">
                      <strong>{{ alert.tipo_alerta.replaceAll('_', ' ') }}</strong>
                      <span class="sla-chip" [attr.data-status]="alert.sla_status">{{ alert.sla_status }}</span>
                    </div>
                    <p>
                      Incidente #{{ alert.id_incidente.substring(0, 8) }}
                      · {{ alert.taller || 'Sin taller' }}
                      · {{ alert.sucursal || 'Sin sucursal' }}
                    </p>
                    <small>
                      Estado actual: {{ alert.estado_actual }} · Prioridad: {{ alert.prioridad }}
                    </small>
                  </div>
                  <div class="alert-metrics">
                    <span>Actual: {{ formatMinutes(alert.tiempo_actual_min) }}</span>
                    <span>Limite: {{ formatMinutes(alert.limite_sla_min) }}</span>
                    <span>Excedido: {{ formatMinutes(alert.tiempo_excedido_min) }}</span>
                    <a mat-button color="primary" [routerLink]="['/emergencies/details', alert.id_incidente]">
                      Ver incidente
                    </a>
                  </div>
                </div>
              }
            </div>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .secondary-btn, .fixed-context { display: inline-flex; align-items: center; gap: 0.45rem; }
    .filters-container { padding: 1.2rem 1.5rem; margin-bottom: 1.5rem; }
    .filters-grid { display: flex; gap: 0.85rem; flex-wrap: wrap; align-items: center; }
    .sm-select { width: 170px; }
    .date-field { width: 170px; }
    .mini-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-box { padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .icon-wrap { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .icon-wrap.red { background: rgba(231, 76, 60, 0.15); color: #e74c3c; }
    .icon-wrap.orange { background: rgba(243, 156, 18, 0.15); color: #f39c12; }
    .icon-wrap.emerald { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
    .info { display: flex; flex-direction: column; gap: 0.2rem; }
    .label { font-size: 0.72rem; color: var(--sm-color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 1.5rem; font-weight: 800; color: white; }
    .table-card { padding: 1.4rem; border: none; }
    .table-header { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 1rem; color: var(--sm-color-sapphire-400); }
    .alerts-list { display: flex; flex-direction: column; gap: 0.85rem; }
    .alert-row {
      display: flex; justify-content: space-between; gap: 1rem; padding: 1rem;
      border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
    }
    .alert-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.3rem; }
    .alert-main p, .alert-main small { margin: 0; color: var(--sm-color-text-muted); }
    .alert-metrics { display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem; color: var(--sm-color-text-soft); font-size: 0.82rem; }
    .sla-chip {
      padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700;
      background: rgba(var(--sm-rgb-slate-400), 0.12); color: var(--sm-color-text-soft);
    }
    .sla-chip[data-status="INCUMPLIDO"] { background: rgba(231, 76, 60, 0.15); color: #e74c3c; }
    .sla-chip[data-status="EN_RIESGO"] { background: rgba(243, 156, 18, 0.15); color: #f39c12; }
    .sla-chip[data-status="CUMPLIDO"] { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
    .error-state { padding: 2rem; text-align: center; color: #e74c3c; }
    @media (max-width: 1100px) {
      .alert-row { flex-direction: column; }
      .alert-metrics { align-items: flex-start; }
    }
  `],
})
export class SlaAlertsPage {
  private monitoringService = inject(MonitoringService);
  private workshopsService = inject(WorkshopsService);
  private authStore = inject(AuthStore);

  readonly alertIcon = AlertTriangle;
  readonly shieldIcon = ShieldAlert;
  readonly refreshIcon = RefreshCw;

  readonly workshops = signal<TallerResponse[]>([]);
  readonly branches = signal<SucursalResponse[]>([]);
  readonly myBranchName = signal('Sin sucursal asignada');

  readonly selectedWorkshop = signal('');
  readonly selectedBranch = signal('');
  readonly selectedTipoAlerta = signal('');
  readonly selectedSlaStatus = signal('');
  readonly selectedPrioridad = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly isSuperAdmin = computed(
    () => this.authStore.user()?.rol_nombre === 'superadmin',
  );
  readonly isOwner = computed(() => {
    const user = this.authStore.user();
    return user?.rol_nombre === 'admin_taller' && user?.rol_contexto === 'owner';
  });
  readonly isAdminSucursal = computed(() => {
    const user = this.authStore.user();
    return user?.rol_nombre === 'admin_taller' && user?.rol_contexto === 'admin_sucursal';
  });
  readonly canFilterBranches = computed(() => this.isOwner());

  readonly workshopOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Global o taller' },
    ...this.workshops().map(workshop => ({
      value: workshop.id_taller,
      label: workshop.nombre,
    })),
  ]);

  readonly branchOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todas las sucursales' },
    ...this.branches().map(branch => ({
      value: branch.id_sucursal,
      label: branch.nombre,
    })),
  ]);

  readonly alertTypeOptions: SelectOption[] = [
    { value: '', label: 'Todas las alertas' },
    { value: 'RETRASO_ASIGNACION', label: 'Retraso asignacion' },
    { value: 'RETRASO_LLEGADA', label: 'Retraso llegada' },
    { value: 'RETRASO_ATENCION', label: 'Retraso atencion' },
    { value: 'RETRASO_FINALIZACION', label: 'Retraso finalizacion' },
    { value: 'SIN_TECNICO_ASIGNADO', label: 'Sin tecnico asignado' },
    { value: 'INCIDENTE_ESTANCADO', label: 'Incidente estancado' },
    { value: 'CANCELACION_OPERATIVA', label: 'Cancelacion operativa' },
  ];
  readonly slaStatusOptions: SelectOption[] = [
    { value: '', label: 'Todos los estados SLA' },
    { value: 'EN_RIESGO', label: 'En riesgo' },
    { value: 'INCUMPLIDO', label: 'Incumplido' },
    { value: 'CUMPLIDO', label: 'Cumplido' },
    { value: 'SIN_DATOS', label: 'Sin datos' },
  ];
  readonly priorityOptions: SelectOption[] = [
    { value: '', label: 'Todas las prioridades' },
    { value: 'CRITICA', label: 'Critica' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'MEDIA', label: 'Media' },
    { value: 'BAJA', label: 'Baja' },
  ];

  readonly filters = computed(() => ({
    date_from: this.dateFrom() || undefined,
    date_to: this.dateTo() || undefined,
    id_taller: this.isSuperAdmin() ? this.selectedWorkshop() || undefined : undefined,
    id_sucursal: this.canFilterBranches() ? this.selectedBranch() || undefined : undefined,
    prioridad: this.selectedPrioridad() || undefined,
    tipo_alerta: this.selectedTipoAlerta() || undefined,
    sla_status: this.selectedSlaStatus() || undefined,
  }));

  alertsQuery = injectQuery<SlaAlertsResponse>(() => ({
    queryKey: ['sla-alerts', this.filters()],
    queryFn: () => lastValueFrom(this.monitoringService.getSlaAlerts(this.filters())),
  }));

  readonly alertsData = computed(
    () => this.alertsQuery.data() as SlaAlertsResponse | undefined,
  );

  constructor() {
    if (this.isSuperAdmin()) {
      this.workshopsService.getAllWorkshops().subscribe({
        next: workshops => this.workshops.set(workshops ?? []),
      });
    } else if (this.isOwner()) {
      this.workshopsService.getBranches().subscribe({
        next: branches => this.branches.set(branches ?? []),
      });
    } else if (this.isAdminSucursal()) {
      this.workshopsService.getMyBranch().subscribe({
        next: branch => {
          if (branch) this.myBranchName.set(branch.nombre);
        },
      });
    }
  }

  onWorkshopChange(value: string) {
    this.selectedWorkshop.set(value);
    this.selectedBranch.set('');
  }

  formatMinutes(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'Sin datos';
    return `${value.toFixed(1)} min`;
  }
}
