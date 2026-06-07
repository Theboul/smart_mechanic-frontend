import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { FinanceService } from '../../data-access/finance.service';
import { MonitoringService } from '@features/monitoring/data-access/monitoring.service';
import { ReportService } from '@features/monitoring/data-access/report.service';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { 
  LucideAngularModule, 
  Download, 
  FileBarChart, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Wrench, 
  CheckCircle2,
  AlertTriangle,
  History
} from 'lucide-angular';
import { PageHeaderComponent, LoadingStateComponent } from '@shared/ui';
import { AiReportAssistantComponent } from '../../components/ai-report-assistant/ai-report-assistant';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { format } from 'date-fns';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    AiReportAssistantComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Generador de Reportes" 
        subtitle="Analiza el rendimiento, comisiones y transacciones con filtros avanzados o Inteligencia Artificial."
        [icon]="historyIcon">
      </app-page-header>

      <div class="generator-layout">
        <!-- Panel de Configuración -->
        <aside class="config-panel">
          <mat-card class="sm-glass-card config-card">
            <div class="card-section">
              <label><lucide-icon [img]="fileIcon" [size]="14"></lucide-icon> Tipo de Reporte</label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-select [ngModel]="selectedType()" (ngModelChange)="selectedType.set($event); onTypeChange()">
                  <mat-option value="operativo">Auxilios Mecánicos (Operativo)</mat-option>
                  <mat-option value="financiero">Liquidación de Comisiones (Financiero)</mat-option>
                  @if (isSuperAdmin()) {
                    <mat-option value="auditoria">Bitácora de Auditoría (Seguridad)</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="card-section">
              <label><lucide-icon [img]="calendarIcon" [size]="14"></lucide-icon> Rango de Fechas</label>
              <form [formGroup]="range" class="full-width">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-date-range-input [rangePicker]="picker">
                    <input matStartDate formControlName="start" placeholder="Desde">
                    <input matEndDate formControlName="end" placeholder="Hasta">
                  </mat-date-range-input>
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-date-range-picker #picker></mat-date-range-picker>
                </mat-form-field>
              </form>
            </div>

            @if (isSuperAdmin() && selectedType() !== 'auditoria') {
              <div class="card-section">
                <label><lucide-icon [img]="wrenchIcon" [size]="14"></lucide-icon> Filtro por Taller</label>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-select [ngModel]="selectedWorkshop()" (ngModelChange)="selectedWorkshop.set($event)">
                    <mat-option [value]="null">Todos los talleres (Global)</mat-option>
                    @for (w of workshopsQuery.data(); track w.id_taller) {
                      <mat-option [value]="w.id_taller">{{ w.nombre }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            }

            <div class="export-actions">
              <button 
                mat-flat-button 
                color="primary" 
                class="export-btn pdf"
                [disabled]="range.invalid || isGenerating()"
                (click)="export('PDF')"
              >
                @if (isGenerating()) { <mat-spinner diameter="20"></mat-spinner> }
                @else { <lucide-icon [img]="downloadIcon" [size]="16"></lucide-icon> Exportar PDF }
              </button>
              
              <button 
                mat-stroked-button 
                class="export-btn excel"
                [disabled]="range.invalid || isGenerating()"
                (click)="export('EXCEL')"
              >
                <lucide-icon [img]="barChartIcon" [size]="16"></lucide-icon> Exportar Excel
              </button>
            </div>
          </mat-card>

          <app-ai-report-assistant
            [isGenerating]="aiMutation.isPending()"
            (generate)="onAiRequest($event)">
          </app-ai-report-assistant>
        </aside>

        <!-- Panel de Vista Previa / Explicación -->
        <main class="preview-panel">
          <mat-card class="sm-glass-card preview-card">
            <div class="report-info">
              @switch (selectedType()) {
                @case ('operativo') {
                  <div class="info-content">
                    @if (workshopsQuery.isLoading()) {
                      <app-loading-state message="Cargando configuración..."></app-loading-state>
                    } @else {
                      <div class="info-header">
                        <lucide-icon [img]="wrenchIcon" [size]="40" class="info-icon purple"></lucide-icon>
                        <div>
                          <h2>Reporte Operativo de Auxilios</h2>
                          <p class="tag operative">DATOS OPERACIONALES</p>
                        </div>
                      </div>
                      <div class="info-body">
                        <p>Este reporte detalla cada servicio de auxilio mecánico gestionado. Es ideal para medir:</p>
                        <ul>
                          <li><lucide-icon [img]="checkIcon" [size]="12"></lucide-icon> Tiempos de respuesta y resolución.</li>
                          <li><lucide-icon [img]="checkIcon" [size]="12"></lucide-icon> Rendimiento de los técnicos por taller.</li>
                          <li><lucide-icon [img]="checkIcon" [size]="12"></lucide-icon> Distribución geográfica de las emergencias.</li>
                        </ul>
                        <div class="data-preview">
                          <span>Columnas: ID, Fecha, Cliente, Técnico, Taller, Prioridad, Estado.</span>
                        </div>
                      </div>
                    }
                  </div>
                }

                @case ('financiero') {
                  <div class="info-content">
                    <div class="info-header">
                      <lucide-icon [img]="barChartIcon" [size]="40" class="info-icon orange"></lucide-icon>
                      <div>
                        <h2>Reporte de Liquidación Contable</h2>
                        <p class="tag financial">DATOS FINANCIEROS</p>
                      </div>
                    </div>
                    <div class="info-body">
                      <p>Reporte contable puro para la conciliación de ingresos y pagos de plataforma.</p>
                      <div class="kpi-preview">
                        <div class="kpi">
                          <span class="l">Base de Comisión</span>
                          <span class="v">10.00 %</span>
                        </div>
                      </div>
                      <ul>
                        <li><lucide-icon [img]="checkIcon" [size]="12"></lucide-icon> Montos totales cobrados (Bs).</li>
                        <li><lucide-icon [img]="checkIcon" [size]="12"></lucide-icon> Desglose de comisiones recaudadas.</li>
                        <li><lucide-icon [img]="checkIcon" [size]="12"></lucide-icon> Balance neto transferible a talleres.</li>
                      </ul>
                    </div>
                  </div>
                }

                @case ('auditoria') {
                  <div class="info-content">
                    <div class="info-header">
                      <lucide-icon [img]="shieldIcon" [size]="40" class="info-icon sapphire"></lucide-icon>
                      <div>
                        <h2>Reporte de Auditoría (Logs)</h2>
                        <p class="tag security">SEGURIDAD Y CUMPLIMIENTO</p>
                      </div>
                    </div>
                    <div class="info-body">
                      <p>Registro histórico de seguridad para auditorías de cumplimiento.</p>
                      <ul>
                        <li><lucide-icon [img]="checkIcon" [size]="12"></lucide-icon> Trazabilidad de cambios de estado críticos.</li>
                        <li><lucide-icon [img]="checkIcon" [size]="12"></lucide-icon> Registro de IPs y navegadores de los actores.</li>
                        <li><lucide-icon [img]="checkIcon" [size]="12"></lucide-icon> Historial de accesos y registros de personal.</li>
                      </ul>
                    </div>
                  </div>
                }
              }
            </div>

            <div class="disclaimer">
              <lucide-icon [img]="alertIcon" [size]="14"></lucide-icon>
              <span>El reporte se generará en base a los filtros seleccionados a la izquierda.</span>
            </div>
          </mat-card>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1300px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }

    .generator-layout { display: grid; grid-template-columns: 380px 1fr; gap: 2rem; align-items: start; }

    .config-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .card-section {
      label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; color: var(--sm-color-text-muted); text-transform: uppercase; margin-bottom: 0.75rem; lucide-icon { color: var(--sm-color-sapphire-400); } }
      .full-width { width: 100%; }
    }

    .export-actions { display: grid; grid-template-columns: 1fr; gap: 0.75rem; margin-top: 1rem; }
    .export-btn { height: 48px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.75rem; 
      &.pdf { background: var(--sm-color-sapphire-600); }
      &.excel { color: #2ecc71; border-color: rgba(46, 204, 113, 0.3); &:hover { background: rgba(46, 204, 113, 0.05); } }
    }

    .preview-card { min-height: 400px; padding: 2.5rem; position: relative; }
    .info-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; 
      h2 { margin: 0; font-size: 1.5rem; font-weight: 800; color: white; }
      .tag { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.05em; margin-top: 0.4rem;
        &.operative { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
        &.financial { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        &.security { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
      }
      .info-icon { &.purple { color: #8b5cf6; } &.orange { color: #f59e0b; } &.sapphire { color: #6366f1; } }
    }

    .info-body {
      p { color: white; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; }
      ul { list-style: none; padding: 0; margin-bottom: 2rem;
        li { display: flex; align-items: center; gap: 0.75rem; color: var(--sm-color-text-soft); font-size: 0.85rem; margin-bottom: 0.6rem; lucide-icon { color: #2ecc71; } }
      }
    }

    .data-preview { background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--sm-color-sapphire-400); span { font-size: 0.75rem; color: var(--sm-color-text-muted); font-family: monospace; } }
    
    .kpi-preview { display: flex; gap: 1rem; margin-bottom: 1.5rem; .kpi { flex: 1; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; display: flex; flex-direction: column; .l { font-size: 0.65rem; color: var(--sm-color-text-muted); font-weight: 700; text-transform: uppercase; } .v { font-size: 1.2rem; font-weight: 800; color: #fbbf24; } } }

    .disclaimer { position: absolute; bottom: 1.5rem; left: 2.5rem; display: flex; align-items: center; gap: 0.5rem; color: var(--sm-color-text-muted); font-size: 0.75rem; font-style: italic; }

    @media (max-width: 900px) { .generator-layout { grid-template-columns: 1fr; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ReportGeneratorPage {
  private financeService = inject(FinanceService);
  private monitoringService = inject(MonitoringService);
  private reportService = inject(ReportService);
  private workshopsService = inject(WorkshopsService);
  private authStore = inject(AuthStore);
  private snackBar = inject(MatSnackBar);

  // Iconos
  protected readonly downloadIcon = Download;
  protected readonly barChartIcon = FileBarChart;
  protected readonly calendarIcon = Calendar;
  protected readonly fileIcon = FileText;
  protected readonly shieldIcon = ShieldCheck;
  protected readonly wrenchIcon = Wrench;
  protected readonly historyIcon = History;
  protected readonly checkIcon = CheckCircle2;
  protected readonly alertIcon = AlertTriangle;

  isGenerating = signal(false);
  selectedType = signal('operativo');
  selectedWorkshop = signal<string | null>(null);

  range = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required]),
  });

  isSuperAdmin = computed(() => this.authStore.user()?.rol_nombre === 'superadmin');

  workshopsQuery = injectQuery(() => ({
    queryKey: ['report-workshops'],
    queryFn: () => lastValueFrom(this.workshopsService.getAllWorkshops()),
    enabled: this.isSuperAdmin()
  }));

  onTypeChange() {
    // Resetear filtros específicos si es necesario
  }

  async export(formatType: 'PDF' | 'EXCEL') {
    const { start, end } = this.range.value;
    if (!start || !end) return;

    this.isGenerating.set(true);
    try {
      let data: unknown[][] | Record<string, unknown>[] = [];
      let columns: string[] = [];
      let filename = `Reporte_${this.selectedType()}`;

      // 1. Obtener los datos según el tipo
      if (this.selectedType() === 'financiero') {
        const raw = await lastValueFrom(this.financeService.getPayments(this.selectedWorkshop() ?? undefined));
        const filtered = raw.filter(p => {
          const d = new Date(p.fecha_pago || new Date());
          return d >= start && d <= end;
        });
        
        columns = ['FECHA', 'ID_INCIDENTE', 'ESTADO', 'MONTO TOTAL', 'COMISIÓN (10%)', 'NETO'];
        data = filtered.map(p => [
          format(new Date(p.fecha_pago || new Date()), 'dd/MM/yyyy HH:mm'),
          p.id_incidente.substring(0,8),
          p.estado_pago,
          `${Number(p.monto).toFixed(2)} Bs`,
          `${Number(p.monto_comision).toFixed(2)} Bs`,
          `${(Number(p.monto) - Number(p.monto_comision)).toFixed(2)} Bs`
        ]);
        
        // Para Excel necesitamos objetos
        if (formatType === 'EXCEL') {
          data = filtered.map(p => ({
            Fecha: format(new Date(p.fecha_pago || new Date()), 'dd/MM/yyyy HH:mm'),
            Incidente: p.id_incidente,
            Estado: p.estado_pago,
            Total: Number(p.monto),
            Comision: Number(p.monto_comision),
            Neto: Number(p.monto) - Number(p.monto_comision)
          }));
        }
      } 
      else if (this.selectedType() === 'operativo') {
        // En un caso real, aquí llamaríamos a MonitoringService.getIncidentHistory()
        // Por ahora simularemos con los datos que tenemos o llamaremos a assignments del taller
        const raw = await lastValueFrom(this.workshopsService.getAssignments()); // Esto es para AdminTaller
        const filtered = raw.filter(i => {
          const d = new Date(i.fecha_reporte || new Date());
          return d >= start && d <= end;
        });

        columns = ['FECHA', 'ID', 'ESTADO', 'PRIORIDAD', 'RESUMEN IA', 'TELÉFONO'];
        data = filtered.map(i => [
          format(new Date(i.fecha_reporte || new Date()), 'dd/MM/yyyy HH:mm'),
          i.id_incidente.substring(0,8),
          i.estado_incidente,
          i.prioridad_incidente,
          i.resumen_ia,
          i.telefono
        ]);

        if (formatType === 'EXCEL') {
          data = filtered.map(i => ({
            Fecha: format(new Date(i.fecha_reporte || new Date()), 'dd/MM/yyyy HH:mm'),
            ID: i.id_incidente,
            Estado: i.estado_incidente,
            Prioridad: i.prioridad_incidente,
            Resumen: i.resumen_ia,
            Telefono: i.telefono
          }));
        }
      }
      else if (this.selectedType() === 'auditoria') {
        const raw = await lastValueFrom(this.monitoringService.getAuditLogs({ page: 1, page_size: 1000 }));
        const items = raw.items || [];
        const filtered = items.filter(l => {
          const d = new Date(l.fecha_hora);
          return d >= start && d <= end;
        });

        columns = ['FECHA', 'USUARIO', 'ACCIÓN', 'DESCRIPCIÓN', 'IP'];
        data = filtered.map(l => [
          format(new Date(l.fecha_hora || new Date()), 'dd/MM/yyyy HH:mm'),
          l.nombre_usuario || 'Desconocido',
          l.accion,
          l.descripcion || '-',
          l.ip
        ]);

        if (formatType === 'EXCEL') {
          data = filtered.map(l => ({
            Fecha: format(new Date(l.fecha_hora || new Date()), 'dd/MM/yyyy HH:mm'),
            Usuario: l.nombre_usuario || 'Desconocido',
            Accion: l.accion,
            Descripcion: l.descripcion || '-',
            IP: l.ip
          }));
        }
      }

      // 2. Exportar
      if (data.length === 0) {
        this.snackBar.open('No hay datos para el periodo seleccionado', 'Cerrar', { duration: 3000 });
        return;
      }

      if (formatType === 'PDF') {
        this.reportService.exportToPDF(
          `Reporte ${this.selectedType()} - Smart Mechanic`,
          columns,
          data as unknown[][],
          filename
        );
      } else {
        this.reportService.exportToExcel(data as Record<string, unknown>[], filename);
      }

      this.snackBar.open('✅ Reporte generado con éxito', 'Cerrar', { duration: 3000 });

    } catch (error) {
      console.error('Error:', error);
      this.snackBar.open('Ocurrió un error al generar el reporte', 'Cerrar', { duration: 5000 });
    } finally {
      this.isGenerating.set(false);
    }
  }

  aiMutation = injectMutation(() => ({
    mutationFn: (prompt: string) => {
      const sessionId = this.authStore.user()?.id_usuario || 'temp-session';
      return lastValueFrom(this.reportService.generateAiReport(prompt, sessionId));
    },
    onSuccess: (blob) => {
      // Forzar el tipo de blob a Excel para asegurar la descarga correcta
      const excelBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_IA_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      this.snackBar.open('✅ Reporte IA descargado con éxito', 'Cerrar', { duration: 3000 });
    },
    onError: (error) => {
      console.error('Error IA Report:', error);
      this.snackBar.open('Error al conectar con el asistente de IA.', 'Cerrar', { duration: 5000 });
    }
  }));

  onAiRequest(prompt: string) {
    this.aiMutation.mutate(prompt);
  }
}
