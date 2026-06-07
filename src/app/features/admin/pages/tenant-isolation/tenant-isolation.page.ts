/**
 * CU33: Página de Gestión de Tenants y Aislamiento de Información
 * Solo accesible para SuperAdmin
 */

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

// AuthStore y servicios
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { GestionTenantsAislamientoService } from '../../services/gestion-tenants-aislamiento.service';

// Modelos
import {
  TallerTenant,
  TallerTenantCreate,
  UsuarioTenant,
  IncidenteTenant,
  BitacoraTenant,
  MetricaOperacionalTenant,
  TenantUserCreate,
} from '../../admin.models';

// Componentes compartidos
import { PageHeaderComponent, LoadingStateComponent, EmptyStateComponent } from '@shared/ui';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Icons
import {
  LucideAngularModule,
  Building2,
  Users,
  Wrench,
  ShieldAlert,
  Search,
  RefreshCw,
  PlusCircle,
  Pencil,
  AlertTriangle,
  XCircle,
} from 'lucide-angular';

@Component({
  selector: 'app-tenant-isolation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTabsModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <!-- Encabezado -->
      <app-page-header
        title="Gestión de Tenants"
        subtitle="SuperAdmin: controla talleres, usuarios, técnicos, incidentes, métricas y bitácora por tenant."
        [icon]="buildingIcon"
      >
        <div actions>
          <button mat-stroked-button class="refresh-btn" (click)="refreshAll()">
            <lucide-icon [img]="refreshIcon" [size]="16"></lucide-icon>
            Actualizar
          </button>
        </div>
      </app-page-header>

      <!-- Control de Acceso -->
      @if (!isSuperAdmin()) {
        <mat-card class="access-denied-card">
          <div class="access-denied-content">
            <lucide-icon [img]="alertIcon" [size]="48" class="alert-icon"></lucide-icon>
            <div>
              <h2>Acceso Denegado</h2>
              <p>Esta sección solo está disponible para <strong>SuperAdministradores</strong>.</p>
              <p>Tu rol actual: <strong>{{ authUser()?.rol_nombre || 'No autenticado' }}</strong></p>
            </div>
          </div>
        </mat-card>
      } @else {
        <!-- Layout de dos columnas: Lista y Detalle -->
        <div class="admin-layout">
          <!-- PANEL IZQUIERDO: Lista de Tenants -->
          <section class="tenants-list-panel">
            <div class="panel-header">
              <div>
                <h3>Lista de Talleres</h3>
                <p class="subtitle">Selecciona un taller para gestionar su información y usuarios.</p>
              </div>
              <button mat-flat-button color="primary" (click)="openTenantForm()">
                <lucide-icon [img]="plusIcon" [size]="16"></lucide-icon>
                Nuevo Taller
              </button>
            </div>

            <!-- Búsqueda y filtros -->
            <div class="search-and-filters">
              <div class="search-box">
                <lucide-icon [img]="searchIcon" [size]="16"></lucide-icon>
                <input
                  type="text"
                  [ngModel]="searchTerm()"
                  (ngModelChange)="onSearchChange($event)"
                  placeholder="Buscar por nombre, NIT o correo..."
                  class="search-input"
                />
              </div>
              <mat-form-field appearance="outline" class="status-filter">
                <mat-label>Estado</mat-label>
                <mat-select [ngModel]="statusFilter()" (ngModelChange)="onStatusFilterChange($event)">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="activo">Activos</mat-option>
                  <mat-option value="inactivo">Inactivos</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Loading, Error, Empty -->
            @if (tenantsQuery.isLoading()) {
              <app-loading-state message="Cargando talleres..."></app-loading-state>
            } @else if (tenantsQuery.isError()) {
              <div class="error-message">
                ❌ Error al cargar los talleres. Verifica tu conexión e intenta nuevamente.
              </div>
            } @else if (filteredTenants().length === 0) {
              <app-empty-state
                [icon]="buildingIcon"
                title="No hay talleres"
                message="No se encontraron talleres con los criterios especificados."
              ></app-empty-state>
            } @else {
              <!-- Tabla de Tenants -->
              <table mat-table [dataSource]="pagedTenants()" class="tenants-table">
                <ng-container matColumnDef="nombre">
                  <th mat-header-cell *matHeaderCellDef>Taller</th>
                  <td mat-cell *matCellDef="let tenant">
                    <div class="tenant-cell">
                      <div class="tenant-name">{{ tenant.nombre }}</div>
                      <div class="tenant-nit">NIT: {{ tenant.nit }}</div>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="contacto">
                  <th mat-header-cell *matHeaderCellDef>Contacto</th>
                  <td mat-cell *matCellDef="let tenant">
                    <div>{{ tenant.email || 'Sin correo' }}</div>
                    <div class="secondary">{{ tenant.telefono || 'Sin teléfono' }}</div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let tenant">
                    <span class="status-badge" [class.active]="tenant.is_active">
                      {{ tenant.is_active ? '✓ ACTIVO' : '✗ INACTIVO' }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let tenant">
                    <button mat-button color="primary" (click)="selectTenant(tenant)" class="action-btn">
                      Ver
                    </button>
                    <button mat-button (click)="editTenant(tenant)" class="action-btn">
                      Editar
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="tenantColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: tenantColumns;" class="table-row"></tr>
              </table>

              <!-- Paginador -->
              <mat-paginator
                [length]="filteredTenants().length"
                [pageSize]="pageSize()"
                [pageIndex]="pageIndex()"
                [pageSizeOptions]="[5, 10, 20]"
                (page)="onPageChange($event)"
              ></mat-paginator>
            }
          </section>

          <!-- PANEL DERECHO: Detalle de Tenant -->
          <section class="tenant-detail-panel">
            @if (!selectedTenant()) {
              <app-empty-state
                [icon]="usersIcon"
                title="Selecciona un Taller"
                message="Elige un taller de la lista para ver sus detalles, usuarios, técnicos, incidentes y bitácora."
              ></app-empty-state>
            } @else {
              <!-- Encabezado del Detalle -->
              <div class="detail-header">
                <div class="tenant-title">
                  <h3>{{ selectedTenant()?.nombre }}</h3>
                  <p class="subtitle">NIT: {{ selectedTenant()?.nit }}</p>
                </div>
                <div class="detail-actions">
                  <button
                    mat-flat-button
                    [color]="selectedTenant()?.is_active ? 'warn' : 'accent'"
                    (click)="toggleStatus()"
                    [disabled]="toggleStatusMutation.isPending()"
                  >
                    <lucide-icon [img]="shieldIcon" [size]="16"></lucide-icon>
                    {{ selectedTenant()?.is_active ? 'Desactivar' : 'Activar' }}
                  </button>
                  <button mat-button (click)="editTenant(selectedTenant())">
                    <lucide-icon [img]="pencilIcon" [size]="16"></lucide-icon>
                    Editar
                  </button>
                </div>
              </div>

              <!-- Información General -->
              <mat-card class="info-card">
                <h4>Información General</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">NIT</span>
                    <span class="value">{{ selectedTenant()?.nit }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Correo</span>
                    <span class="value">{{ selectedTenant()?.email || 'No registrado' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Teléfono</span>
                    <span class="value">{{ selectedTenant()?.telefono || 'No registrado' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Dirección</span>
                    <span class="value">{{ selectedTenant()?.direccion || 'No registrada' }}</span>
                  </div>
                </div>
              </mat-card>

              <!-- Tabs de Contenido -->
              <mat-tab-group [selectedIndex]="selectedTabIndex()" (selectedIndexChange)="selectedTabIndex.set($event)">
                <!-- TAB 1: Usuarios -->
                <mat-tab label="Usuarios">
                  <div class="tab-content">
                    <div class="tab-header">
                      <h4>Usuarios del Taller</h4>
                      <button mat-flat-button color="primary" (click)="openUserForm()" [disabled]="!selectedTenant()">
                        <lucide-icon [img]="plusIcon" [size]="14"></lucide-icon>
                        Nuevo Usuario
                      </button>
                    </div>

                    @if (usersQuery.isLoading()) {
                      <app-loading-state message="Cargando usuarios..."></app-loading-state>
                    } @else if (usersQuery.isError()) {
                      <div class="error-message">Error cargando usuarios.</div>
                    } @else if ((usersQuery.data() || []).length === 0) {
                      <app-empty-state [icon]="usersIcon" title="Sin usuarios" message="No hay usuarios asociados a este taller."></app-empty-state>
                    } @else {
                      <table mat-table [dataSource]="usersQuery.data() || []" class="detail-table">
                        <ng-container matColumnDef="nombre">
                          <th mat-header-cell *matHeaderCellDef>Nombre</th>
                          <td mat-cell *matCellDef="let user">{{ user.nombre }}</td>
                        </ng-container>
                        <ng-container matColumnDef="correo">
                          <th mat-header-cell *matHeaderCellDef>Correo</th>
                          <td mat-cell *matCellDef="let user">{{ user.correo }}</td>
                        </ng-container>
                        <ng-container matColumnDef="rol">
                          <th mat-header-cell *matHeaderCellDef>Rol</th>
                          <td mat-cell *matCellDef="let user">{{ user.rol_nombre }}</td>
                        </ng-container>
                        <ng-container matColumnDef="estado">
                          <th mat-header-cell *matHeaderCellDef>Estado</th>
                          <td mat-cell *matCellDef="let user">
                            <span class="status-badge" [class.active]="user.estado">
                              {{ user.estado ? 'Activo' : 'Inactivo' }}
                            </span>
                          </td>
                        </ng-container>
                        <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: userColumns;"></tr>
                      </table>
                    }
                  </div>
                </mat-tab>

                <!-- TAB 2: Técnicos -->
                <mat-tab label="Técnicos">
                  <div class="tab-content">
                    <div class="tab-header">
                      <h4>Técnicos del Taller</h4>
                      <button mat-flat-button color="primary" (click)="openTechnicianForm()" [disabled]="!selectedTenant()">
                        <lucide-icon [img]="plusIcon" [size]="14"></lucide-icon>
                        Nuevo Técnico
                      </button>
                    </div>

                    @if (techniciansQuery.isLoading()) {
                      <app-loading-state message="Cargando técnicos..."></app-loading-state>
                    } @else if (techniciansQuery.isError()) {
                      <div class="error-message">Error cargando técnicos.</div>
                    } @else if ((techniciansQuery.data() || []).length === 0) {
                      <app-empty-state [icon]="wrenchIcon" title="Sin técnicos" message="No hay técnicos asociados a este taller."></app-empty-state>
                    } @else {
                      <table mat-table [dataSource]="techniciansQuery.data() || []" class="detail-table">
                        <ng-container matColumnDef="nombre">
                          <th mat-header-cell *matHeaderCellDef>Nombre</th>
                          <td mat-cell *matCellDef="let tech">{{ tech.nombre }}</td>
                        </ng-container>
                        <ng-container matColumnDef="correo">
                          <th mat-header-cell *matHeaderCellDef>Correo</th>
                          <td mat-cell *matCellDef="let tech">{{ tech.correo }}</td>
                        </ng-container>
                        <ng-container matColumnDef="telefono">
                          <th mat-header-cell *matHeaderCellDef>Teléfono</th>
                          <td mat-cell *matCellDef="let tech">{{ tech.telefono || 'No registrado' }}</td>
                        </ng-container>
                        <ng-container matColumnDef="estado">
                          <th mat-header-cell *matHeaderCellDef>Estado</th>
                          <td mat-cell *matCellDef="let tech">
                            <span class="status-badge" [class.active]="tech.estado">
                              {{ tech.estado ? 'Activo' : 'Inactivo' }}
                            </span>
                          </td>
                        </ng-container>
                        <tr mat-header-row *matHeaderRowDef="techColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: techColumns;"></tr>
                      </table>
                    }
                  </div>
                </mat-tab>

                <!-- TAB 3: Incidentes -->
                <mat-tab label="Incidentes">
                  <div class="tab-content">
                    <h4>Incidentes Asociados</h4>

                    @if (incidentsQuery.isLoading()) {
                      <app-loading-state message="Cargando incidentes..."></app-loading-state>
                    } @else if (incidentsQuery.isError()) {
                      <div class="error-message">Error cargando incidentes.</div>
                    } @else if ((incidentsQuery.data() || []).length === 0) {
                      <app-empty-state title="Sin incidentes" message="No hay incidentes asociados a este taller."></app-empty-state>
                    } @else {
                      <table mat-table [dataSource]="incidentsQuery.data() || []" class="detail-table">
                        <ng-container matColumnDef="id_incidente">
                          <th mat-header-cell *matHeaderCellDef>ID</th>
                          <td mat-cell *matCellDef="let incident">{{ incident.id_incidente }}</td>
                        </ng-container>
                        <ng-container matColumnDef="estado">
                          <th mat-header-cell *matHeaderCellDef>Estado</th>
                          <td mat-cell *matCellDef="let incident">{{ incident.estado_incidente }}</td>
                        </ng-container>
                        <ng-container matColumnDef="prioridad">
                          <th mat-header-cell *matHeaderCellDef>Prioridad</th>
                          <td mat-cell *matCellDef="let incident">
                            <span class="priority" [class]="'priority-' + (incident.prioridad_incidente || '').toLowerCase()">
                              {{ incident.prioridad_incidente || 'N/A' }}
                            </span>
                          </td>
                        </ng-container>
                        <ng-container matColumnDef="fecha">
                          <th mat-header-cell *matHeaderCellDef>Fecha</th>
                          <td mat-cell *matCellDef="let incident">{{ incident.fecha_reporte || 'N/A' }}</td>
                        </ng-container>
                        <tr mat-header-row *matHeaderRowDef="incidentColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: incidentColumns;"></tr>
                      </table>
                    }
                  </div>
                </mat-tab>

                <!-- TAB 4: Métricas -->
                <mat-tab label="Métricas">
                  <div class="tab-content">
                    <h4>Métricas Operacionales</h4>
                    <div class="metrics-grid">
                      <div class="metric-card">
                        <span class="metric-label">Total Incidentes</span>
                        <span class="metric-value">{{ metrics().totalIncidentes }}</span>
                      </div>
                      <div class="metric-card">
                        <span class="metric-label">Abiertos</span>
                        <span class="metric-value">{{ metrics().incidentesAbiertos }}</span>
                      </div>
                      <div class="metric-card">
                        <span class="metric-label">Completados</span>
                        <span class="metric-value">{{ metrics().incidentesCompletados }}</span>
                      </div>
                      <div class="metric-card">
                        <span class="metric-label">Alta Prioridad</span>
                        <span class="metric-value">{{ metrics().prioridadAlta }}</span>
                      </div>
                      <div class="metric-card">
                        <span class="metric-label">Media Prioridad</span>
                        <span class="metric-value">{{ metrics().prioridadMedia }}</span>
                      </div>
                      <div class="metric-card">
                        <span class="metric-label">Baja Prioridad</span>
                        <span class="metric-value">{{ metrics().prioridadBaja }}</span>
                      </div>
                    </div>
                  </div>
                </mat-tab>

                <!-- TAB 5: Bitácora -->
                <mat-tab label="Bitácora">
                  <div class="tab-content">
                    <h4>Registro de Auditoría</h4>

                    @if (logsQuery.isLoading()) {
                      <app-loading-state message="Cargando bitácora..."></app-loading-state>
                    } @else if (logsQuery.isError()) {
                      <div class="error-message">Error cargando bitácora.</div>
                    } @else if ((logsQuery.data() || []).length === 0) {
                      <app-empty-state title="Sin registros" message="No hay registros de auditoría para este taller."></app-empty-state>
                    } @else {
                      <table mat-table [dataSource]="logsQuery.data() || []" class="detail-table">
                        <ng-container matColumnDef="fecha">
                          <th mat-header-cell *matHeaderCellDef>Fecha</th>
                          <td mat-cell *matCellDef="let log">{{ log.fecha }}</td>
                        </ng-container>
                        <ng-container matColumnDef="accion">
                          <th mat-header-cell *matHeaderCellDef>Acción</th>
                          <td mat-cell *matCellDef="let log">{{ log.evento || log.accion || 'N/A' }}</td>
                        </ng-container>
                        <ng-container matColumnDef="usuario">
                          <th mat-header-cell *matHeaderCellDef>Usuario</th>
                          <td mat-cell *matCellDef="let log">{{ log.usuario || 'N/A' }}</td>
                        </ng-container>
                        <ng-container matColumnDef="detalle">
                          <th mat-header-cell *matHeaderCellDef>Detalle</th>
                          <td mat-cell *matCellDef="let log">{{ log.detalle || log.descripcion || 'No disponible' }}</td>
                        </ng-container>
                        <tr mat-header-row *matHeaderRowDef="logColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: logColumns;"></tr>
                      </table>
                    }
                  </div>
                </mat-tab>
              </mat-tab-group>
            }
          </section>
        </div>

        <!-- MODAL/FORM: Crear/Editar Tenant -->
        @if (showTenantForm()) {
          <div class="form-overlay" (click)="closeTenantForm()">
            <mat-card class="form-card" (click)="$event.stopPropagation()">
              <div class="form-header">
                <h3>{{ isEditingTenant() ? 'Editar Taller' : 'Crear Nuevo Taller' }}</h3>
                <button mat-icon-button (click)="closeTenantForm()">
                  <lucide-icon [img]="xIcon" [size]="20"></lucide-icon>
                </button>
              </div>

              <div class="form-body">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nombre del Taller *</mat-label>
                  <input matInput [(ngModel)]="tenantFormData.nombre" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>NIT *</mat-label>
                  <input matInput [(ngModel)]="tenantFormData.nit" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Correo</mat-label>
                  <input matInput type="email" [(ngModel)]="tenantFormData.email" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Teléfono</mat-label>
                  <input matInput [(ngModel)]="tenantFormData.telefono" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Dirección</mat-label>
                  <input matInput [(ngModel)]="tenantFormData.direccion" />
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button
                  mat-flat-button
                  color="primary"
                  (click)="saveTenant()"
                  [disabled]="tenantSaveMutation.isPending()"
                >
                  {{ tenantSaveMutation.isPending() ? 'Guardando...' : (isEditingTenant() ? 'Actualizar' : 'Crear') }}
                </button>
                <button mat-button (click)="closeTenantForm()">Cancelar</button>
              </div>
            </mat-card>
          </div>
        }

        <!-- MODAL/FORM: Crear Usuario -->
        @if (showUserForm()) {
          <div class="form-overlay" (click)="closeUserForm()">
            <mat-card class="form-card" (click)="$event.stopPropagation()">
              <div class="form-header">
                <h3>Crear Nuevo Usuario</h3>
                <button mat-icon-button (click)="closeUserForm()">
                  <lucide-icon [img]="xIcon" [size]="20"></lucide-icon>
                </button>
              </div>

              <div class="form-body">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nombre *</mat-label>
                  <input matInput [(ngModel)]="userFormData.nombre" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Correo *</mat-label>
                  <input matInput type="email" [(ngModel)]="userFormData.correo" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Teléfono</mat-label>
                  <input matInput [(ngModel)]="userFormData.telefono" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Rol *</mat-label>
                  <mat-select [(ngModel)]="userFormData.rol_nombre">
                    <mat-option value="admin_taller">Administrador Taller</mat-option>
                    <mat-option value="tecnico">Técnico</mat-option>
                    <mat-option value="cliente">Cliente</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-flat-button color="primary" (click)="saveUser()" [disabled]="createUserMutation.isPending()">
                  {{ createUserMutation.isPending() ? 'Creando...' : 'Crear Usuario' }}
                </button>
                <button mat-button (click)="closeUserForm()">Cancelar</button>
              </div>
            </mat-card>
          </div>
        }

        <!-- MODAL/FORM: Crear Técnico -->
        @if (showTechnicianForm()) {
          <div class="form-overlay" (click)="closeTechnicianForm()">
            <mat-card class="form-card" (click)="$event.stopPropagation()">
              <div class="form-header">
                <h3>Crear Nuevo Técnico</h3>
                <button mat-icon-button (click)="closeTechnicianForm()">
                  <lucide-icon [img]="xIcon" [size]="20"></lucide-icon>
                </button>
              </div>

              <div class="form-body">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nombre *</mat-label>
                  <input matInput [(ngModel)]="technicianFormData.nombre" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Correo *</mat-label>
                  <input matInput type="email" [(ngModel)]="technicianFormData.correo" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Teléfono</mat-label>
                  <input matInput [(ngModel)]="technicianFormData.telefono" />
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-flat-button color="primary" (click)="saveTechnician()" [disabled]="createTechMutation.isPending()">
                  {{ createTechMutation.isPending() ? 'Creando...' : 'Crear Técnico' }}
                </button>
                <button mat-button (click)="closeTechnicianForm()">Cancelar</button>
              </div>
            </mat-card>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1600px; margin: 0 auto; }

    .refresh-btn { display: inline-flex; align-items: center; gap: 0.5rem; }

    .access-denied-card {
      padding: 2.5rem;
      text-align: center;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .access-denied-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .alert-icon { color: #ef4444; }

    .admin-layout {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 2rem;
      margin-top: 2rem;
    }

    .tenants-list-panel, .tenant-detail-panel {
      background: rgba(var(--sm-rgb-slate-900), 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.5rem;
    }

    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }

    .panel-header h3 { margin: 0; font-size: 1.1rem; }

    .subtitle { font-size: 0.85rem; color: var(--sm-color-text-muted); margin: 0.5rem 0 0; }

    .search-and-filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; }

    .search-box { position: relative; flex: 1; }

    .search-box lucide-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: white;
      font-size: 0.9rem;
    }

    .status-filter { width: 160px; }

    .error-message { padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; color: #fca5a5; }

    .tenants-table { width: 100%; margin-top: 1rem; }

    .tenants-table th { color: var(--sm-color-text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 600; }

    .tenants-table td { padding: 1rem 0.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }

    .table-row:hover { background: rgba(var(--sm-rgb-sapphire-500), 0.08); }

    .tenant-cell { display: flex; flex-direction: column; gap: 0.25rem; }

    .tenant-name { font-weight: 600; }

    .tenant-nit { font-size: 0.8rem; color: var(--sm-color-text-muted); }

    .secondary { font-size: 0.85rem; color: var(--sm-color-text-muted); }

    .status-badge {
      display: inline-block;
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      color: var(--sm-color-text-soft);
    }

    .status-badge.active { background: rgba(34, 197, 94, 0.2); color: #86efac; }

    .action-btn { min-width: 70px; font-size: 0.8rem; }

    .detail-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem; }

    .tenant-title h3 { margin: 0; font-size: 1.2rem; }

    .detail-actions { display: flex; gap: 0.75rem; }

    .info-card { background: rgba(255, 255, 255, 0.03); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; }

    .info-card h4 { margin: 0 0 1rem 0; font-size: 0.95rem; }

    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }

    .info-item { display: flex; flex-direction: column; gap: 0.25rem; }

    .info-item .label { font-size: 0.75rem; color: var(--sm-color-text-muted); text-transform: uppercase; }

    .info-item .value { font-size: 0.9rem; font-weight: 500; }

    .tab-content { padding: 1.5rem 0; }

    .tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

    .tab-header h4 { margin: 0; font-size: 0.95rem; }

    .detail-table { width: 100%; }

    .detail-table th { color: var(--sm-color-text-muted); font-size: 0.75rem; text-transform: uppercase; padding: 0.5rem; }

    .detail-table td { padding: 0.75rem 0.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }

    .priority { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }

    .priority-alta { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

    .priority-media { background: rgba(250, 204, 21, 0.2); color: #fde047; }

    .priority-baja { background: rgba(34, 197, 94, 0.2); color: #86efac; }

    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }

    .metric-card {
      background: rgba(255, 255, 255, 0.04);
      padding: 1.25rem;
      border-radius: 12px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .metric-label { display: block; font-size: 0.75rem; color: var(--sm-color-text-muted); text-transform: uppercase; margin-bottom: 0.5rem; }

    .metric-value { display: block; font-size: 1.75rem; font-weight: 700; color: var(--sm-color-sapphire-300); }

    .form-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .form-card {
      background: var(--sm-color-gunmetal-850);
      border: 1px solid rgba(255, 255, 255, 0.1);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .form-header h3 { margin: 0; }

    .form-body { padding: 1.5rem; }

    .full-width { width: 100%; margin-bottom: 1rem; }

    .form-actions { display: flex; gap: 1rem; padding: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.08); }

    @media (max-width: 1200px) {
      .admin-layout { grid-template-columns: 1fr; }
      .metrics-grid { grid-template-columns: 1fr; }
      .info-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class TenantIsolationPage {
  private authStore = inject(AuthStore);
  private adminService = inject(GestionTenantsAislamientoService);
  private snackBar = inject(MatSnackBar);
  private queryClient = injectQueryClient();

  // Icons
  readonly buildingIcon = Building2;
  readonly usersIcon = Users;
  readonly wrenchIcon = Wrench;
  readonly shieldIcon = ShieldAlert;
  readonly searchIcon = Search;
  readonly refreshIcon = RefreshCw;
  readonly plusIcon = PlusCircle;
  readonly pencilIcon = Pencil;
  readonly alertIcon = AlertTriangle;
  readonly xIcon = XCircle;

  // Auth
  authUser = computed(() => this.authStore.user());
  isSuperAdmin = computed(() => this.authUser()?.rol_nombre === 'superadmin');

  // Estado de UI
  selectedTenant = signal<TallerTenant | null>(null);
  selectedTabIndex = signal(0);
  showTenantForm = signal(false);
  isEditingTenant = signal(false);
  showUserForm = signal(false);
  showTechnicianForm = signal(false);

  searchTerm = signal('');
  statusFilter = signal('');
  pageIndex = signal(0);
  pageSize = signal(10);

  // Formularios
  tenantFormData: TallerTenantCreate = {
    nombre: '',
    nit: '',
    telefono: '',
    email: '',
    direccion: '',
    latitud: 0,
    longitud: 0,
  };

  userFormData: Partial<TenantUserCreate> = {
    nombre: '',
    correo: '',
    telefono: '',
    rol_nombre: 'cliente',
  };

  technicianFormData: Partial<TenantUserCreate> = {
    nombre: '',
    correo: '',
    telefono: '',
  };

  // Columnas de tablas
  tenantColumns = ['nombre', 'contacto', 'estado', 'acciones'];
  userColumns = ['nombre', 'correo', 'rol', 'estado'];
  techColumns = ['nombre', 'correo', 'telefono', 'estado'];
  incidentColumns = ['id_incidente', 'estado', 'prioridad', 'fecha'];
  logColumns = ['fecha', 'accion', 'usuario', 'detalle'];

  // Queries
  tenantsQuery = injectQuery(() => ({
    queryKey: ['admin-tenants'],
    queryFn: () => lastValueFrom(this.adminService.getTenants()),
  }));

  usersQuery = injectQuery(() => ({
    queryKey: ['tenant-users', this.selectedTenant()?.id_taller],
    queryFn: () => {
      const id = this.selectedTenant()?.id_taller;
      return id ? lastValueFrom(this.adminService.getTenantUsers(id)) : Promise.resolve([] as UsuarioTenant[]);
    },
    enabled: computed(() => !!this.selectedTenant()?.id_taller),
  }));

  techniciansQuery = injectQuery<UsuarioTenant[], Error, UsuarioTenant[]>(() => ({
    queryKey: ['tenant-technicians', this.selectedTenant()?.id_taller],
    queryFn: () => {
      const id = this.selectedTenant()?.id_taller;
      return id ? lastValueFrom(this.adminService.getTenantTechnicians(id)) : Promise.resolve([]);
    },
    enabled: computed(() => !!this.selectedTenant()?.id_taller),
  }));

  incidentsQuery = injectQuery(() => ({
    queryKey: ['tenant-incidents', this.selectedTenant()?.id_taller],
    queryFn: () => {
      const id = this.selectedTenant()?.id_taller;
      return id ? lastValueFrom(this.adminService.getTenantIncidents(id)) : Promise.resolve([] as IncidenteTenant[]);
    },
    enabled: computed(() => !!this.selectedTenant()?.id_taller),
  }));

  logsQuery = injectQuery(() => ({
    queryKey: ['tenant-logs', this.selectedTenant()?.id_taller],
    queryFn: () => {
      const id = this.selectedTenant()?.id_taller;
      return id ? lastValueFrom(this.adminService.getTenantLogs(id)) : Promise.resolve([] as BitacoraTenant[]);
    },
    enabled: computed(() => !!this.selectedTenant()?.id_taller),
  }));

  // Mutations
  tenantSaveMutation = injectMutation(() => ({
    mutationFn: (data: { id?: string; payload: TallerTenantCreate }) =>
      data.id
        ? lastValueFrom(this.adminService.updateTenant(data.id, data.payload))
        : lastValueFrom(this.adminService.createTenant(data.payload)),
    onSuccess: (result) => {
      this.snackBar.open(
        `✅ Taller "${result.nombre}" ${this.isEditingTenant() ? 'actualizado' : 'creado'} exitosamente.`,
        'Cerrar',
        { duration: 3000 }
      );
      this.closeTenantForm();
      this.tenantsQuery.refetch();
    },
    onError: () => {
      this.snackBar.open('❌ Error al guardar el taller.', 'Cerrar', { duration: 4000 });
    },
  }));

  toggleStatusMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.adminService.toggleTenantStatus(id)),
    onSuccess: (result) => {
      this.snackBar.open(
        `✅ Taller ${result.is_active ? 'activado' : 'desactivado'} exitosamente.`,
        'Cerrar',
        { duration: 3000 }
      );
      this.selectedTenant.set(result);
      this.tenantsQuery.refetch();
    },
    onError: () => {
      this.snackBar.open('❌ Error al cambiar el estado del taller.', 'Cerrar', { duration: 4000 });
    },
  }));

  createUserMutation = injectMutation(() => ({
    mutationFn: (payload: TenantUserCreate) => lastValueFrom(this.adminService.createTenantUser(payload)),
    onSuccess: () => {
      this.snackBar.open('✅ Usuario creado exitosamente.', 'Cerrar', { duration: 3000 });
      this.closeUserForm();
      this.usersQuery.refetch();
    },
    onError: () => {
      this.snackBar.open('❌ Error al crear el usuario.', 'Cerrar', { duration: 4000 });
    },
  }));

  createTechMutation = injectMutation(() => ({
    mutationFn: (payload: TenantUserCreate) => lastValueFrom(this.adminService.createTenantUser(payload)),
    onSuccess: () => {
      this.snackBar.open('✅ Técnico creado exitosamente.', 'Cerrar', { duration: 3000 });
      this.closeTechnicianForm();
      this.techniciansQuery.refetch();
    },
    onError: () => {
      this.snackBar.open('❌ Error al crear el técnico.', 'Cerrar', { duration: 4000 });
    },
  }));

  // Computed
  filteredTenants = computed(() => {
    const all = this.tenantsQuery.data() || [];
    const search = this.searchTerm().toLowerCase();
    let result = all;

    if (search) {
      result = result.filter(
        t =>
          t.nombre.toLowerCase().includes(search) ||
          t.nit.toLowerCase().includes(search) ||
          (t.email || '').toLowerCase().includes(search)
      );
    }

    if (this.statusFilter() === 'activo') {
      result = result.filter(t => t.is_active);
    } else if (this.statusFilter() === 'inactivo') {
      result = result.filter(t => !t.is_active);
    }

    return result;
  });

  pagedTenants = computed(() => {
    const data = this.filteredTenants();
    const start = this.pageIndex() * this.pageSize();
    return data.slice(start, start + this.pageSize());
  });

  metrics = computed<MetricaOperacionalTenant>(() => {
    if (!this.incidentsQuery.data()) {
      return {
        totalIncidentes: 0,
        incidentesAbiertos: 0,
        incidentesCompletados: 0,
        prioridadAlta: 0,
        prioridadMedia: 0,
        prioridadBaja: 0,
      };
    }
    return this.adminService.calculateTenantMetrics(this.incidentsQuery.data() || []);
  });

  // Métodos
  refreshAll() {
    this.tenantsQuery.refetch();
    this.usersQuery.refetch();
    this.techniciansQuery.refetch();
    this.incidentsQuery.refetch();
    this.logsQuery.refetch();
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    this.pageIndex.set(0);
  }

  onStatusFilterChange(value: string) {
    this.statusFilter.set(value);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  selectTenant(tenant: TallerTenant) {
    this.selectedTenant.set(tenant);
    this.selectedTabIndex.set(0);
    this.queryClient.invalidateQueries({ queryKey: ['tenant-users', tenant.id_taller] });
    this.queryClient.invalidateQueries({ queryKey: ['tenant-technicians', tenant.id_taller] });
    this.queryClient.invalidateQueries({ queryKey: ['tenant-incidents', tenant.id_taller] });
    this.queryClient.invalidateQueries({ queryKey: ['tenant-logs', tenant.id_taller] });
  }

  openTenantForm() {
    this.isEditingTenant.set(false);
    this.tenantFormData = {
      nombre: '',
      nit: '',
      telefono: '',
      email: '',
      direccion: '',
      latitud: 0,
      longitud: 0,
    };
    this.showTenantForm.set(true);
  }

  editTenant(tenant: TallerTenant | null) {
    if (!tenant) return;
    this.isEditingTenant.set(true);
    this.tenantFormData = {
      nombre: tenant.nombre,
      nit: tenant.nit,
      telefono: tenant.telefono,
      email: tenant.email,
      direccion: tenant.direccion,
      latitud: tenant.latitud ?? 0,
      longitud: tenant.longitud ?? 0,
    };
    this.showTenantForm.set(true);
  }

  saveTenant() {
    const data = this.tenantFormData;
    if (!data.nombre || !data.nit) {
      this.snackBar.open('⚠️ Nombre y NIT son obligatorios.', 'Cerrar', { duration: 3000 });
      return;
    }

    const id = this.isEditingTenant() ? this.selectedTenant()?.id_taller : undefined;
    this.tenantSaveMutation.mutate({ id, payload: data });
  }

  closeTenantForm() {
    this.showTenantForm.set(false);
  }

  toggleStatus() {
    if (!this.selectedTenant()) return;
    this.toggleStatusMutation.mutate(this.selectedTenant()!.id_taller);
  }

  openUserForm() {
    this.userFormData = {
      nombre: '',
      correo: '',
      telefono: '',
      rol_nombre: 'cliente',
    };
    this.showUserForm.set(true);
  }

  saveUser() {
    if (!this.selectedTenant()) return;
    const data = this.userFormData;
    if (!data.nombre || !data.correo) {
      this.snackBar.open('⚠️ Nombre y correo son obligatorios.', 'Cerrar', { duration: 3000 });
      return;
    }

    const payload: TenantUserCreate = {
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      rol_nombre: data.rol_nombre || 'cliente',
      id_taller: this.selectedTenant()!.id_taller,
    };
    this.createUserMutation.mutate(payload);
  }

  closeUserForm() {
    this.showUserForm.set(false);
  }

  openTechnicianForm() {
    this.technicianFormData = {
      nombre: '',
      correo: '',
      telefono: '',
    };
    this.showTechnicianForm.set(true);
  }

  saveTechnician() {
    if (!this.selectedTenant()) return;
    const data = this.technicianFormData;
    if (!data.nombre || !data.correo) {
      this.snackBar.open('⚠️ Nombre y correo son obligatorios.', 'Cerrar', { duration: 3000 });
      return;
    }

    const payload: TenantUserCreate = {
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      rol_nombre: 'tecnico',
      id_taller: this.selectedTenant()!.id_taller,
    };
    this.createTechMutation.mutate(payload);
  }

  closeTechnicianForm() {
    this.showTechnicianForm.set(false);
  }
}
