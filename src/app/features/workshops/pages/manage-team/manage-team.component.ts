import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { WorkshopsService } from '../../data-access/workshops.service';
import { TecnicoCreate, TecnicoResponse } from '@core/models/workshops.model';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { LucideAngularModule, Users, UserPlus, Search, Filter, RefreshCw, Mail, Phone, Shield, Pencil, PowerOff, Power, X } from 'lucide-angular';
import { PageHeaderComponent, LoadingStateComponent, EmptyStateComponent } from '@shared/ui';

@Component({
  selector: 'app-manage-team',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatChipsModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Gestión de Equipo" 
        subtitle="Administra el personal técnico y administrativo de tu taller."
        [icon]="usersIcon">
        <div actions>
          <button mat-flat-button color="primary" class="btn-add" (click)="openCreateForm()">
            <lucide-icon [img]="userPlusIcon" [size]="18"></lucide-icon>
            Nuevo Miembro
          </button>
        </div>
      </app-page-header>

      <!-- Formulario de Crear / Editar -->
      @if (showForm()) {
        <div class="form-overlay sm-glass-card">
          <div class="form-header">
            <h3>{{ editingTech() ? 'Editar Técnico' : 'Nuevo Técnico' }}</h3>
            <button mat-icon-button (click)="closeForm()">
              <lucide-icon [img]="closeIcon" [size]="18"></lucide-icon>
            </button>
          </div>
          <form [formGroup]="techForm" (ngSubmit)="onSubmit()" class="tech-form">
            <mat-form-field appearance="outline">
              <mat-label>Nombre Completo</mat-label>
              <input matInput formControlName="nombre" placeholder="Ej: Juan Pérez" />
              <mat-error>El nombre es obligatorio</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="telefono" placeholder="Ej: 77712345" />
            </mat-form-field>

            @if (!editingTech()) {
              <mat-form-field appearance="outline">
                <mat-label>Correo Electrónico</mat-label>
                <input matInput formControlName="email" type="email" placeholder="tecnico@taller.com" />
                <mat-error>Correo inválido</mat-error>
              </mat-form-field>
            }

            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="closeForm()">Cancelar</button>
              <button mat-flat-button color="primary" type="submit"
                [disabled]="techForm.invalid || createMutation.isPending() || updateMutation.isPending()">
                {{ (createMutation.isPending() || updateMutation.isPending()) ? 'Guardando...' : (editingTech() ? 'Guardar Cambios' : 'Registrar') }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Filtros -->
      <div class="filters-bar sm-glass-card">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Buscar por nombre</mat-label>
          <input matInput [(ngModel)]="searchText" (ngModelChange)="applyFilter()" placeholder="Nombre del técnico..." />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field filter-small">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="filterEstado" (ngModelChange)="applyFilter()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="activo">Activos</mat-option>
            <mat-option value="inactivo">Inactivos</mat-option>
          </mat-select>
        </mat-form-field>

        <span class="results-count">{{ filteredTechs().length }} técnico(s)</span>
      </div>

      <!-- Tabla -->
      @if (techsQuery.isLoading()) {
        <app-loading-state message="Cargando equipo..."></app-loading-state>
      } @else if (techsQuery.isError()) {
        <div class="error-state sm-glass-card">❌ Error al cargar los técnicos.</div>
      } @else {
        <div class="table-card sm-glass-card">
          <table mat-table [dataSource]="pagedTechs()" class="tech-table">

            <!-- Nombre -->
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Técnico</th>
              <td mat-cell *matCellDef="let tech">
                <div class="tech-cell">
                  <div class="avatar" [class.inactive]="!tech.estado">
                    {{ tech.nombre[0].toUpperCase() }}
                  </div>
                  <div>
                    <div class="tech-name">{{ tech.nombre }}</div>
                    <div class="tech-id">ID: {{ tech.id_tecnico.substring(0, 8) }}...</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Teléfono -->
            <ng-container matColumnDef="telefono">
              <th mat-header-cell *matHeaderCellDef>Teléfono</th>
              <td mat-cell *matCellDef="let tech">
                <div class="phone-cell">
                  <lucide-icon [img]="phoneIcon" [size]="13"></lucide-icon>
                  {{ tech.telefono || '—' }}
                </div>
              </td>
            </ng-container>

            <!-- Estado -->
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let tech">
                <span class="status-badge" [class.active]="tech.estado" [class.inactive]="!tech.estado">
                  {{ tech.estado ? 'Disponible' : 'Inactivo' }}
                </span>
              </td>
            </ng-container>

            <!-- Acciones -->
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let tech">
                <div class="actions-cell">
                  <button mat-icon-button
                    matTooltip="Editar técnico"
                    (click)="openEditForm(tech)">
                    <lucide-icon [img]="editIcon" [size]="16"></lucide-icon>
                  </button>
                  <button mat-icon-button
                    [matTooltip]="tech.estado ? 'Desactivar (Soft Delete)' : 'Reactivar'"
                    [class.deactivate-btn]="tech.estado"
                    [class.activate-btn]="!tech.estado"
                    (click)="toggleStatus(tech)"
                    [disabled]="toggleMutation.isPending()">
                    <lucide-icon [img]="tech.estado ? powerOffIcon : powerIcon" [size]="16"></lucide-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if (filteredTechs().length === 0) {
            <app-empty-state 
              [icon]="usersIcon" 
              title="Sin resultados" 
              message="No hay miembros del equipo que coincidan con los filtros.">
            </app-empty-state>
          }

          <mat-paginator
            [length]="filteredTechs().length"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 25]"
            (page)="onPageChange($event)"
            aria-label="Página de técnicos">
          </mat-paginator>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }

    /* Formulario */
    .form-overlay {
      margin-bottom: 1.5rem; padding: 1.5rem; border-radius: 12px;
      border: 1px solid rgba(var(--sm-rgb-sapphire-400), 0.3);
      animation: slideDown 0.3s ease-out;
    }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;
      h3 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--sm-color-sapphire-300); }
    }
    .tech-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }

    /* Filtros */
    .filters-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
    .filter-field { flex: 1; min-width: 200px; }
    .filter-small { max-width: 160px; }
    .results-count { margin-left: auto; font-size: 0.8rem; color: var(--sm-color-text-muted); white-space: nowrap; }

    /* Tabla */
    .table-card { border-radius: 12px; overflow: hidden; }
    .tech-table { width: 100%; background: transparent;
      th { color: var(--sm-color-text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
    }
    .table-row:hover td { background: rgba(var(--sm-rgb-sapphire-500), 0.05); transition: background 0.15s; }

    .tech-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--sm-color-sapphire-600); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
      &.inactive { background: rgba(var(--sm-rgb-slate-400), 0.3); }
    }
    .tech-name { font-size: 0.9rem; font-weight: 500; color: var(--sm-color-text-main); }
    .tech-id { font-size: 0.7rem; color: var(--sm-color-text-muted); font-family: monospace; }
    .phone-cell { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--sm-color-text-soft); }

    .status-badge { padding: 0.2rem 0.65rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.03em;
      &.active { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
      &.inactive { background: rgba(var(--sm-rgb-slate-400), 0.1); color: var(--sm-color-text-muted); }
    }

    .actions-cell { display: flex; gap: 0.25rem; }
    .deactivate-btn lucide-icon { color: #e74c3c; }
    .activate-btn lucide-icon { color: #2ecc71; }

    .error-state { padding: 2rem; text-align: center; color: #e74c3c; }

    mat-paginator { background: transparent; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class ManageTeamComponent {
  private fb              = inject(FormBuilder);
  private workshopsService = inject(WorkshopsService);
  private snackBar        = inject(MatSnackBar);
  private queryClient     = injectQueryClient();

  readonly usersIcon    = Users;
  readonly userPlusIcon = UserPlus;
  readonly phoneIcon    = Phone;
  readonly editIcon     = Pencil;
  readonly powerOffIcon = PowerOff;
  readonly powerIcon    = Power;
  readonly closeIcon    = X;

  displayedColumns = ['nombre', 'telefono', 'estado', 'acciones'];

  // Estado UI
  showForm    = signal(false);
  editingTech = signal<TecnicoResponse | null>(null);
  searchText  = '';
  filterEstado = '';
  pageSize    = 10;
  pageIndex   = 0;

  techForm = this.fb.nonNullable.group({
    nombre:   ['', Validators.required],
    telefono: [''],
    email:    ['', Validators.email],
  });

  // ── Query ──────────────────────────────────────────────────────────────────
  techsQuery = injectQuery(() => ({
    queryKey: ['technicians'],
    queryFn: () => lastValueFrom(this.workshopsService.getTechnicians())
  }));

  // ── Filtrado y paginación local ────────────────────────────────────────────
  filteredTechs = computed(() => {
    let data = this.techsQuery.data() ?? [];
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      data = data.filter(t => t.nombre.toLowerCase().includes(q));
    }
    if (this.filterEstado === 'activo')   data = data.filter(t => t.estado);
    if (this.filterEstado === 'inactivo') data = data.filter(t => !t.estado);
    return data;
  });

  pagedTechs = computed(() => {
    const start = this.pageIndex * this.pageSize;
    return this.filteredTechs().slice(start, start + this.pageSize);
  });

  applyFilter() { this.pageIndex = 0; }
  onPageChange(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; }

  // ── Mutations ──────────────────────────────────────────────────────────────
  createMutation = injectMutation(() => ({
    mutationFn: (data: TecnicoCreate) => lastValueFrom(this.workshopsService.createTechnician(data)),
    onSuccess: (newTech: TecnicoResponse) => {
      if (newTech.temp_password) {
        this.snackBar.open(`✅ Técnico registrado. Cuenta temporal: ${newTech.temp_password}`, 'Entendido', { duration: 15000 });
      } else {
        this.snackBar.open('✅ Técnico registrado correctamente', 'Cerrar', { duration: 3000 });
      }
      this.queryClient.invalidateQueries({ queryKey: ['technicians'] });
      this.closeForm();
    },
    onError: () => this.snackBar.open('❌ Error al registrar técnico', 'Cerrar', { duration: 4000 }),
  }));

  updateMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: string; data: Partial<TecnicoCreate> }) =>
      lastValueFrom(this.workshopsService.updateTechnician(id, data)),
    onSuccess: () => {
      this.snackBar.open('✅ Técnico actualizado', 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['technicians'] });
      this.closeForm();
    },
    onError: () => this.snackBar.open('❌ Error al actualizar', 'Cerrar', { duration: 4000 }),
  }));

  toggleMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.workshopsService.toggleTechnicianStatus(id)),
    onSuccess: (tech) => {
      const msg = tech.estado ? '✅ Técnico reactivado' : '⚠️ Técnico desactivado';
      this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
    onError: () => this.snackBar.open('❌ Error al cambiar estado', 'Cerrar', { duration: 4000 }),
  }));

  // ── Acciones UI ────────────────────────────────────────────────────────────
  openCreateForm() {
    this.editingTech.set(null);
    this.techForm.reset();
    this.techForm.get('email')?.setValidators([Validators.required, Validators.email]);
    this.techForm.get('email')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  openEditForm(tech: TecnicoResponse) {
    this.editingTech.set(tech);
    this.techForm.patchValue({ nombre: tech.nombre, telefono: tech.telefono });
    this.techForm.get('email')?.clearValidators();
    this.techForm.get('email')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingTech.set(null);
    this.techForm.reset();
  }

  onSubmit() {
    if (this.techForm.invalid) return;

    const formData = this.techForm.getRawValue();
    const tech = this.editingTech();

    if (tech) {
      const updatePayload: Partial<TecnicoCreate> = {
        nombre: formData.nombre,
        telefono: formData.telefono || undefined
      };
      this.updateMutation.mutate({ id: tech.id_tecnico, data: updatePayload });
    } else {
      const createPayload: TecnicoCreate = {
        nombre: formData.nombre,
        telefono: formData.telefono || undefined,
        email: formData.email || undefined
      };
      this.createMutation.mutate(createPayload);
    }
  }

  toggleStatus(tech: TecnicoResponse) {
    this.toggleMutation.mutate(tech.id_tecnico);
  }
}
