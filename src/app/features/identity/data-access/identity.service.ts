import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse, VehicleResponse } from '@core/models/identity.model';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class IdentityService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/identity`;

  /**
   * Obtiene la lista de usuarios con filtros opcionales.
   * @param tallerId ID del taller para filtrar (opcional para SuperAdmin)
   */
  getUsers(filters: { tallerId?: string; idSucursal?: string; role?: string } = {}): Observable<UserResponse[]> {
    let params = new HttpParams();
    if (filters.tallerId) {
      params = params.set('id_taller', filters.tallerId);
    }
    if (filters.idSucursal) {
      params = params.set('id_sucursal', filters.idSucursal);
    }
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    return this.http.get<UserResponse[]>(`${this.API_URL}/users`, { params });
  }

  getUserVehicles(userId: string): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${this.API_URL}/users/${userId}/vehicles`);
  }

  /**
   * Cambia el estado de un usuario (Activar/Desactivar)
   */
  toggleUserStatus(userId: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.API_URL}/users/${userId}/status`, {});
  }

  /**
   * Crea un nuevo usuario (Uso administrativo)
   */
  createUser(userData: any): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.API_URL}/users/`, userData);
  }

  /**
   * Obtiene el perfil del usuario autenticado actual
   */
  getMyProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.API_URL}/users/me`);
  }
}
