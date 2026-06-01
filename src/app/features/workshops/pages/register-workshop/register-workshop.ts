import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkshopForm } from '../../components/workshop-form/workshop-form';
import { TallerCreate, TallerResponse } from '@core/models/workshops.model';
import { WorkshopsService } from '../../data-access/workshops.service';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent, LoadingStateComponent } from '@shared/ui';
import { LucideAngularModule, Building2, Phone, Mail, MapPin, Edit3, X, Check } from 'lucide-angular';

@Component({
  selector: 'app-register-workshop-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule, 
    WorkshopForm, 
    MatSnackBarModule, 
    MatButtonModule, 
    LucideAngularModule, 
    PageHeaderComponent, 
    LoadingStateComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Gestionar mi Taller" 
        subtitle="Visualiza y edita la información de tu taller afiliado."
        [icon]="workshopIcon">
      </app-page-header>

      @if (myWorkshopQuery.isLoading()) {
        <div class="loading-state-wrapper">
          <app-loading-state message="Sincronizando información..."></app-loading-state>
        </div>
      } @else if (myWorkshopQuery.data() && !editMode()) {
        <!-- Vista del taller registrado (Read-Only Mode) -->
        <div class="workshop-details-card sm-glass-card">
          <div class="details-header">
            <h2 class="workshop-title">{{ myWorkshopQuery.data()?.nombre }}</h2>
            <span class="status-dot-chip active">
              <span class="dot"></span>
              Activo
            </span>
          </div>
          
          <div class="details-divider"></div>

          <div class="details-content">
            <div class="details-row-double">
              <div class="detail-item">
                <span class="detail-label">
                  <lucide-icon [img]="buildingIcon" [size]="14"></lucide-icon>
                  NIT
                </span>
                <span class="detail-value">{{ myWorkshopQuery.data()?.nit }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">
                  <lucide-icon [img]="phoneIcon" [size]="14"></lucide-icon>
                  Teléfono
                </span>
                <span class="detail-value">{{ myWorkshopQuery.data()?.telefono || 'N/A' }}</span>
              </div>
            </div>

            <div class="details-divider"></div>

            <div class="detail-item">
              <span class="detail-label">
                <lucide-icon [img]="mailIcon" [size]="14"></lucide-icon>
                Email
              </span>
              <span class="detail-value">{{ myWorkshopQuery.data()?.email || 'N/A' }}</span>
            </div>

            <div class="details-divider"></div>

            <div class="detail-item">
              <span class="detail-label">
                <lucide-icon [img]="mapPinIcon" [size]="14"></lucide-icon>
                Dirección
              </span>
              <span class="detail-value">{{ myWorkshopQuery.data()?.direccion || 'N/A' }}</span>
            </div>
          </div>

          <div class="details-footer">
            <button mat-flat-button class="btn-edit" (click)="enableEditMode()">
              <lucide-icon [img]="editIcon" [size]="16"></lucide-icon>
              Editar datos del taller
            </button>
          </div>
        </div>
      } @else {
        <!-- Formulario de Registro o Edición (Edit Mode) -->
        <div class="workshop-form-card sm-glass-card">
          @if (mutation.isPending() || updateMutation.isPending()) {
            <div class="loading-overlay">
              <app-loading-state message="Guardando taller..."></app-loading-state>
            </div>
          }
          
          @if (editMode()) {
            <div class="edit-mode-header">
              <div class="header-left">
                <lucide-icon [img]="editIcon" [size]="18" class="edit-icon-title"></lucide-icon>
                <h3>Modo edición</h3>
                <span class="edit-dot"></span>
              </div>
              <button mat-stroked-button class="btn-cancel-header" (click)="cancelEdit()">
                <lucide-icon [img]="cancelIcon" [size]="14"></lucide-icon>
                Cancelar
              </button>
            </div>
          }

          <app-workshop-form 
            [initialData]="myWorkshopQuery.data() || null"
            (save)="onSave($event)"
            (cancel)="cancelEdit()">
          </app-workshop-form>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
      animation: fadeIn 0.4s ease-out;
    }
    .loading-state-wrapper {
      padding: 4rem 0;
    }
    .workshop-details-card, .workshop-form-card {
      background: rgba(255, 255, 255, 0.02) !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      border-radius: 16px !important;
      padding: 2rem 2.25rem;
      position: relative;
      overflow: hidden;
    }
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(10, 14, 23, 0.85);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      backdrop-filter: blur(4px);
    }
    
    /* Vista Detalles */
    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .workshop-title {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 700;
      color: #3b82f6; /* Celeste/Azul Rayo McQueen original */
    }
    .status-dot-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(46, 204, 113, 0.1);
      color: #2ecc71;
      border: 1px solid rgba(46, 204, 113, 0.15);
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #2ecc71;
        box-shadow: 0 0 6px #2ecc71;
      }
    }
    .details-divider {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      margin: 1.25rem 0;
    }
    .details-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .details-row-double {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .detail-label {
      font-size: 0.7rem;
      color: var(--sm-color-text-muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      lucide-icon {
        color: var(--sm-color-text-muted);
      }
    }
    .detail-value {
      font-size: 1rem;
      color: var(--sm-color-text-main);
      font-weight: 500;
    }
    .details-footer {
      margin-top: 1.75rem;
      display: flex;
      justify-content: flex-end;
      .btn-edit {
        background: #3b82f6 !important;
        color: white !important;
        padding: 0.5rem 1.5rem !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 0.85rem !important;
        height: 40px !important;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .btn-edit:hover {
        background: #2563eb !important;
      }
    }

    /* Edit Mode Header */
    .edit-mode-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.75rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      
      .header-left {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        
        .edit-icon-title {
          color: #3b82f6;
        }
        h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: white;
        }
        .edit-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 6px #f59e0b;
          margin-left: 0.15rem;
        }
      }
      
      .btn-cancel-header {
        border-radius: 20px !important;
        font-weight: 600 !important;
        font-size: 0.8rem !important;
        color: var(--sm-color-text-muted) !important;
        border-color: rgba(255,255,255,0.08) !important;
        height: 34px !important;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: transparent;
      }
      .btn-cancel-header:hover {
        color: white !important;
        background: rgba(255,255,255,0.03) !important;
        border-color: rgba(255,255,255,0.15) !important;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 600px) {
      .details-row-double { grid-template-columns: 1fr; gap: 1rem; }
      .workshop-details-card, .workshop-form-card { padding: 1.5rem; }
    }
  `]
})
export class RegisterWorkshop {
  private workshopsService = inject(WorkshopsService);
  private snackBar = inject(MatSnackBar);
  readonly workshopIcon = Building2;
  private queryClient = injectQueryClient();

  editMode = signal(false);

  // Iconos
  protected readonly buildingIcon = Building2;
  protected readonly phoneIcon = Phone;
  protected readonly mailIcon = Mail;
  protected readonly mapPinIcon = MapPin;
  protected readonly editIcon = Edit3;
  protected readonly cancelIcon = X;
  protected readonly checkIcon = Check;

  myWorkshopQuery = injectQuery(() => ({
    queryKey: ['my-workshop'],
    queryFn: () => lastValueFrom(this.workshopsService.getMyWorkshop()),
    retry: false,
  }));

  mutation = injectMutation(() => ({
    mutationFn: (data: TallerCreate) => lastValueFrom(this.workshopsService.createWorkshop(data)),
    onSuccess: () => {
      this.snackBar.open('✅ Taller registrado con éxito', 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['my-workshop'] });
    },
    onError: (error) => {
      this.snackBar.open('❌ Error al registrar el taller', 'Cerrar', { duration: 5000 });
      console.error('Error mutation:', error);
    }
  }));

  updateMutation = injectMutation(() => ({
    mutationFn: (data: TallerCreate) => lastValueFrom(this.workshopsService.updateMyWorkshop(data)),
    onSuccess: () => {
      this.snackBar.open('✅ Datos del taller actualizados con éxito', 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['my-workshop'] });
      this.editMode.set(false);
    },
    onError: (error) => {
      this.snackBar.open('❌ Error al actualizar el taller', 'Cerrar', { duration: 5000 });
      console.error('Error update mutation:', error);
    }
  }));

  enableEditMode() {
    this.editMode.set(true);
  }

  cancelEdit() {
    this.editMode.set(false);
  }

  onSave(data: TallerCreate) {
    if (this.editMode()) {
      this.updateMutation.mutate(data);
    } else {
      this.mutation.mutate(data);
    }
  }
}
