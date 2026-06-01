import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, User, Mail, Phone, Lock, Briefcase, Warehouse } from 'lucide-angular';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { WorkshopSelectorComponent } from '../workshop-selector/workshop-selector.component';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    LucideAngularModule,
    WorkshopSelectorComponent
  ],
  template: `
    <div class="dialog-container">
      <header class="dialog-header">
        <div class="header-icon">
          <lucide-icon [img]="userIcon" [size]="24"></lucide-icon>
        </div>
        <div class="header-text">
          <h2>Nuevo Usuario</h2>
          <p>Registra personal o clientes en la plataforma</p>
        </div>
      </header>

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="premium-form">
        <mat-dialog-content>
          <div class="form-grid">
            <!-- Nombre -->
            <div class="form-field-group">
              <label class="field-label">Nombre Completo *</label>
              <mat-form-field appearance="outline" class="sm-capsule-field" subscriptSizing="dynamic">
                <input matInput formControlName="nombre" placeholder="Ej. Juan Pérez">
                <lucide-icon matPrefix [img]="userIcon" [size]="16" class="prefix-icon"></lucide-icon>
              </mat-form-field>
            </div>

            <!-- Correo -->
            <div class="form-field-group">
              <label class="field-label">Correo Electrónico *</label>
              <mat-form-field appearance="outline" class="sm-capsule-field" subscriptSizing="dynamic">
                <input matInput formControlName="correo" type="email" placeholder="correo@ejemplo.com">
                <lucide-icon matPrefix [img]="mailIcon" [size]="16" class="prefix-icon"></lucide-icon>
              </mat-form-field>
            </div>

            <!-- Teléfono -->
            <div class="form-field-group">
              <label class="field-label">Teléfono (Opcional)</label>
              <mat-form-field appearance="outline" class="sm-capsule-field" subscriptSizing="dynamic">
                <input matInput formControlName="telefono" placeholder="+591 ...">
                <lucide-icon matPrefix [img]="phoneIcon" [size]="16" class="prefix-icon"></lucide-icon>
              </mat-form-field>
            </div>

            <!-- Contraseña -->
            <div class="form-field-group">
              <label class="field-label">Contraseña Inicial *</label>
              <mat-form-field appearance="outline" class="sm-capsule-field" subscriptSizing="dynamic">
                <input matInput formControlName="contrasena" type="password" placeholder="Mínimo 6 caracteres">
                <lucide-icon matPrefix [img]="lockIcon" [size]="16" class="prefix-icon"></lucide-icon>
              </mat-form-field>
            </div>

            <!-- Rol -->
            <div class="form-field-group">
              <label class="field-label">Rol del Usuario *</label>
              <mat-form-field appearance="outline" class="sm-capsule-field" subscriptSizing="dynamic">
                <mat-select formControlName="rol_nombre" placeholder="Seleccione un rol">
                  @if (isSuperAdmin()) {
                    <mat-option value="superadmin">SuperAdmin</mat-option>
                    <mat-option value="admin_taller">Administrador de Taller (Owner)</mat-option>
                    <mat-option value="tecnico">Técnico Mecánico</mat-option>
                    <mat-option value="cliente">Cliente</mat-option>
                  } @else if (isOwner()) {
                    <mat-option value="admin_taller">Administrador Local de Sucursal</mat-option>
                    <mat-option value="tecnico">Técnico Mecánico</mat-option>
                    <mat-option value="cliente">Cliente</mat-option>
                  } @else if (isBranchAdmin()) {
                    <mat-option value="tecnico">Técnico Mecánico</mat-option>
                    <mat-option value="cliente">Cliente</mat-option>
                  }
                </mat-select>
                <lucide-icon matPrefix [img]="briefcaseIcon" [size]="16" class="prefix-icon"></lucide-icon>
              </mat-form-field>
            </div>

            <!-- Selector de Taller (Solo si es SuperAdmin y elige tecnico/admin_taller) -->
            @if (showWorkshopSelector()) {
              <div class="workshop-field">
                <label class="field-label">Vincular a Taller</label>
                <app-workshop-selector 
                  [workshops]="workshopsQuery.data() || []"
                  [isLoading]="workshopsQuery.isLoading()"
                  (workshopChanged)="onWorkshopChange($event)">
                </app-workshop-selector>
                <input type="hidden" formControlName="id_taller">
              </div>
            }
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button type="button" class="btn-cancel" (click)="onCancel()">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="userForm.invalid" class="btn-submit">
            Crear Usuario
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
      background: #0a0e17 !important;
      border-radius: 20px;
      overflow: hidden;
    }
    .dialog-header { 
      display: flex; align-items: center; gap: 1rem; padding: 1.5rem 1.5rem 1rem;
      .header-icon { 
        width: 44px; height: 44px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); 
        color: #818cf8; display: flex; align-items: center; justify-content: center;
      }
      h2 { margin: 0; font-size: 1.2rem; font-weight: 700; color: white; }
      p { margin: 0; font-size: 0.8rem; color: var(--sm-color-text-muted); }
    }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; padding: 1rem 1.75rem; }
    .form-field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .workshop-field { grid-column: span 2; margin-top: 0.5rem; }
    .field-label { display: block; font-size: 0.7rem; color: var(--sm-color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .prefix-icon { color: var(--sm-color-text-muted); margin-right: 0.5rem; display: flex; align-items: center; }
    
    mat-dialog-actions { 
      padding: 1rem 1.5rem 1.5rem;
      gap: 0.75rem;
    }

    .btn-cancel {
      border-radius: 20px !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
      color: var(--sm-color-text-muted) !important;
    }
    .btn-submit {
      border-radius: 20px !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
      background: var(--sm-color-sapphire-500) !important;
      color: white !important;
    }
    .btn-submit:disabled {
      background: rgba(255, 255, 255, 0.05) !important;
      color: rgba(255, 255, 255, 0.2) !important;
    }

    ::ng-deep {
      .mat-mdc-dialog-container .mdc-dialog__surface {
        background: #0a0e17 !important;
        border-radius: 20px !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
      }
      .mat-mdc-dialog-content, mat-dialog-content, .mdc-dialog__content {
        overflow-x: hidden !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class UserFormDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private authStore = inject(AuthStore);
  private workshopsService = inject(WorkshopsService);

  protected readonly userIcon = User;
  protected readonly mailIcon = Mail;
  protected readonly phoneIcon = Phone;
  protected readonly lockIcon = Lock;
  protected readonly briefcaseIcon = Briefcase;
  protected readonly warehouseIcon = Warehouse;

  isSuperAdmin = signal(this.authStore.user()?.rol_nombre === 'superadmin');
  isOwner = signal(
    this.authStore.user()?.rol_nombre === 'admin_taller' && 
    this.authStore.user()?.rol_contexto === 'owner'
  );
  isBranchAdmin = signal(
    this.authStore.user()?.rol_nombre === 'admin_taller' && 
    this.authStore.user()?.rol_contexto === 'admin_sucursal'
  );

  userForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.maxLength(20)]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
    rol_nombre: ['', [Validators.required]],
    id_taller: [null]
  });

  workshopsQuery = injectQuery(() => ({
    queryKey: ['all-workshops'],
    queryFn: () => lastValueFrom(this.workshopsService.getAllWorkshops()),
    enabled: this.isSuperAdmin()
  }));

  showWorkshopSelector(): boolean {
    const rol = this.userForm.get('rol_nombre')?.value;
    return this.isSuperAdmin() && (rol === 'tecnico' || rol === 'admin_taller');
  }

  onWorkshopChange(id: string | null) {
    this.userForm.patchValue({ id_taller: id });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }
}
