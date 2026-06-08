import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { 
  TallerCreate, 
  TallerResponse, 
  IncidentResponse, 
  StatusUpdate, 
  TecnicoCreate, 
  TecnicoResponse, 
  IncidentAccept,
  SucursalCreate,
  SucursalResponse,
  AsignarAdminSucursal 
} from '@core/models/workshops.model';

@Injectable({
  providedIn: 'root'
})
export class WorkshopsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/workshops`;

  /**
   * Registra un nuevo taller (Admin Taller)
   */
  createWorkshop(data: TallerCreate): Observable<TallerResponse> {
    return this.http.post<TallerResponse>(`${this.API_URL}/`, data);
  }

  /**
   * Lista todos los talleres registrados (Solo SuperAdmin)
   */
  getAllWorkshops(): Observable<TallerResponse[]> {
    return this.http.get<TallerResponse[]>(`${this.API_URL}`);
  }

  /**
   * Obtiene el taller asociado al usuario logueado
   */
  getMyWorkshop(): Observable<TallerResponse> {
    return this.http.get<TallerResponse>(`${this.API_URL}/me`);
  }

  /**
   * Actualiza el taller asociado al usuario logueado
   */
  updateMyWorkshop(data: TallerCreate): Observable<TallerResponse> {
    return this.http.put<TallerResponse>(`${this.API_URL}/me`, data);
  }

  /**
   * Obtiene las asignaciones de un taller específico
   */
  getAssignments(): Observable<IncidentResponse[]> {
    return this.http.get<IncidentResponse[]>(`${this.API_URL}/me/assignments`);
  }

  /**
   * Actualiza el estado de un incidente asignado
   */
  updateIncidentStatus(incidentId: string, status: StatusUpdate): Observable<IncidentResponse> {
    return this.http.patch<IncidentResponse>(`${this.API_URL}/me/assignments/${incidentId}/status`, status);
  }

  /**
   * Cambia el estado de un taller (Activar/Desactivar)
   */
  toggleWorkshopStatus(workshopId: string): Observable<TallerResponse> {
    return this.http.patch<TallerResponse>(`${this.API_URL}/${workshopId}/status`, {});
  }

  // --- Gestión de Técnicos ---

  getTechnicians(): Observable<TecnicoResponse[]> {
    return this.http.get<TecnicoResponse[]>(`${this.API_URL}/me/technicians`);
  }

  createTechnician(data: TecnicoCreate): Observable<TecnicoResponse> {
    return this.http.post<TecnicoResponse>(`${this.API_URL}/me/technicians`, data);
  }

  updateTechnician(id: string, data: Partial<TecnicoCreate>): Observable<TecnicoResponse> {
    return this.http.put<TecnicoResponse>(`${this.API_URL}/me/technicians/${id}`, data);
  }

  toggleTechnicianStatus(id: string): Observable<TecnicoResponse> {
    return this.http.patch<TecnicoResponse>(`${this.API_URL}/me/technicians/${id}/status`, {});
  }

  // --- Aceptar/Rechazar Asignaciones ---

  acceptIncident(incidentId: string, data: IncidentAccept): Observable<IncidentResponse> {
    return this.http.post<IncidentResponse>(`${this.API_URL}/me/assignments/${incidentId}/accept`, data);
  }

  rejectIncident(incidentId: string): Observable<IncidentResponse> {
    return this.http.post<IncidentResponse>(`${this.API_URL}/me/assignments/${incidentId}/reject`, {});
  }

  // --- Gestión de Sucursales (PWA Multi-Tenant) ---

  getBranches(): Observable<SucursalResponse[]> {
    return this.http.get<SucursalResponse[]>(`${this.API_URL}/me/branches`);
  }

  getBranchesByWorkshop(workshopId: string): Observable<SucursalResponse[]> {
    return this.http.get<SucursalResponse[]>(`${this.API_URL}/${workshopId}/branches`);
  }

  createBranch(data: SucursalCreate): Observable<SucursalResponse> {
    return this.http.post<SucursalResponse>(`${this.API_URL}/me/branches`, data);
  }

  updateBranch(id: string, data: SucursalCreate): Observable<SucursalResponse> {
    return this.http.put<SucursalResponse>(`${this.API_URL}/me/branches/${id}`, data);
  }

  toggleBranchStatus(id: string): Observable<SucursalResponse> {
    return this.http.delete<SucursalResponse>(`${this.API_URL}/me/branches/${id}`);
  }

  assignBranchAdmin(data: AsignarAdminSucursal): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/me/branches/assign-admin`, data);
  }

  getMyBranch(): Observable<SucursalResponse> {
    return this.http.get<SucursalResponse>(`${this.API_URL}/me/my-branch`);
  }

  updateMyBranchLocal(data: SucursalCreate): Observable<SucursalResponse> {
    return this.http.put<SucursalResponse>(`${this.API_URL}/me/my-branch`, data);
  }
}
