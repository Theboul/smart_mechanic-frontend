import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IdentityService } from '../../data-access/identity.service';
import { WorkshopSelectorComponent } from '../../components/workshop-selector/workshop-selector.component';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule, User, UserPlus, Filter, Search, ShieldCheck, Mail, Briefcase, RefreshCw, Phone, Users, Wrench } from 'lucide-angular';
import { PageHeaderComponent, LoadingStateComponent, EmptyStateComponent, StatCardComponent, SearchInputComponent, SelectComponent, SelectOption } from '@shared/ui';
import { UserFormDialogComponent } from '../../components/user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WorkshopSelectorComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    StatCardComponent,
    SearchInputComponent,
    SelectComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Gestión de Personal e Identidad"
        [subtitle]="pageSubtitle()"
        [icon]="userIcon">
        <div actions>
          <button mat-flat-button color="primary" class="btn-add" (click)="openCreateDialog()">
            <lucide-icon [img]="userPlusIcon" [size]="18"></lucide-icon>
            Nuevo Usuario
          </button>
        </div>
      </app-page-header>

      <!-- Tarjetas de Estadísticas Reutilizadas (Detalle de Imagen 2) -->
      <div class="stats-grid">
        <app-stat-card 
          title="TOTAL USUARIOS" 
          [value]="totalUsersCount()" 
          description="Todos activos" 
          [icon]="usersIcon">
        </app-stat-card>

        <app-stat-card 
          title="TÉCNICOS" 
          [value]="activeTechniciansCount()" 
          description="En servicio" 
          [icon]="wrenchIcon">
        </app-stat-card>

        <app-stat-card 
          title="CLIENTES" 
          [value]="clientsCount()" 
          description="Registrados" 
          [icon]="userIcon">
        </app-stat-card>

        <app-stat-card 
          title="ADMINISTRADORES" 
          [value]="adminsCount()" 
          description="Admin taller" 
          [icon]="shieldCheckIcon">
        </app-stat-card>
      </div>
 
      <!-- Barra de Filtros Premium (Detalle de Imagen 2) -->
      <div class="filters-container sm-glass-card">
        <div class="filter-group">
          <app-search-input
            class="search-field-mat"
            [(value)]="searchQuery"
            (valueChange)="onFilterChange()"
            placeholder="Buscar por nombre, correo, teléfono o placa...">
          </app-search-input>
 
          <app-select
            class="sm-select"
            [(value)]="filterRol"
            (valueChange)="onFilterChange()"
            placeholder="Todos los roles"
            [options]="roleOptions">
          </app-select>
 
          @if (isSuperAdmin()) {
            <div class="workshop-filter">
              <app-workshop-selector 
                [workshops]="workshopsQuery.data() || []" 
                [isLoading]="workshopsQuery.isLoading()"
                (workshopChanged)="onWorkshopFilterChange($event)">
              </app-workshop-selector>
            </div>
          }
        </div>
 
        <div class="filter-actions">
          <button mat-icon-button (click)="usersQuery.refetch()" matTooltip="Actualizar">
            <lucide-icon [img]="refreshIcon" [size]="18"></lucide-icon>
          </button>
          <button mat-button class="clear-btn" (click)="clearFilters()">Limpiar</button>
        </div>
      </div>
 
      <!-- Tabla de Usuarios / Grid Móvil -->
      <div class="table-card sm-glass-card">
        <div class="table-header">
          <div class="table-info">
            <lucide-icon [img]="shieldCheckIcon" [size]="16"></lucide-icon>
            <span>Usuarios registrados</span>
            <span class="count-badge">{{ filteredUsers().length }}</span>
          </div>
        </div>
 
        @if (usersQuery.isLoading()) {
          <app-loading-state message="Sincronizando identidades..."></app-loading-state>
        } @else {
          <!-- Vista de Escritorio / Tablet (Tabla deslizable) -->
          <div class="table-container">
            <table mat-table [dataSource]="pagedUsers()" class="modern-table">
              
              <!-- Columna Nombre -->
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef>Usuario</th>
                <td mat-cell *matCellDef="let user">
                  <div class="user-profile-cell">
                    <div class="avatar-box" [class]="user.rol_nombre">
                      {{ user.nombre[0] | uppercase }}
                    </div>
                    <div class="user-details">
                      <div class="user-name">{{ user.nombre }}</div>
                      <div class="user-id">ID: {{ user.id_usuario.substring(0,8) }}</div>
                    </div>
                  </div>
                </td>
              </ng-container>
  
              <!-- Columna Contacto -->
              <ng-container matColumnDef="contacto">
                <th mat-header-cell *matHeaderCellDef>Contacto</th>
                <td mat-cell *matCellDef="let user">
                  <div class="contact-info">
                    <div class="info-item">
                      <lucide-icon [img]="mailIcon" [size]="12"></lucide-icon>
                      <span>{{ user.correo }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>
  
              <!-- Columna Rol (Estilo Chips de Imagen 2) -->
              <ng-container matColumnDef="rol">
                <th mat-header-cell *matHeaderCellDef>Responsabilidad</th>
                <td mat-cell *matCellDef="let user">
                  <div class="role-chip" [class]="user.rol_nombre">
                    <lucide-icon [img]="briefcaseIcon" [size]="12"></lucide-icon>
                    <span>{{ user.rol_nombre.replace('_', ' ') | uppercase }}</span>
                  </div>
                </td>
              </ng-container>
  
              <!-- Columna Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let user">
                  <span class="status-dot-chip" [class.active]="user.estado">
                    <span class="dot"></span>
                    {{ user.estado ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
              </ng-container>
  
              <!-- Columna Acciones (Estilo Cajas de Botón de Imagen 2) -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let user">
                  <div class="action-buttons">
                    <button mat-icon-button class="edit-btn" matTooltip="Editar Perfil">
                      <mat-icon>edit_note</mat-icon>
                    </button>
                    <button 
                      mat-icon-button 
                      [class.toggle-off]="user.estado" 
                      [class.toggle-on]="!user.estado"
                      (click)="toggleStatus(user.id_usuario)"
                      [disabled]="statusMutation.isPending()"
                      [matTooltip]="user.estado ? 'Desactivar Usuario' : 'Activar Usuario'"
                    >
                      <mat-icon>{{ user.estado ? 'person_off' : 'person_check' }}</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>
  
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
            </table>
          </div>

          <!-- Vista Móvil responsiva (Cards) -->
          <div class="mobile-cards-grid">
            @for (user of pagedUsers(); track user.id_usuario) {
              <div class="mobile-user-card sm-glass-card">
                <div class="card-header">
                  <div class="avatar-box" [class]="user.rol_nombre">
                    {{ user.nombre[0] | uppercase }}
                  </div>
                  <div class="user-info-text">
                    <div class="user-name">{{ user.nombre }}</div>
                    <div class="user-role-badge">
                      <div class="role-chip" [class]="user.rol_nombre">
                        <lucide-icon [img]="briefcaseIcon" [size]="10"></lucide-icon>
                        <span>{{ user.rol_nombre.replace('_', ' ') | uppercase }}</span>
                      </div>
                    </div>
                  </div>
                  <span class="status-dot-chip" [class.active]="user.estado">
                    <span class="dot"></span>
                    {{ user.estado ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </div>
                
                <div class="card-body">
                  <div class="info-item">
                    <lucide-icon [img]="mailIcon" [size]="12"></lucide-icon>
                    <span>{{ user.correo }}</span>
                  </div>
                  @if (user.telefono) {
                    <div class="info-item">
                      <lucide-icon [img]="phoneIcon" [size]="12"></lucide-icon>
                      <span>{{ user.telefono }}</span>
                    </div>
                  }
                  <div class="info-item text-muted">
                    <span>ID: {{ user.id_usuario.substring(0,8) }}</span>
                  </div>
                </div>
                
                <div class="card-actions">
                  <button mat-icon-button class="edit-btn" matTooltip="Editar Perfil">
                    <mat-icon>edit_note</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    [class.toggle-off]="user.estado" 
                    [class.toggle-on]="!user.estado"
                    (click)="toggleStatus(user.id_usuario)"
                    [disabled]="statusMutation.isPending()"
                    [matTooltip]="user.estado ? 'Desactivar Usuario' : 'Activar Usuario'"
                  >
                    <mat-icon>{{ user.estado ? 'person_off' : 'person_check' }}</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
 
          @if (filteredUsers().length === 0) {
            <app-empty-state 
              [icon]="userIcon" 
              title="Sin coincidencias" 
              message="No hay usuarios que coincidan con los filtros aplicados.">
            </app-empty-state>
          }
 
          <mat-paginator
            [length]="filteredUsers().length"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            class="premium-paginator"
          ></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
 
    /* Estadísticas Reutilizadas */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    /* Barra de Filtros Premium */
    .filters-container {
      padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem;
      .filter-group { display: flex; align-items: center; gap: 1rem; flex: 1; }
    }
 
    .search-field-mat { flex: 1; max-width: 500px; }
 
    .sm-select { width: 220px; }
    .clear-btn { color: var(--sm-color-text-muted); font-size: 0.8rem; }
    .filter-actions { display: flex; align-items: center; gap: 0.5rem; }
 
    /* Tabla Premium */
    .table-card { border-radius: 16px; overflow: hidden; padding: 0; }
    .table-header { 
      padding: 1.25rem 1.5rem; 
      border-bottom: 1px solid rgba(255,255,255,0.05);
      background: rgba(255,255,255,0.01);
      .table-info { display: flex; align-items: center; gap: 0.75rem; color: var(--sm-color-text-title); font-weight: 700; font-size: 0.85rem; }
      .count-badge { 
        margin-left: auto; 
        background: var(--sm-color-sapphire-500); 
        color: white; 
        padding: 0.15rem 0.5rem; 
        border-radius: 12px; 
        font-size: 0.7rem; 
        font-weight: 700; 
        min-width: 20px; 
        height: 20px; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center;
      }
    }
 
    .table-container { width: 100%; overflow-x: auto; }
 
    .modern-table {
      width: 100%; background: transparent; min-width: 800px;
      th { color: var(--sm-color-text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.8rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.02); }
    }
    .table-row:hover td { background: rgba(var(--sm-rgb-sapphire-500), 0.05); transition: background 0.15s; }
 
    .user-profile-cell {
      display: flex; align-items: center; gap: 1rem;
      .avatar-box {
        width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; color: white; background: #475569;
        &.superadmin { background: #6366f1; }
        &.admin_taller { background: #f59e0b; }
        &.tecnico { background: #8b5cf6; }
        &.cliente { background: #10b981; }
      }
      .user-name { font-weight: 600; color: var(--sm-color-text-main); font-size: 0.9rem; }
      .user-id { font-size: 0.65rem; color: var(--sm-color-text-muted); margin-top: 0.1rem; font-family: monospace; }
    }
 
    /* Estilo Chips de Roles (Imagen 2) */
    .role-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.65rem;
      border-radius: 8px;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.03em;
      border: 1px solid rgba(255, 255, 255, 0.05);
      
      &.superadmin {
        background: rgba(99, 102, 241, 0.12);
        color: #818cf8;
        border-color: rgba(99, 102, 241, 0.2);
      }
      &.admin_taller {
        background: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
        border-color: rgba(245, 158, 11, 0.2);
      }
      &.tecnico {
        background: rgba(139, 92, 246, 0.12);
        color: #a78bfa;
        border-color: rgba(139, 92, 246, 0.2);
      }
      &.cliente {
        background: rgba(16, 185, 129, 0.12);
        color: #34d399;
        border-color: rgba(16, 185, 129, 0.2);
      }
    }
 
    .status-dot-chip {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; background: rgba(255,255,255,0.05); color: var(--sm-color-text-muted);
      .dot { width: 6px; height: 6px; border-radius: 50%; background: #64748b; }
      &.active { background: rgba(46, 204, 113, 0.1); color: #2ecc71; .dot { background: #2ecc71; box-shadow: 0 0 8px #2ecc71; } }
    }
 
    .contact-info {
      .info-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--sm-color-text-soft); }
    }
 
    /* Estilo Botones de Acción en Caja (Imagen 2) */
    .action-buttons {
      display: flex;
      gap: 0.5rem;
      
      button {
        width: 32px;
        height: 32px;
        line-height: 32px;
        min-width: 32px;
        padding: 0;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: var(--sm-color-text-muted);
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        
        .mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          line-height: 18px;
        }
        
        &:hover {
          color: white;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.1);
        }
      }
      
      .edit-btn:hover {
        background: rgba(99, 102, 241, 0.1);
        color: #818cf8;
        border-color: rgba(99, 102, 241, 0.2);
      }
      .toggle-off:hover {
        background: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
        border-color: rgba(231, 76, 60, 0.2);
      }
      .toggle-on:hover {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
        border-color: rgba(46, 204, 113, 0.2);
      }
    }
 
    .premium-paginator { background: transparent; color: var(--sm-color-text-soft); }
    .mobile-cards-grid { display: none; }
 
    @media (max-width: 768px) {
      .page-container { padding: 1rem; }
      .stats-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
      .filters-container {
        flex-direction: column; align-items: stretch; gap: 1rem; padding: 1rem;
        .filter-group { flex-direction: column; align-items: stretch; gap: 0.75rem; }
        .search-field-mat { max-width: 100%; }
        .sm-select { width: 100%; }
      }
      .table-container { display: none; }
      .mobile-cards-grid {
        display: grid; grid-template-columns: 1fr; gap: 1rem; padding: 1rem;
      }
      .mobile-user-card {
        padding: 1.25rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.75rem;
        
        .card-header {
          display: flex; align-items: center; gap: 1rem;
          .user-info-text { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
          .user-name { font-weight: 600; color: var(--sm-color-text-main); font-size: 0.9rem; }
          .user-role-badge { display: inline-flex; }
          .avatar-box {
            width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; color: white; background: #475569;
            &.superadmin { background: #6366f1; }
            &.admin_taller { background: #f59e0b; }
            &.tecnico { background: #8b5cf6; }
            &.cliente { background: #10b981; }
          }
        }
        .card-body {
          display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 0.75rem 0;
          .info-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--sm-color-text-soft); }
          .text-muted { font-size: 0.7rem; color: var(--sm-color-text-muted); font-family: monospace; }
        }
        .card-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
      }
    }
 
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UserManagementComponent {
  private identityService = inject(IdentityService);
  private workshopsService = inject(WorkshopsService);
  private authStore = inject(AuthStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private queryClient = injectQueryClient();
 
  // Iconos
  protected readonly userPlusIcon = UserPlus;
  protected readonly filterIcon = Filter;
  protected readonly userIcon = User;
  protected readonly searchIcon = Search;
  protected readonly shieldCheckIcon = ShieldCheck;
  protected readonly mailIcon = Mail;
  protected readonly briefcaseIcon = Briefcase;
  protected readonly refreshIcon = RefreshCw;
  protected readonly phoneIcon = Phone;
  protected readonly usersIcon = Users;
  protected readonly wrenchIcon = Wrench;

  // Estado de Filtros (Señales reactivas)
  searchQuery = signal('');
  filterRol = signal('');
  selectedWorkshopId = signal<string | null>(null);
  
  // Paginación
  pageSize = 10;
  pageIndex = 0;

  isSuperAdmin = computed(() => this.authStore.user()?.rol_nombre === 'superadmin');
  
  totalUsersCount = computed(() => this.usersQuery.data()?.length || 0);
  activeTechniciansCount = computed(() => this.usersQuery.data()?.filter(u => u.rol_nombre === 'tecnico' && u.estado).length || 0);
  clientsCount = computed(() => this.usersQuery.data()?.filter(u => u.rol_nombre === 'cliente').length || 0);
  adminsCount = computed(() => this.usersQuery.data()?.filter(u => u.rol_nombre === 'admin_taller').length || 0);

  pageSubtitle = computed(() => 
    this.isSuperAdmin() 
      ? 'Administra los usuarios, roles y accesos globales de la plataforma.' 
      : 'Gestiona el personal y técnicos asignados a tu taller.'
  );

  displayedColumns: string[] = ['nombre', 'contacto', 'rol', 'estado', 'acciones'];

  roleOptions: SelectOption[] = [
    { value: 'superadmin', label: 'SuperAdmin' },
    { value: 'admin_taller', label: 'Administrador de Taller' },
    { value: 'tecnico', label: 'Técnico Mecánico' },
    { value: 'cliente', label: 'Cliente' }
  ];

  usersQuery = injectQuery(() => ({
    queryKey: ['users', this.selectedWorkshopId()],
    queryFn: () => lastValueFrom(this.identityService.getUsers(this.selectedWorkshopId() ?? undefined))
  }));

  workshopsQuery = injectQuery(() => ({
    queryKey: ['all-workshops'],
    queryFn: () => lastValueFrom(this.workshopsService.getAllWorkshops()),
    enabled: this.isSuperAdmin()
  }));

  // Filtrado Reactivo (Client-side para fluidez, soportando gran volumen)
  filteredUsers = computed(() => {
    let data = this.usersQuery.data() || [];
    const search = this.searchQuery().toLowerCase();
    const role = this.filterRol();
 
    if (search) {
      data = data.filter(u => 
        u.nombre.toLowerCase().includes(search) || 
        u.correo.toLowerCase().includes(search) ||
        (u.telefono && u.telefono.toLowerCase().includes(search)) ||
        (u.placas && u.placas.some(placa => placa.toLowerCase().includes(search)))
      );
    }
 
    if (role) {
      data = data.filter(u => u.rol_nombre === role);
    }
 
    return data;
  });

  // Paginación Reactiva
  pagedUsers = computed(() => {
    const start = this.pageIndex * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  statusMutation = injectMutation(() => ({
    mutationFn: (userId: string) => lastValueFrom(this.identityService.toggleUserStatus(userId)),
    onSuccess: (updated) => {
      this.snackBar.open(`Usuario ${updated.nombre} ${updated.estado ? 'activado' : 'desactivado'}`, 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      this.snackBar.open('Error al cambiar el estado del usuario', 'Cerrar', { duration: 4000 });
    }
  }));

  createMutation = injectMutation(() => ({
    mutationFn: (userData: any) => lastValueFrom(this.identityService.createUser(userData)),
    onSuccess: (newUser) => {
      this.snackBar.open(`Usuario ${newUser.nombre} creado con éxito`, 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      const msg = error.error?.detail || 'Error al crear el usuario';
      this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
    }
  }));

  openCreateDialog() {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '680px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createMutation.mutate(result);
      }
    });
  }

  onWorkshopFilterChange(tallerId: string | null) {
    this.selectedWorkshopId.set(tallerId);
    this.pageIndex = 0;
  }

  onFilterChange() {
    this.pageIndex = 0;
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  clearFilters() {
    this.searchQuery.set('');
    this.filterRol.set('');
    this.selectedWorkshopId.set(null);
    this.pageIndex = 0;
  }

  toggleStatus(userId: string) {
    this.statusMutation.mutate(userId);
  }
}
