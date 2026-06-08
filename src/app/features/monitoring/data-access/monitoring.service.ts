import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';
import {
  AuditLog,
  AuditLogFilters,
  AuditLogPage,
  GlobalStats,
  OperationalDashboardFilters,
  OperationalDashboardResponse,
  SlaAlertsFilters,
  SlaAlertsResponse,
} from '../models/monitoring.model';
import { TallerResponse } from '@core/models/workshops.model';
import { IncidentDetailResponse } from '@core/models/emergencies.model';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private http = inject(HttpClient);
  
  // Endpoints distribuidos en el backend actual
  private monitoringUrl = `${environment.apiUrl}/monitoring`;
  private auditUrl = `${environment.apiUrl}/identity/audit`;
  private workshopsUrl = `${environment.apiUrl}/workshops`;

  /**
   * CU22: Obtener estadísticas para el Centro de Mando
   */
  getGlobalStats(): Observable<GlobalStats> {
    return this.http.get<GlobalStats>(`${this.monitoringUrl}/stats`).pipe(
      map(stats => ({
        ...stats,
        rendimiento_operativo: stats.rendimiento_operativo || {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Comisiones (Bs)',
              data: [1200, 1900, 1700, 2800, 2400, 3900]
            },
            {
              label: 'Incidentes',
              data: [45, 52, 48, 70, 65, 95]
            }
          ]
        },
        puntos_calor: stats.puntos_calor || [
          [-17.7833, -63.1821, 0.9],
          [-17.7850, -63.1800, 0.6],
          [-17.7800, -63.1900, 1.0],
          [-17.7900, -63.1700, 0.8],
          [-17.7700, -63.1850, 0.7],
          [-17.8000, -63.1600, 0.5],
          [-17.7600, -63.2000, 0.4]
        ]
      }))
    );
  }

  getOperationalDashboard(
    filters: OperationalDashboardFilters = {},
  ): Observable<OperationalDashboardResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== '' && value !== null && value !== undefined) {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<OperationalDashboardResponse>(
      `${this.monitoringUrl}/operational/dashboard`,
      { params }
    );
  }

  getSlaAlerts(filters: SlaAlertsFilters = {}): Observable<SlaAlertsResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== '' && value !== null && value !== undefined) {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<SlaAlertsResponse>(
      `${this.monitoringUrl}/operational/sla-alerts`,
      { params }
    );
  }

  /**
   * CU24: Consultar bitácora de auditoría con filtros y paginación
   */
  getAuditLogs(filters: AuditLogFilters = {}): Observable<AuditLogPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== '' && value !== null && value !== undefined) {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<AuditLogPage>(`${this.auditUrl}/logs`, { params });
  }

  /**
   * CU21: Listado maestro de talleres para el SuperAdmin
   */
  getAllWorkshops(): Observable<TallerResponse[]> {
    // Nota: El backend actual tiene GET /workshops/ que devuelve la lista
    return this.http.get<TallerResponse[]>(this.workshopsUrl);
  }

  /**
   * CU21: Cambiar estado de activación de un taller
   */
  toggleWorkshopStatus(workshopId: string): Observable<TallerResponse> {
    return this.http.patch<TallerResponse>(`${this.workshopsUrl}/${workshopId}/status`, {});
  }

  /**
   * CU23: Consultar historial global de servicios (paginación client-side)
   */
  getGlobalHistory(): Observable<IncidentDetailResponse[]> {
    return this.http.get<IncidentDetailResponse[]>(`${environment.apiUrl}/emergencies/`);
  }
}
