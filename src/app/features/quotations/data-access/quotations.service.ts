import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import {
  QuotationIncidentResponse,
  QuotationRequestCreate,
  QuotationRequestResponse,
  QuotationRequestSelect,
  QuotationResponse,
  QuotationWorkshopInboxItemResponse,
  QuotationWorkshopOption,
  QuotationWorkshopQuoteCreate,
  QuotationWorkshopRejectCreate,
} from '../models/quotation.models';

function buildParams(values: Record<string, string | number | boolean | null | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === '') continue;
    params = params.set(key, String(value));
  }
  return params;
}

@Injectable({
  providedIn: 'root',
})
export class QuotationsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/quotations`;

  searchCompatibleWorkshops(payload: {
    latitud: number;
    longitud: number;
    categoria_servicio?: string | null;
    radius_km?: number;
  }): Observable<QuotationWorkshopOption[]> {
    return this.http.get<QuotationWorkshopOption[]>(`${this.API_URL}/compatibility/search`, {
      params: buildParams(payload),
    });
  }

  createQuotationRequest(payload: QuotationRequestCreate): Observable<QuotationRequestResponse> {
    return this.http.post<QuotationRequestResponse>(`${this.API_URL}/requests`, payload);
  }

  getMyRequests(): Observable<QuotationRequestResponse[]> {
    return this.http.get<QuotationRequestResponse[]>(`${this.API_URL}/requests/me`);
  }

  getRequestQuotes(requestId: string): Observable<QuotationResponse[]> {
    return this.http.get<QuotationResponse[]>(`${this.API_URL}/requests/${requestId}/quotes`);
  }

  selectQuote(requestId: string, payload: QuotationRequestSelect): Observable<QuotationIncidentResponse> {
    return this.http.post<QuotationIncidentResponse>(`${this.API_URL}/requests/${requestId}/select`, payload);
  }

  getWorkshopInbox(globalView = true): Observable<QuotationWorkshopInboxItemResponse[]> {
    const params = globalView ? buildParams({ id_sucursal: 'global' }) : undefined;
    return this.http.get<QuotationWorkshopInboxItemResponse[]>(`${this.API_URL}/workshop/inbox`, { params });
  }

  createWorkshopQuote(requestId: string, payload: QuotationWorkshopQuoteCreate): Observable<QuotationResponse> {
    return this.http.post<QuotationResponse>(`${this.API_URL}/workshop/${requestId}/quote`, payload);
  }

  rejectWorkshopRequest(
    requestId: string,
    payload: QuotationWorkshopRejectCreate = {},
  ): Observable<QuotationWorkshopInboxItemResponse> {
    return this.http.post<QuotationWorkshopInboxItemResponse>(`${this.API_URL}/workshop/${requestId}/reject`, payload);
  }
}
