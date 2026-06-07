/**
 * Servicio coordinador para CU33: Gestionar tenants y aislamiento de información.
 * Reutiliza servicios existentes y proporciona métodos de alto nivel para el componente.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

// Reutilizar servicios existentes
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { IdentityService } from '@features/identity/data-access/identity.service';
import { EmergenciesService } from '@features/emergencies/data-access/emergencies.service';
import { MonitoringService } from '@features/monitoring/data-access/monitoring.service';

// Modelos del admin
import {
  TallerTenant,
  TallerTenantCreate,
  UsuarioTenant,
  IncidenteTenant,
  BitacoraTenant,
  MetricaOperacionalTenant,
  TenantUserCreate,
} from '../admin.models';

@Injectable({
  providedIn: 'root'
})
export class GestionTenantsAislamientoService {
  // Inyectar servicios existentes
  private workshopsService = inject(WorkshopsService);
  private identityService = inject(IdentityService);
  private emergenciesService = inject(EmergenciesService);
  private monitoringService = inject(MonitoringService);
  private http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  /**
   * CU33 - Listar todos los talleres/tenants (visible solo para SuperAdmin)
   * Reutiliza WorkshopsService.getAllWorkshops()
   */
  getTenants(): Observable<TallerTenant[]> {
    return this.workshopsService.getAllWorkshops();
  }

  /**
   * CU33 - Crear nuevo taller/tenant si el backend lo soporta
   * Reutiliza WorkshopsService.createWorkshop()
   */
  createTenant(data: TallerTenantCreate): Observable<TallerTenant> {
    return this.workshopsService.createWorkshop(data);
  }

  /**
   * CU33 - Actualizar taller/tenant si el backend lo soporta
   * Nota: WorkshopsService.updateMyWorkshop() es para "mi taller" (contexto de admin_taller).
   * Este método intenta PUT /workshops/{id} que es la ruta esperada para SuperAdmin.
   */
  updateTenant(id: string, data: TallerTenantCreate): Observable<TallerTenant> {
    // Endpoint esperado: PUT /workshops/{id}
    // Comentario: Si el backend aún no implementa esto, marcar como TODO.
    return this.http.put<TallerTenant>(`${this.apiUrl}/workshops/${id}`, data);
  }

  /**
   * CU33 - Activar/desactivar taller/tenant
   * Reutiliza WorkshopsService.toggleWorkshopStatus()
   */
  toggleTenantStatus(id: string): Observable<TallerTenant> {
    return this.workshopsService.toggleWorkshopStatus(id);
  }

  /**
   * CU33 - Obtener usuarios asociados a un taller/tenant
   * Reutiliza IdentityService.getUsers()
   */
  getTenantUsers(tenantId: string, role?: string): Observable<UsuarioTenant[]> {
    const filters: any = { tallerId: tenantId };
    if (role) {
      filters.role = role;
    }
    return this.identityService.getUsers(filters);
  }

  /**
   * CU33 - Crear usuario asociado a un taller/tenant
   * Reutiliza IdentityService.createUser()
   */
  createTenantUser(payload: TenantUserCreate): Observable<UsuarioTenant> {
    return this.identityService.createUser(payload);
  }

  /**
   * CU33 - Obtener técnicos asociados a un taller/tenant
   * Filtra usuarios con rol 'tecnico' del taller especificado.
   */
  getTenantTechnicians(tenantId: string): Observable<UsuarioTenant[]> {
    return this.getTenantUsers(tenantId, 'tecnico');
  }

  /**
   * CU33 - Obtener incidentes asociados a un taller/tenant
   * Reutiliza EmergenciesService.getAllIncidents() y filtra por id_taller.
   * Nota: Si el backend no soporta filtrado por query params, esto debe implementarse aquí.
   */
  getTenantIncidents(tenantId: string): Observable<IncidenteTenant[]> {
    // Endpoint esperado: GET /emergencies?id_taller={id}
    // Alternativa: GET /emergencies/ retorna todos y filtramos en el cliente.
    const params = new HttpParams().set('id_taller', tenantId);
    return this.http.get<IncidenteTenant[]>(`${this.apiUrl}/emergencies`, { params });
  }

  /**
   * CU33 - Obtener bitácora/auditoria del taller/tenant
   * Reutiliza MonitoringService.getAuditLogs()
   */
  getTenantLogs(tenantId: string): Observable<BitacoraTenant[]> {
    return this.monitoringService.getAuditLogs({ id_taller: tenantId });
  }

  /**
   * CU33 - Calcular métricas operacionales del taller/tenant
   * Basadas en incidentes del taller.
   */
  calculateTenantMetrics(incidents: IncidenteTenant[]): MetricaOperacionalTenant {
    const total = incidents.length;
    const abiertos = incidents.filter(
      i => i.estado_incidente && !['COMPLETADO', 'FINALIZADO', 'CANCELADO'].includes(i.estado_incidente)
    ).length;
    const completados = incidents.filter(
      i => ['COMPLETADO', 'FINALIZADO'].includes(i.estado_incidente)
    ).length;
    const prioridadAlta = incidents.filter(
      i => i.prioridad_incidente?.toLowerCase() === 'alta'
    ).length;
    const prioridadMedia = incidents.filter(
      i => i.prioridad_incidente?.toLowerCase() === 'media'
    ).length;
    const prioridadBaja = incidents.filter(
      i => i.prioridad_incidente?.toLowerCase() === 'baja'
    ).length;

    return {
      totalIncidentes: total,
      incidentesAbiertos: abiertos,
      incidentesCompletados: completados,
      prioridadAlta,
      prioridadMedia,
      prioridadBaja,
    };
  }
}
