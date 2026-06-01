import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse } from '@core/models/identity.model';
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
  getUsers(tallerId?: string): Observable<UserResponse[]> {
    let params = new HttpParams();
    if (tallerId) {
      params = params.set('id_taller', tallerId);
    }
    return this.http.get<UserResponse[]>(`${this.API_URL}/users`, { params });
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
