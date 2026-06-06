import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { LucideAngularModule, ArrowLeft, BadgeCheck, Link2, User, Car, Building2, Clock3, Phone } from 'lucide-angular';
import { LoadingStateComponent, EmptyStateComponent, PageHeaderComponent } from '@shared/ui';
import { QuotationsService } from '../../data-access/quotations.service';
import { QuotationWorkshopInboxItemResponse } from '../../models/quotation.models';

@Component({
  selector: 'app-quotation-request-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Detalle de Solicitud"
        subtitle="Consulta la informacion completa de la solicitud y las cotizaciones emitidas."
        [icon]="detailIcon"
      >
        <div actions>
          <button mat-stroked-button color="primary" (click)="goBack()">
            <lucide-icon [img]="backIcon" [size]="16"></lucide-icon>
            Volver
          </button>
        </div>
      </app-page-header>

      @if (request(); as requestData) {
        <mat-card class="detail-card sm-glass-card">
          <div class="header">
            <div>
              <span class="state-chip">{{ requestData.estado.replaceAll('_', ' ') }}</span>
              <h3>{{ requestData.descripcion || 'Solicitud sin descripcion' }}</h3>
              <p>{{ requestData.observaciones || 'Sin observaciones.' }}</p>
            </div>
            <div class="header-meta">
              <span>{{ requestData.client_name || 'Cliente sin nombre' }}</span>
              <span>{{ requestData.vehicle_label || 'Vehiculo sin detalle' }}</span>
              <span>Vence {{ formatDate(requestData.fecha_vencimiento) }}</span>
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-item">
              <lucide-icon [img]="userIcon" [size]="16"></lucide-icon>
              <div>
                <span class="label">Cliente</span>
                <span class="value">{{ requestData.client_name || 'Cliente sin nombre' }}</span>
              </div>
            </div>
            <div class="detail-item">
              <lucide-icon [img]="phoneIcon" [size]="16"></lucide-icon>
              <div>
                <span class="label">Telefono</span>
                <span class="value">{{ requestData.client_phone || 'Sin telefono' }}</span>
              </div>
            </div>
            <div class="detail-item">
              <lucide-icon [img]="carIcon" [size]="16"></lucide-icon>
              <div>
                <span class="label">Vehiculo</span>
                <span class="value">{{ requestData.vehicle_label || 'Vehiculo sin detalle' }}</span>
              </div>
            </div>
            <div class="detail-item">
              <lucide-icon [img]="clockIcon" [size]="16"></lucide-icon>
              <div>
                <span class="label">Vigencia</span>
                <span class="value">{{ formatDate(requestData.fecha_vencimiento) }}</span>
              </div>
            </div>
          </div>

          <div class="workshop-list">
            @if (workshopItems().length > 0) {
              @for (workshop of workshopItems(); track workshop.id_sucursal_representante) {
                <span class="workshop-chip">
                  {{ workshop.workshop_name || 'Taller' }} - {{ workshop.branch_name || 'Sucursal' }}
                </span>
              }
            } @else {
              <span class="workshop-chip empty">Sin talleres compatibles cargados.</span>
            }
          </div>
        </mat-card>
      } @else if (inboxQuery.isLoading()) {
        <app-loading-state message="Buscando solicitud..."></app-loading-state>
      } @else {
        <app-empty-state [icon]="emptyIcon" title="Solicitud no encontrada" message="La solicitud no existe o no pertenece a tu taller." />
      }

      <mat-card class="quotes-card sm-glass-card">
        <div class="quotes-header">
          <h3>Cotizaciones emitidas</h3>
          <span>{{ quotesCount() }} propuestas</span>
        </div>

        @if (quotesQuery.isLoading()) {
          <app-loading-state message="Cargando cotizaciones..."></app-loading-state>
        } @else if (quotes().length === 0) {
          <app-empty-state [icon]="emptyIcon" title="Sin cotizaciones" message="Todavia no se registraron propuestas para esta solicitud." />
        } @else {
          <div class="quotes-grid">
            @for (quote of quotes(); track quote.id_cotizacion) {
              <mat-card class="quote-card">
                <div class="quote-top">
                  <div class="quote-state" [class.accepted]="quote.estado.toUpperCase().includes('ACEPT')" [class.rejected]="quote.estado.toUpperCase().includes('RECHAZ') || quote.estado.toUpperCase().includes('CANCEL')">
                    {{ quote.estado.replaceAll('_', ' ') }}
                  </div>
                  <span>{{ formatDateTime(quote.fecha_creacion) }}</span>
                </div>

                <div class="quote-money">
                  <div>
                    <span class="label">Mano de obra</span>
                    <span class="value">{{ quote.mano_obra_estimado | number:'1.2-2' }}</span>
                  </div>
                  <div>
                    <span class="label">Repuestos</span>
                    <span class="value">{{ quote.repuestos_estimado | number:'1.2-2' }}</span>
                  </div>
                  <div>
                    <span class="label">Total</span>
                    <span class="value total">{{ quote.total_estimado | number:'1.2-2' }}</span>
                  </div>
                </div>

                <div class="quote-meta">
                  <div class="meta-item">
                    <lucide-icon [img]="userIcon" [size]="14"></lucide-icon>
                    <span>{{ quote.responder_name || 'Administrador del taller' }}</span>
                  </div>
                  <div class="meta-item">
                    <lucide-icon [img]="buildingIcon" [size]="14"></lucide-icon>
                    <span>{{ quote.workshop_name || 'Taller' }} - {{ quote.branch_name || 'Sucursal' }}</span>
                  </div>
                  <div class="meta-item">
                    <lucide-icon [img]="clockIcon" [size]="14"></lucide-icon>
                    <span>Vence {{ formatDateTime(quote.vigencia_hasta) }}</span>
                  </div>
                </div>

                <div class="quote-meta">
                  <div class="meta-item">
                    <lucide-icon [img]="clockIcon" [size]="14"></lucide-icon>
                    <span>{{ quote.tiempo_estimado_minutos }} min estimados</span>
                  </div>
                </div>

                @if (quote.observaciones) {
                  <p class="observations">{{ quote.observaciones }}</p>
                }

                <div class="quote-actions">
                  @if (quote.id_incidente_generado) {
                    <button mat-stroked-button color="primary" (click)="openIncident(quote.id_incidente_generado)">
                      <lucide-icon [img]="incidentIcon" [size]="16"></lucide-icon>
                      Abrir incidente
                    </button>
                  } @else {
                    <span class="pending-incident">Aun no se genero incidente desde esta cotizacion.</span>
                  }
                </div>
              </mat-card>
            }
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 2rem;
      animation: fadeIn 0.35s ease-out;
    }

    .detail-card, .quotes-card {
      border-radius: 18px;
      padding: 1rem 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .header h3 {
      margin: 0.45rem 0 0;
      color: #fff;
      font-size: 1.08rem;
    }

    .header p {
      margin: 0.35rem 0 0;
      color: var(--sm-color-text-muted, #94a3b8);
      font-size: 0.86rem;
    }

    .state-chip {
      display: inline-flex;
      padding: 0.32rem 0.65rem;
      border-radius: 999px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.24);
      color: #60a5fa;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .header-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;
      color: var(--sm-color-text-muted, #94a3b8);
      font-size: 0.8rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .detail-item {
      display: flex;
      gap: 0.55rem;
      align-items: flex-start;
      padding: 0.8rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .detail-item .label {
      display: block;
      color: var(--sm-color-text-muted, #94a3b8);
      font-size: 0.7rem;
      text-transform: uppercase;
    }

    .detail-item .value {
      display: block;
      color: #fff;
      font-size: 0.82rem;
      font-weight: 600;
      word-break: break-word;
    }

    .workshop-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .workshop-chip {
      padding: 0.38rem 0.7rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: var(--sm-color-text-soft, #cbd5e1);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .workshop-chip.empty {
      opacity: 0.7;
    }

    .quotes-card {
      gap: 0.9rem;
    }

    .quotes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .quotes-header h3 {
      margin: 0;
      color: #fff;
      font-size: 1rem;
    }

    .quotes-header span {
      color: var(--sm-color-text-muted, #94a3b8);
      font-size: 0.8rem;
    }

    .quotes-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .quote-card {
      background: rgba(25, 30, 45, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .quote-top {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      color: var(--sm-color-text-muted, #94a3b8);
      font-size: 0.76rem;
    }

    .quote-state {
      display: inline-flex;
      align-items: center;
      padding: 0.24rem 0.55rem;
      border-radius: 999px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      font-weight: 700;
      text-transform: uppercase;
    }

    .quote-state.accepted { background: rgba(34, 197, 94, 0.12); border-color: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .quote-state.rejected { background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.2); color: #f87171; }

    .quote-money {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .quote-money .label {
      display: block;
      color: var(--sm-color-text-muted, #94a3b8);
      font-size: 0.7rem;
      text-transform: uppercase;
    }

    .quote-money .value {
      display: block;
      color: #fff;
      font-size: 1rem;
      font-weight: 800;
    }

    .quote-money .value.total {
      color: #60a5fa;
    }

    .quote-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem 1rem;
      color: var(--sm-color-text-soft, #cbd5e1);
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
    }

    .observations {
      margin: 0;
      color: var(--sm-color-text-soft, #cbd5e1);
      font-size: 0.84rem;
      line-height: 1.45;
    }

    .quote-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    .pending-incident {
      color: var(--sm-color-text-muted, #94a3b8);
      font-size: 0.78rem;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `],
})
export class QuotationRequestDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(QuotationsService);

  protected readonly detailIcon = BadgeCheck;
  protected readonly backIcon = ArrowLeft;
  protected readonly emptyIcon = BadgeCheck;
  protected readonly incidentIcon = Link2;
  protected readonly userIcon = User;
  protected readonly phoneIcon = Phone;
  protected readonly carIcon = Car;
  protected readonly buildingIcon = Building2;
  protected readonly clockIcon = Clock3;

  requestId = computed(() => this.route.snapshot.paramMap.get('requestId') ?? '');

  inboxQuery = injectQuery(() => ({
    queryKey: ['quotations', 'workshop-inbox'],
    queryFn: () => lastValueFrom(this.service.getWorkshopInbox(true)),
    refetchInterval: 20000,
  }));

  request = computed((): QuotationWorkshopInboxItemResponse['request'] | null => {
    const id = this.requestId();
    const found = this.inboxQuery.data()?.find((item) => item.id_solicitud_cotizacion === id);
    return found?.request ?? null;
  });

  workshopItems = computed(() => {
    const id = this.requestId();
    const found = this.inboxQuery.data()?.find((item) => item.id_solicitud_cotizacion === id);
    return found?.request.compatible_workshops ?? [];
  });

  quotesQuery = injectQuery(() => ({
    queryKey: ['quotations', 'quotes', this.requestId()],
    enabled: !!this.requestId(),
    queryFn: () => lastValueFrom(this.service.getRequestQuotes(this.requestId())),
  }));

  quotes = computed(() => this.quotesQuery.data() ?? []);
  quotesCount = computed(() => this.quotes().length);

  goBack(): void {
    void this.router.navigate(['/quotations']);
  }

  openIncident(id: string): void {
    void this.router.navigate(['/emergencies/details', id]);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
