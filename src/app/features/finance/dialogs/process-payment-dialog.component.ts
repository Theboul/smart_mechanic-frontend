import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, DollarSign, Calculator, Info } from 'lucide-angular';

@Component({
  selector: 'app-process-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    LucideAngularModule
  ],
  template: `
    <div class="dialog-container">
      <header class="dialog-header">
        <div class="icon-box">
          <lucide-icon [img]="calcIcon" [size]="20"></lucide-icon>
        </div>
        <h2>Registrar Cobro de Servicio</h2>
      </header>

      <div class="dialog-content">
        <p class="instruction">Especifica los costos detallados del servicio de auxilio mecánico.</p>
        
        <div class="incident-info">
          <span class="label">Incidente:</span>
          <span class="value">#{{ data.incidentId.substring(0,8) }}</span>
        </div>

        <div class="fields-grid">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Mano de Obra (BOB)</mat-label>
            <input matInput type="number" [(ngModel)]="mano_de_obra" placeholder="0.00" min="0" autofocus />
            <span matPrefix class="currency-prefix">Bs. &nbsp;</span>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Repuestos / Materiales (BOB)</mat-label>
            <input matInput type="number" [(ngModel)]="repuestos" placeholder="0.00" min="0" />
            <span matPrefix class="currency-prefix">Bs. &nbsp;</span>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width-field">
          <mat-label>Observaciones / Diagnóstico</mat-label>
          <textarea matInput [(ngModel)]="observaciones" placeholder="Escribe observaciones o el diagnóstico del servicio..." rows="3"></textarea>
        </mat-form-field>

        <div class="commission-preview" *ngIf="monto > 0">
          <div class="row">
            <span>Monto Total Cobrado</span>
            <span class="val">{{ monto | currency:'BOB':'symbol':'1.2-2' }}</span>
          </div>
          <div class="row">
            <span>Comisión Plataforma (10%)</span>
            <span class="val">- {{ (monto * 0.1) | currency:'BOB':'symbol':'1.2-2' }}</span>
          </div>
          <div class="row total">
            <span>Tu Ingreso Neto</span>
            <span class="val">{{ (monto * 0.9) | currency:'BOB':'symbol':'1.2-2' }}</span>
          </div>
        </div>

        <div class="alert-box">
          <lucide-icon [img]="infoIcon" [size]="14"></lucide-icon>
          <p>Al registrar el cobro, el cliente podrá ver el resumen en su app y pagar usando Stripe.</p>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="onCancel()">CANCELAR</button>
        <button mat-flat-button color="primary" [disabled]="monto <= 0" (click)="onConfirm()">
          <lucide-icon [img]="dollarIcon" [size]="16"></lucide-icon>
          GUARDAR COBRO
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 1.5rem; max-width: 450px; background: #0f172a; color: white; }
    .dialog-header {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;
      .icon-box { background: rgba(var(--sm-rgb-sapphire-400), 0.1); color: var(--sm-color-sapphire-400); padding: 0.5rem; border-radius: 8px; }
      h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: white; }
    }

    .instruction { font-size: 0.85rem; color: var(--sm-color-text-soft); margin-bottom: 1.5rem; line-height: 1.5; }
    
    .incident-info { margin-bottom: 1.5rem; font-size: 0.8rem; .label { color: var(--sm-color-text-muted); margin-right: 0.5rem; } .value { font-weight: 700; color: var(--sm-color-sapphire-400); } }

    .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .form-field { width: 100%; }
    .full-width-field { width: 100%; margin-top: 0.5rem; }
    .currency-prefix { color: var(--sm-color-text-muted); font-weight: 600; }

    .commission-preview {
      background: rgba(255,255,255,0.03); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;
      .row { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--sm-color-text-soft); margin-bottom: 0.5rem; 
        &.total { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem; margin-top: 0.5rem; font-weight: 700; color: #2ecc71; font-size: 0.9rem; }
      }
    }

    .alert-box {
      display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(var(--sm-rgb-sapphire-400), 0.05); border-radius: 6px; color: var(--sm-color-text-soft);
      p { margin: 0; font-size: 0.75rem; line-height: 1.4; b { color: var(--sm-color-sapphire-400); } }
      lucide-icon { color: var(--sm-color-sapphire-400); flex-shrink: 0; }
    }

    .dialog-actions {
      margin-top: 2rem; display: flex; justify-content: flex-end; gap: 0.75rem;
      button { border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    }
  `]
})
export class ProcessPaymentDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<ProcessPaymentDialog>);
  public data = inject<{
    incidentId: string;
    mano_de_obra?: number;
    repuestos?: number;
    observaciones?: string;
  }>(MAT_DIALOG_DATA);

  protected readonly calcIcon = Calculator;
  protected readonly dollarIcon = DollarSign;
  protected readonly infoIcon = Info;

  mano_de_obra: number = 0;
  repuestos: number = 0;
  observaciones: string = '';

  ngOnInit() {
    if (this.data) {
      this.mano_de_obra = this.data.mano_de_obra || 0;
      this.repuestos = this.data.repuestos || 0;
      this.observaciones = this.data.observaciones || '';
    }
  }

  get monto(): number {
    return (this.mano_de_obra || 0) + (this.repuestos || 0);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    this.dialogRef.close({
      monto_total: this.monto,
      mano_de_obra: this.mano_de_obra,
      repuestos: this.repuestos,
      observaciones: this.observaciones
    });
  }
}
