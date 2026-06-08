import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  LucideAngularModule,
  Building2,
  Clock3,
  Filter,
  RefreshCw,
  ShieldCheck,
} from 'lucide-angular';

import { AuthStore } from '@features/identity/auth/state/auth.store';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { SucursalResponse, TallerResponse } from '@core/models/workshops.model';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SearchInputComponent,
  SelectComponent,
  SelectOption,
} from '@shared/ui';
import { MonitoringService } from '../../data-access/monitoring.service';
import { AuditLog, AuditLogFilters, AuditLogPage } from '../../models/monitoring.model';

const ACTION_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todas las acciones' },
  { value: 'login', label: 'Login' },
  { value: 'POST', label: 'Creacion' },
  { value: 'PATCH', label: 'Actualizacion' },
  { value: 'PUT', label: 'Edicion' },
  { value: 'DELETE', label: 'Eliminacion' },
  { value: 'workshops', label: 'Talleres' },
  { value: 'users', label: 'Usuarios' },
  { value: 'emergencies', label: 'Emergencias' },
  { value: 'quotations', label: 'Cotizaciones' },
  { value: 'scheduling', label: 'Citas' },
];

const ACTION_LABELS: Record<string, { label: string; tone: string }> = {
  login: { label: 'Login', tone: 'green' },
  POST: { label: 'Creacion', tone: 'blue' },
  PUT: { label: 'Edicion', tone: 'orange' },
  PATCH: { label: 'Actualizacion', tone: 'orange' },
  DELETE: { label: 'Eliminacion', tone: 'red' },
};

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatPaginatorModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    SearchInputComponent,
    SelectComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Bitacora de Auditoria"
        subtitle="Registro historico de acciones criticas, eventos de seguridad y cambios operativos del sistema."
        [icon]="shieldIcon">
        <div actions class="header-actions">
          @if (logsQuery.isFetching() && logsQuery.data()) {
            <span class="sync-indicator">
              <span class="sync-dot"></span>
              Actualizando
            </span>
          }
          <span class="scope-badge sm-glass-card">{{ scopeLabel() }}</span>
          <button mat-stroked-button class="secondary-btn" (click)="logsQuery.refetch()">
            <lucide-icon [img]="refreshIcon" [size]="16"></lucide-icon>
            Actualizar
          </button>
          <button mat-button class="clear-btn" (click)="clearFilters()">
            Limpiar filtros
          </button>
        </div>
      </app-page-header>

      <div class="filters-container sm-glass-card">
        <div class="filter-title">
          <lucide-icon [img]="filterIcon" [size]="16"></lucide-icon>
          <span>Filtros</span>
        </div>

        <app-search-input
          class="search-field"
          [value]="filterUsuario()"
          (valueChange)="onUserSearchChange($event)"
          placeholder="Buscar usuario">
        </app-search-input>

        <app-select
          class="sm-select"
          [value]="filterAccion()"
          (valueChange)="onActionChange($event)"
          placeholder="Todas las acciones"
          [options]="actionOptions">
        </app-select>

        @if (isSuperAdmin()) {
          <app-select
            class="sm-select"
            [value]="filterWorkshop()"
            (valueChange)="onWorkshopChange($event)"
            placeholder="Todos los talleres"
            [options]="workshopOptions()">
          </app-select>

          @if (filterWorkshop()) {
            <app-select
              class="sm-select"
              [value]="filterBranch()"
              (valueChange)="onBranchChange($event)"
              placeholder="Todas las sucursales"
              [options]="branchOptions()">
            </app-select>
          }
        }

        @if (isOwner()) {
            <app-select
              class="sm-select"
              [value]="filterBranch()"
              (valueChange)="onBranchChange($event)"
              placeholder="Todas las sucursales"
              [options]="branchOptions()">
            </app-select>
        } @else if (isAdminSucursal()) {
          <span class="fixed-context sm-glass-card">Sucursal actual: {{ myBranchName() }}</span>
        }

        <div class="date-filter-group">
          <span class="date-label">Desde</span>
            <mat-form-field appearance="outline" class="sm-capsule-field date-field" subscriptSizing="dynamic">
              <input matInput type="date" [ngModel]="filterFechaInicio()" (ngModelChange)="onDateFromChange($event)" />
            </mat-form-field>
          </div>

        <div class="date-filter-group">
          <span class="date-label">Hasta</span>
            <mat-form-field appearance="outline" class="sm-capsule-field date-field" subscriptSizing="dynamic">
              <input matInput type="date" [ngModel]="filterFechaFin()" (ngModelChange)="onDateToChange($event)" />
            </mat-form-field>
          </div>
      </div>

      @if (logsQuery.isLoading()) {
        <app-loading-state message="Consultando bitacora de auditoria..."></app-loading-state>
      } @else if (logsQuery.isError()) {
        <div class="error-state sm-glass-card">
          <h3>No fue posible cargar la bitacora de auditoria.</h3>
          <button mat-stroked-button class="secondary-btn" (click)="logsQuery.refetch()">
            <lucide-icon [img]="refreshIcon" [size]="16"></lucide-icon>
            Reintentar
          </button>
        </div>
      } @else if (logsPage(); as pageData) {
        @if (pageData.items.length === 0) {
          <div class="empty-wrapper sm-glass-card">
            <app-empty-state
              [icon]="shieldIcon"
              title="No hay eventos de auditoria para los filtros seleccionados."
              message="Ajusta la busqueda o las fechas para consultar otra ventana de actividad.">
            </app-empty-state>
          </div>
        } @else {
          <mat-card class="table-card sm-glass-card">
            <div class="table-header">
              <div class="title-with-icon">
                <lucide-icon [img]="shieldIcon" [size]="18"></lucide-icon>
                <h3>Eventos de Auditoria</h3>
              </div>
              <span class="count-badge">{{ pageData.total }} registros</span>
            </div>

            <table mat-table [dataSource]="pageData.items" class="audit-table">
              <ng-container matColumnDef="fecha">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let log">
                  <div class="date-cell">
                    <lucide-icon [img]="clockIcon" [size]="13"></lucide-icon>
                    <span>{{ log.fecha_hora | date:'dd/MM/yyyy HH:mm:ss' : '-0400' }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="usuario">
                <th mat-header-cell *matHeaderCellDef>Usuario</th>
                <td mat-cell *matCellDef="let log">
                  <div class="user-cell">
                    <div class="avatar">{{ getUserInitial(log) }}</div>
                    <div class="user-meta">
                      <strong>{{ log.nombre_usuario || 'No disponible' }}</strong>
                      <span>{{ log.rol_usuario || 'Sin rol' }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="accion">
                <th mat-header-cell *matHeaderCellDef>Accion</th>
                <td mat-cell *matCellDef="let log">
                  <span class="action-badge" [class]="'badge-' + getActionBadge(log).tone">
                    {{ getActionBadge(log).label }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="entidad">
                <th mat-header-cell *matHeaderCellDef>Entidad</th>
                <td mat-cell *matCellDef="let log">
                  <div class="entity-cell">
                    <lucide-icon [img]="buildingIcon" [size]="13"></lucide-icon>
                    <span>{{ log.tipo_entidad || inferEntity(log.accion) }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="alcance">
                <th mat-header-cell *matHeaderCellDef>Alcance</th>
                <td mat-cell *matCellDef="let log">
                  <div class="scope-cell">
                    <strong>{{ log.taller_nombre || 'No disponible' }}</strong>
                    <span>{{ log.sucursal_nombre || 'Sin sucursal' }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="detalle">
                <th mat-header-cell *matHeaderCellDef>Detalle</th>
                <td mat-cell *matCellDef="let log">
                  <div class="detail-cell">
                    <p>{{ log.descripcion || 'No disponible' }}</p>
                    <small>IP: {{ log.ip || 'No disponible' }}</small>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
            </table>

            <mat-paginator
              [length]="pageData.total"
              [pageIndex]="pageIndex()"
              [pageSize]="pageSize()"
              [pageSizeOptions]="[10, 20, 50]"
              (page)="onPageChange($event)"
              aria-label="Paginacion de bitacora">
            </mat-paginator>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .sync-indicator {
      display: inline-flex; align-items: center; gap: 0.45rem; color: var(--sm-color-sapphire-400);
      font-size: 0.78rem; font-weight: 700;
    }
    .sync-dot {
      width: 0.5rem; height: 0.5rem; border-radius: 999px; background: var(--sm-color-sapphire-400);
      box-shadow: 0 0 0 0 rgba(var(--sm-rgb-sapphire-400), 0.45); animation: pulse 1.6s infinite;
    }
    .scope-badge, .fixed-context {
      padding: 0.45rem 0.8rem; border-radius: 999px; color: var(--sm-color-sapphire-400);
      font-size: 0.78rem; font-weight: 700;
    }
    .secondary-btn { display: inline-flex; align-items: center; gap: 0.45rem; }
    .clear-btn { color: var(--sm-color-text-muted); font-weight: 700; }
    .filters-container {
      display: flex; gap: 0.85rem; flex-wrap: wrap; align-items: center;
      padding: 1.2rem 1.5rem; margin-bottom: 1.5rem;
    }
    .filter-title {
      display: inline-flex; align-items: center; gap: 0.45rem; color: var(--sm-color-sapphire-400);
      font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
    }
    .search-field { width: min(240px, 100%); }
    .sm-select { width: 170px; }
    .date-filter-group { display: flex; align-items: center; gap: 0.55rem; }
    .date-label {
      font-size: 0.72rem; color: var(--sm-color-text-muted); font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .date-field { width: 160px; }
    .error-state {
      padding: 2rem; text-align: center; color: #e74c3c; display: flex; flex-direction: column;
      gap: 0.85rem; align-items: center;
    }
    .error-state h3 { margin: 0; }
    .empty-wrapper { padding: 1rem; }
    .table-card { padding: 0; border: none; overflow: hidden; }
    .table-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 1.2rem 1.4rem; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .title-with-icon { display: flex; align-items: center; gap: 0.7rem; color: var(--sm-color-sapphire-400); }
    .title-with-icon h3 { margin: 0; color: white; font-size: 1rem; }
    .count-badge {
      background: rgba(var(--sm-rgb-sapphire-400), 0.15); color: var(--sm-color-sapphire-300);
      padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700;
    }
    .audit-table {
      width: 100%; background: transparent;
    }
    .audit-table th {
      color: var(--sm-color-text-muted); font-size: 0.7rem; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .audit-table td {
      padding: 0.9rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: top;
    }
    .table-row:hover td { background: rgba(var(--sm-rgb-sapphire-500), 0.05); }
    .date-cell, .entity-cell {
      display: inline-flex; align-items: center; gap: 0.5rem; color: var(--sm-color-text-soft);
      font-size: 0.82rem;
    }
    .user-cell { display: flex; align-items: center; gap: 0.7rem; }
    .avatar {
      width: 30px; height: 30px; border-radius: 999px; display: flex; align-items: center; justify-content: center;
      background: rgba(var(--sm-rgb-sapphire-400), 0.15); color: var(--sm-color-sapphire-300); font-weight: 800;
      flex-shrink: 0;
    }
    .user-meta { display: flex; flex-direction: column; gap: 0.18rem; }
    .user-meta strong { color: white; font-size: 0.86rem; }
    .user-meta span { color: var(--sm-color-text-muted); font-size: 0.78rem; }
    .action-badge {
      display: inline-flex; padding: 0.22rem 0.65rem; border-radius: 999px; font-size: 0.72rem;
      font-weight: 700; letter-spacing: 0.03em;
    }
    .badge-green { background: rgba(46, 204, 113, 0.14); color: #2ecc71; }
    .badge-blue { background: rgba(52, 152, 219, 0.14); color: #3498db; }
    .badge-orange { background: rgba(243, 156, 18, 0.14); color: #f39c12; }
    .badge-red { background: rgba(231, 76, 60, 0.14); color: #e74c3c; }
    .badge-gray { background: rgba(148, 163, 184, 0.14); color: #cbd5e1; }
    .scope-cell { display: flex; flex-direction: column; gap: 0.22rem; }
    .scope-cell strong { color: white; font-size: 0.84rem; }
    .scope-cell span { color: var(--sm-color-text-muted); font-size: 0.78rem; }
    .detail-cell { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-cell p, .detail-cell small { margin: 0; }
    .detail-cell p { color: var(--sm-color-text-soft); font-size: 0.82rem; }
    .detail-cell small { color: var(--sm-color-text-muted); font-size: 0.76rem; }
    @media (max-width: 1100px) {
      .audit-table { display: block; overflow-x: auto; }
    }
    @media (max-width: 900px) {
      .date-filter-group { width: 100%; justify-content: space-between; }
      .date-field { width: min(220px, 100%); }
      .search-field, .sm-select { width: 100%; }
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(var(--sm-rgb-sapphire-400), 0.45); }
      70% { box-shadow: 0 0 0 10px rgba(var(--sm-rgb-sapphire-400), 0); }
      100% { box-shadow: 0 0 0 0 rgba(var(--sm-rgb-sapphire-400), 0); }
    }
  `],
})
export class AuditLogsPage {
  private monitoringService = inject(MonitoringService);
  private workshopsService = inject(WorkshopsService);
  private authStore = inject(AuthStore);
  private readonly systemAdminRoles = new Set(['superadmin', 'admin_sistema', 'root']);

  readonly shieldIcon = ShieldCheck;
  readonly buildingIcon = Building2;
  readonly clockIcon = Clock3;
  readonly filterIcon = Filter;
  readonly refreshIcon = RefreshCw;

  readonly displayedColumns = ['fecha', 'usuario', 'accion', 'entidad', 'alcance', 'detalle'];
  readonly actionOptions = ACTION_OPTIONS;

  readonly workshops = signal<TallerResponse[]>([]);
  readonly branches = signal<SucursalResponse[]>([]);
  readonly myBranchName = signal('Sin sucursal asignada');

  readonly filterUsuario = signal('');
  readonly filterAccion = signal('');
  readonly filterFechaInicio = signal('');
  readonly filterFechaFin = signal('');
  readonly filterWorkshop = signal('');
  readonly filterBranch = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);

  readonly isSuperAdmin = computed(() => {
    const role = this.authStore.user()?.rol_nombre?.toLowerCase().trim() ?? '';
    return this.systemAdminRoles.has(role);
  });
  readonly isOwner = computed(() => {
    const user = this.authStore.user();
    return user?.rol_nombre === 'admin_taller' && user?.rol_contexto === 'owner';
  });
  readonly isAdminSucursal = computed(() => {
    const user = this.authStore.user();
    return user?.rol_nombre === 'admin_taller' && user?.rol_contexto === 'admin_sucursal';
  });

  readonly workshopOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todos los talleres' },
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

  readonly filters = computed<AuditLogFilters>(() => ({
    usuario_nombre: this.filterUsuario() || undefined,
    accion: this.filterAccion() || undefined,
    fecha_inicio: this.filterFechaInicio() || undefined,
    fecha_fin: this.filterFechaFin() || undefined,
    id_taller: this.isSuperAdmin() ? this.filterWorkshop() || undefined : undefined,
    id_sucursal: (this.isOwner() || this.isSuperAdmin()) ? this.filterBranch() || undefined : undefined,
    page: this.pageIndex() + 1,
    page_size: this.pageSize(),
  }));

  readonly filtersKey = computed(() => JSON.stringify(this.filters()));
  readonly filterStateKey = computed(() => JSON.stringify({
    usuario_nombre: this.filterUsuario(),
    accion: this.filterAccion(),
    fecha_inicio: this.filterFechaInicio(),
    fecha_fin: this.filterFechaFin(),
    id_taller: this.filterWorkshop(),
    id_sucursal: this.filterBranch(),
  }));

  logsQuery = injectQuery<AuditLogPage>(() => ({
    queryKey: ['audit-logs', this.filtersKey()],
    queryFn: () => lastValueFrom(this.monitoringService.getAuditLogs(this.filters())),
  }));

  readonly logsPage = computed(() => this.logsQuery.data());

  readonly scopeLabel = computed(() => {
    if (this.isSuperAdmin()) {
      return this.filterWorkshop() ? 'Vista filtrada por taller' : 'Vista global';
    }
    if (this.isOwner()) {
      return this.filterBranch() ? 'Owner - sucursal filtrada' : 'Owner - taller completo';
    }
    return `Sucursal fija - ${this.myBranchName()}`;
  });

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
          if (branch) {
            this.myBranchName.set(branch.nombre);
          }
        },
      });
    }

    effect(() => {
      this.filterStateKey();
      this.pageIndex.set(0);
    });
  }

  onWorkshopChange(value: string) {
    this.filterWorkshop.set(value);
    this.filterBranch.set('');
    this.pageIndex.set(0);
    if (!value) {
      this.branches.set([]);
      return;
    }
    this.workshopsService.getBranchesByWorkshop(value).subscribe({
      next: branches => this.branches.set(branches ?? []),
    });
  }

  onBranchChange(value: string) {
    this.filterBranch.set(value);
  }

  onUserSearchChange(value: string) {
    this.filterUsuario.set(value);
  }

  onActionChange(value: string) {
    this.filterAccion.set(value);
  }

  onDateFromChange(value: string) {
    this.filterFechaInicio.set(value);
  }

  onDateToChange(value: string) {
    this.filterFechaFin.set(value);
  }

  clearFilters() {
    this.filterUsuario.set('');
    this.filterAccion.set('');
    this.filterFechaInicio.set('');
    this.filterFechaFin.set('');
    this.filterWorkshop.set('');
    this.filterBranch.set('');
    this.pageIndex.set(0);
    this.pageSize.set(20);
    if (this.isSuperAdmin()) {
      this.branches.set([]);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  getUserInitial(log: AuditLog): string {
    return (log.nombre_usuario || 'S').charAt(0).toUpperCase();
  }

  getActionBadge(log: AuditLog): { label: string; tone: string } {
    const normalized = log.accion.toUpperCase();
    const match = Object.entries(ACTION_LABELS).find(([key]) => normalized.includes(key.toUpperCase()));
    if (match) return match[1];
    return { label: this.inferEntity(log.accion), tone: 'gray' };
  }

  inferEntity(action: string): string {
    const normalized = action.toLowerCase();
    if (normalized.includes('emerg')) return 'Emergencias';
    if (normalized.includes('workshop')) return 'Talleres';
    if (normalized.includes('user')) return 'Usuarios';
    if (normalized.includes('quotation')) return 'Cotizaciones';
    if (normalized.includes('schedul')) return 'Citas';
    if (normalized.includes('identity')) return 'Identidad';
    return 'Sistema';
  }
}
