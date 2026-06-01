import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergenciesService } from '../../data-access/emergencies.service';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { LucideAngularModule, Activity, Map as MapIcon, Shield, Radio, Search, Filter, Layers, Navigation, Siren, CheckCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-angular';
import { PageHeaderComponent, LoadingStateComponent, EmptyStateComponent } from '@shared/ui';
import { PushNotificationService } from '@core/services/push-notification.service';


@Component({
  selector: 'app-global-monitor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        [title]="pageTitle()"
        [subtitle]="pageSubtitle()"
        [icon]="sirenIcon">
        <div class="header-right" actions>
          @if (incidentsQuery.isFetching() && incidentsQuery.data()) {
            <div class="sync-indicator">
              <div class="mini-spinner"></div>
              Sincronizando...
            </div>
          }
          <div class="live-indicator">
            <span class="pulse-dot"></span>
            EN VIVO
          </div>
          <button mat-stroked-button class="refresh-btn" (click)="incidentsQuery.refetch()">
            <lucide-icon [img]="refreshIcon" [size]="15"></lucide-icon>
            Actualizar
          </button>
        </div>
      </app-page-header>

      @if (incidentsQuery.isPending() && !incidentsQuery.data()) {
        <app-loading-state message="Sincronizando monitor central..."></app-loading-state>
      } @else {

        <!-- Stats Bar -->
        <div class="stats-bar">
          <div class="stat-item sm-glass-card">
            <lucide-icon [img]="sirenIcon" [size]="18" class="stat-icon total"></lucide-icon>
            <span class="label">Total</span>
            <span class="value">{{ totalCount() }}</span>
          </div>
          <div class="stat-item sm-glass-card">
            <lucide-icon [img]="clockIcon" [size]="18" class="stat-icon active"></lucide-icon>
            <span class="label">En Atención</span>
            <span class="value active">{{ activeCount() }}</span>
          </div>
          <div class="stat-item sm-glass-card">
            <lucide-icon [img]="alertIcon" [size]="18" class="stat-icon high"></lucide-icon>
            <span class="label">Alta Prioridad</span>
            <span class="value high">{{ highPriorityCount() }}</span>
          </div>
          <div class="stat-item sm-glass-card">
            <lucide-icon [img]="checkIcon" [size]="18" class="stat-icon done"></lucide-icon>
            <span class="label">Completados</span>
            <span class="value done">{{ completedCount() }}</span>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filters-bar sm-glass-card">
          <div class="filter-title">
            <lucide-icon [img]="filterIcon" [size]="14"></lucide-icon>
            <span>Filtros</span>
          </div>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Buscar por ID</mat-label>
            <input matInput [ngModel]="searchId()" (ngModelChange)="searchId.set($event); onFilterChange()" placeholder="ID incidente..." />
            <lucide-icon [img]="searchIcon" [size]="16" matSuffix></lucide-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field filter-sm">
            <mat-label>Estado</mat-label>
            <mat-select [ngModel]="filterEstado()" (ngModelChange)="filterEstado.set($event); onFilterChange()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="PENDIENTE">Pendiente</mat-option>
              <mat-option value="ASIGNADO">Asignado</mat-option>
              <mat-option value="EN_CAMINO">En Camino</mat-option>
              <mat-option value="EN_PROGRESO">En Progreso</mat-option>
              <mat-option value="COMPLETADO">Completado</mat-option>
              <mat-option value="CANCELADO">Cancelado</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field filter-sm">
            <mat-label>Prioridad</mat-label>
            <mat-select [ngModel]="filterPrioridad()" (ngModelChange)="filterPrioridad.set($event); onFilterChange()">
              <mat-option value="">Todas</mat-option>
              <mat-option value="CRITICA">Crítica</mat-option>
              <mat-option value="ALTA">Alta</mat-option>
              <mat-option value="MEDIA">Media</mat-option>
              <mat-option value="BAJA">Baja</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field filter-sm">
            <mat-label>Taller</mat-label>
            <mat-select [ngModel]="filterTaller()" (ngModelChange)="filterTaller.set($event); onFilterChange()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="asignado">Con taller</mat-option>
              <mat-option value="sin_asignar">Sin asignar</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field date-filter">
            <mat-label>Fecha desde</mat-label>
            <input matInput type="date" [ngModel]="filterFechaInicio()" (ngModelChange)="filterFechaInicio.set($event); onFilterChange()" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field date-filter">
            <mat-label>Fecha hasta</mat-label>
            <input matInput type="date" [ngModel]="filterFechaFin()" (ngModelChange)="filterFechaFin.set($event); onFilterChange()" />
          </mat-form-field>

          <button mat-button class="clear-btn" (click)="clearFilters()">Limpiar</button>
        </div>

        <!-- Tabla -->
        <div class="table-container sm-glass-card">
          <div class="table-header">
            <lucide-icon [img]="activityIcon" [size]="16"></lucide-icon>
            <span>Incidentes</span>
            <span class="count-badge">{{ filteredData().length }}</span>
          </div>

          <table mat-table [dataSource]="pagedData()" class="monitor-table">

            <!-- Prioridad -->
            <ng-container matColumnDef="prioridad">
              <th mat-header-cell *matHeaderCellDef>Prioridad</th>
              <td mat-cell *matCellDef="let inc">
                <span class="priority-badge" [attr.data-p]="inc.prioridad_incidente">
                  {{ inc.prioridad_incidente }}
                </span>
              </td>
            </ng-container>

            <!-- ID -->
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let inc">
                <span class="mono-id">#{{ inc.id_incidente.substring(0,8) }}</span>
              </td>
            </ng-container>

            <!-- Fecha -->
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Fecha (BOL)</th>
              <td mat-cell *matCellDef="let inc">
                <span class="date-text">{{ inc.fecha_reporte | date:'dd/MM/yy HH:mm' : '-0400' }}</span>
              </td>
            </ng-container>

            <!-- Resumen IA -->
            <ng-container matColumnDef="resumen">
              <th mat-header-cell *matHeaderCellDef>Resumen IA</th>
              <td mat-cell *matCellDef="let inc">
                <p class="truncate">{{ inc.resumen_ia || 'Analizando...' }}</p>
              </td>
            </ng-container>

            <!-- Taller -->
            <ng-container matColumnDef="taller">
              <th mat-header-cell *matHeaderCellDef>Taller</th>
              <td mat-cell *matCellDef="let inc">
                @if (inc.id_taller) {
                  <span class="assigned-tag">Asignado</span>
                } @else {
                  <span class="pending-tag">Buscando...</span>
                }
              </td>
            </ng-container>

            <!-- Estado -->
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let inc">
                <span class="status-badge" [attr.data-s]="inc.estado_incidente">
                  {{ inc.estado_incidente?.replace('_', ' ') }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if (filteredData().length === 0 && !incidentsQuery.isLoading()) {
            <app-empty-state 
              [icon]="sirenIcon" 
              title="Sin incidentes" 
              message="No hay incidentes que coincidan con los filtros aplicados.">
            </app-empty-state>
          }

          <!-- Paginación dinámica -->
          <mat-paginator
            [length]="filteredData().length"
            [pageSize]="pageSize()"
            [pageIndex]="pageIndex()"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            aria-label="Páginas del monitor">
          </mat-paginator>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; min-height: 100vh; display: flex; flex-direction: column; gap: 1.5rem; animation: fadeIn 0.4s ease-out; }

    .header-right { display: flex; align-items: center; gap: 1rem; }

    .sync-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--sm-color-sapphire-400); font-weight: 600; }
    .mini-spinner { width: 12px; height: 12px; border: 2px solid rgba(var(--sm-rgb-sapphire-400),.2); border-top: 2px solid var(--sm-color-sapphire-400); border-radius: 50%; animation: spin .8s linear infinite; }

    .live-indicator { display: flex; align-items: center; gap: 0.5rem; background: rgba(231,76,60,.1); padding: 0.4rem 0.9rem; border-radius: 20px; font-size: 0.72rem; font-weight: 800; color: #e74c3c; letter-spacing: .05em; }
    .pulse-dot { width: 7px; height: 7px; background: #e74c3c; border-radius: 50%; animation: pulse 1.5s infinite; }
    .refresh-btn { display: flex; align-items: center; gap: 0.4rem; border-color: rgba(var(--sm-rgb-sapphire-400),.3); color: var(--sm-color-sapphire-400); }

    /* Stats Bar */
    .stats-bar { display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .stat-item { padding: 1.1rem 1.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; min-width: 160px; flex: 1; border-radius: 12px;
      .label { font-size: 0.7rem; color: var(--sm-color-text-muted); text-transform: uppercase; letter-spacing: .05em; }
      .value { font-size: 1.7rem; font-weight: 800; color: var(--sm-color-sapphire-400);
        &.active { color: #f1c40f; }
        &.high   { color: #e74c3c; }
        &.done   { color: #2ecc71; }
      }
      .stat-icon { &.total { color: var(--sm-color-sapphire-400); } &.active { color: #f1c40f; } &.high { color: #e74c3c; } &.done { color: #2ecc71; } }
    }

    /* Filtros */
    .filters-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; margin-bottom: 1.25rem; }
    .filter-title { display: flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; font-weight: 600; color: var(--sm-color-sapphire-400); text-transform: uppercase; white-space: nowrap; }
    .filter-field { flex: 1; min-width: 180px; max-width: 250px; }
    .filter-sm { max-width: 150px; }
    .date-filter { max-width: 200px; }
    .clear-btn { color: var(--sm-color-sapphire-400); font-size: 0.8rem; font-weight: 600; white-space: nowrap; &:hover { color: var(--sm-color-sapphire-300); } }

    /* Tabla */
    .table-container { border-radius: 12px; overflow: auto; background: var(--sm-color-gunmetal-900); border: 1px solid rgba(255,255,255,0.05); }
    .table-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--sm-color-sapphire-400); font-size: 0.82rem; font-weight: 600;
      .count-badge { margin-left: auto; background: rgba(var(--sm-rgb-sapphire-400),.15); color: var(--sm-color-sapphire-300); padding: .15rem .6rem; border-radius: 20px; font-size: .72rem; }
    }
    .monitor-table { width: 100%; background: transparent;
      th { color: var(--sm-color-text-muted); font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; padding: .75rem 1rem; border-bottom: 1px solid rgba(255,255,255,.05); }
      td { padding: .75rem 1rem; border-bottom: 1px solid rgba(255,255,255,.03); }
    }
    .table-row:hover td { background: rgba(var(--sm-rgb-sapphire-500),.05); }

    .mono-id  { font-family: 'JetBrains Mono', monospace; font-size: .8rem; color: var(--sm-color-sapphire-400); font-weight: 600; }
    .date-text { font-size: .82rem; color: var(--sm-color-text-soft); }
    .truncate { max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; font-size: .82rem; color: var(--sm-color-text-soft); }

    .priority-badge { padding: .2rem .55rem; border-radius: 4px; font-size: .68rem; font-weight: 800; letter-spacing: .03em;
      &[data-p="CRITICA"] { background: rgba(231,76,60,.25);  color: #ef4444; border: 1px solid rgba(231,76,60,.4); }
      &[data-p="ALTA"]  { background: rgba(231,76,60,.15);  color: #e74c3c; }
      &[data-p="MEDIA"] { background: rgba(241,196,15,.15); color: #f1c40f; }
      &[data-p="BAJA"]  { background: rgba(46,204,113,.15); color: #2ecc71; }
    }

    .status-badge { padding: .2rem .55rem; border-radius: 4px; font-size: .68rem; font-weight: 700;
      &[data-s="COMPLETADO"]   { background: rgba(46,204,113,.12);  color: #2ecc71; }
      &[data-s="ASIGNADO"]     { background: rgba(52,152,219,.12);  color: #3498db; }
      &[data-s="EN_CAMINO"]    { background: rgba(230,126,34,.12);  color: #e67e22; }
      &[data-s="EN_PROGRESO"]  { background: rgba(241,196,15,.12);  color: #f1c40f; }
      &[data-s="CANCELADO"]    { background: rgba(231,76,60,.12);   color: #e74c3c; }
      &[data-s="PENDIENTE"]    { background: rgba(var(--sm-rgb-slate-400),.1); color: var(--sm-color-text-muted); }
    }

    .assigned-tag { font-size: .7rem; padding: .15rem .5rem; border-radius: 4px; background: rgba(46,204,113,.1); color: #2ecc71; font-weight: 600; }
    .pending-tag  { font-size: .7rem; padding: .15rem .5rem; border-radius: 4px; background: rgba(var(--sm-rgb-slate-400),.1); color: var(--sm-color-text-muted); font-style: italic; }

    mat-paginator { background: transparent; }

    @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0%  { box-shadow: 0 0 0 0 rgba(231,76,60,.7); } 70% { box-shadow: 0 0 0 10px rgba(231,76,60,0); } 100% { box-shadow: 0 0 0 0 rgba(231,76,60,0); } }
  `]
})
export class GlobalMonitorComponent {
  private emergenciesService = inject(EmergenciesService);
  private authStore          = inject(AuthStore);

  readonly sirenIcon    = Siren;
  readonly activityIcon = Activity;
  readonly clockIcon    = Clock;
  readonly alertIcon    = AlertTriangle;
  readonly checkIcon    = CheckCircle;
  readonly filterIcon   = Filter;
  readonly refreshIcon  = RefreshCw;
  readonly searchIcon   = Search;

  displayedColumns = ['prioridad', 'id', 'fecha', 'resumen', 'taller', 'estado'];

  isSuperAdmin = computed(() => this.authStore.user()?.rol_nombre === 'superadmin');

  pageTitle = computed(() =>
    this.isSuperAdmin()
      ? 'Monitor Global de Emergencias'
      : 'Monitor de Incidentes – Mi Taller'
  );

  pageSubtitle = computed(() =>
    this.isSuperAdmin()
      ? 'Visibilidad total de todos los incidentes activos en la plataforma en tiempo real.'
      : 'Seguimiento de los incidentes asignados a tu taller.'
  );

  // ── Filtros (Signals para reactividad) ───────────────────────────────────
  searchId          = signal('');
  filterEstado      = signal('');
  filterPrioridad   = signal('');
  filterTaller      = signal('');
  filterFechaInicio = signal('');
  filterFechaFin    = signal('');
  pageSize          = signal(10);
  pageIndex         = signal(0);

  private pushService = inject(PushNotificationService);

  // ── Query (Ahora reactivo a Push Notifications) ──────────────────────────
  incidentsQuery = injectQuery(() => ({
    queryKey: ['global-incidents'],
    queryFn:  () => lastValueFrom(this.emergenciesService.getAllIncidents()),
    // Ya no necesitamos refetchInterval porque escuchamos Push
  }));

  constructor() {
    // Escuchamos notificaciones push para refrescar los datos en tiempo real
    this.pushService.message$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.incidentsQuery.refetch();
      });
  }

  // ── Stats calculadas ──────────────────────────────────────────────────────
  allData          = computed(() => (this.incidentsQuery.data()) ?? []);
  totalCount       = computed(() => this.allData().length);
  activeCount      = computed(() => this.allData().filter(i => ['EN_CAMINO','EN_PROGRESO'].includes(i.estado_incidente)).length);
  highPriorityCount = computed(() => this.allData().filter(i => {
    const p = (i.prioridad_incidente || '').trim().toUpperCase();
    return p === 'ALTA' || p === 'CRITICA';
  }).length);
  completedCount   = computed(() => this.allData().filter(i => i.estado_incidente === 'COMPLETADO').length);

  // ── Filtrado reactivo ─────────────────────────────────────────────────────
  filteredData = computed(() => {
    let data = this.allData();

    if (this.searchId()) {
      const q = this.searchId().toLowerCase();
      data = data.filter((i) => i.id_incidente?.toLowerCase().includes(q));
    }
    if (this.filterEstado())    data = data.filter((i) => i.estado_incidente === this.filterEstado());
    if (this.filterPrioridad()) {
      const p = this.filterPrioridad().trim().toUpperCase();
      data = data.filter((i) => (i.prioridad_incidente || '').trim().toUpperCase() === p);
    }
    if (this.filterTaller() === 'asignado')    data = data.filter((i) =>  i.id_taller);
    if (this.filterTaller() === 'sin_asignar') data = data.filter((i) => !i.id_taller);
    if (this.filterFechaInicio()) {
      const desde = new Date(this.filterFechaInicio()).getTime();
      data = data.filter((i) => new Date(i.fecha_reporte || '').getTime() >= desde);
    }
    if (this.filterFechaFin()) {
      const hasta = new Date(this.filterFechaFin() + 'T23:59:59').getTime();
      data = data.filter((i) => new Date(i.fecha_reporte || '').getTime() <= hasta);
    }

    return data;
  });

  // ── Paginación dinámica ───────────────────────────────────────────────────
  pagedData = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredData().slice(start, start + this.pageSize());
  });

  onFilterChange() { this.pageIndex.set(0); }

  onPageChange(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  clearFilters() {
    this.searchId.set('');
    this.filterEstado.set('');
    this.filterPrioridad.set('');
    this.filterTaller.set('');
    this.filterFechaInicio.set('');
    this.filterFechaFin.set('');
    this.pageIndex.set(0);
  }
}
