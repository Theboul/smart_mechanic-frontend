import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { IncidentResponse } from '@core/models/workshops.model';

@Injectable({
  providedIn: 'root'
})
export class EmergenciesService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/emergencies`;

  getAllIncidents(page?: number, size?: number): Observable<IncidentResponse[]> {
    let url = `${this.API_URL}/`;
    let params: any = {};
    if (page !== undefined && page !== null && size !== undefined && size !== null) {
      params.page = page.toString();
      params.size = size.toString();
    }
    return this.http.get<IncidentResponse[]>(url, { params });
  }

  /**
   * Obtiene el detalle de un incidente
   */
  getIncidentById(id: string): Observable<IncidentResponse> {
    return this.http.get<IncidentResponse>(`${this.API_URL}/${id}`);
  }

  overrideVerification(id: string, motivo: string): Observable<IncidentResponse> {
    return this.http.post<IncidentResponse>(`${this.API_URL}/${id}/override-verification`, { motivo });
  }
}
