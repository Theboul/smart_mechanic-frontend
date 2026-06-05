import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface PaymentResponse {
  id_pago: string;
  id_incidente: string;
  id_taller: string;
  monto: number;
  monto_comision: number;
  estado_pago: string;
  fecha_pago: string;
}

export interface PaymentCreate {
  monto_total: number;
}

export interface BillingCreate {
  monto_total: number;
  mano_de_obra?: number;
  repuestos?: number;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/finance`;

  /**
   * Procesa el pago de una emergencia y cierra el caso.
   */
  processPayment(incidentId: string, data: PaymentCreate): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.API_URL}/emergencies/${incidentId}/pay`, data);
  }

  /**
   * Registra la facturación/precio final de un incidente.
   */
  registerBilling(incidentId: string, data: BillingCreate): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.API_URL}/emergencies/${incidentId}/billing`, data);
  }

  /**
   * Obtiene reportes de pagos con filtros opcionales.
   * Multi-tenant: AdminTaller solo verá los suyos.
   */
  getPayments(workshopId?: string): Observable<PaymentResponse[]> {
    let params = new HttpParams();
    if (workshopId) {
      params = params.set('workshop_id', workshopId);
    }
    return this.http.get<PaymentResponse[]>(`${this.API_URL}/reports`, { params });
  }

  /**
   * Estadísticas Financieras Agregadas (Simuladas basadas en los reportes)
   */
  getFinancialStats() {
    // Aquí podríamos tener un endpoint real en el backend, 
    // pero por ahora lo calcularemos en el componente a partir de getPayments()
  }
}
