/**
 * Modelos específicos del paquete admin para CU33.
 * Reutiliza tipos existentes; solo define nuevos si son específicos de admin.
 */

import { TallerResponse, TallerCreate, IncidentResponse } from '@core/models/workshops.model';
import { UserResponse } from '@core/models/identity.model';
import { AuditLog } from '@features/monitoring/models/monitoring.model';

/**
 * Reutiliza TallerResponse como TallerTenant.
 * No duplicar el modelo; es el mismo concepto en el contexto de tenants.
 */
export type TallerTenant = TallerResponse;

/**
 * Reutiliza UserResponse como UsuarioTenant.
 */
export type UsuarioTenant = UserResponse;

/**
 * Reutiliza IncidentResponse como IncidenteTenant.
 */
export type IncidenteTenant = IncidentResponse;

/**
 * Reutiliza AuditLog como BitacoraTenant.
 */
export type BitacoraTenant = AuditLog;

/**
 * Reutiliza TallerCreate para creación de tenants.
 */
export type TallerTenantCreate = TallerCreate;

/**
 * Payload para crear un usuario asociado a un taller/tenant.
 */
export interface TenantUserCreate {
  nombre: string;
  correo: string;
  telefono?: string;
  rol_nombre: string; // 'admin_taller', 'tecnico', 'cliente', etc.
  id_taller: string;
}

/**
 * Métricas operacionales de un taller/tenant.
 * Agregadas desde incidentes y datos del sistema.
 */
export interface MetricaOperacionalTenant {
  totalIncidentes: number;
  incidentesAbiertos: number;
  incidentesCompletados: number;
  prioridadAlta: number;
  prioridadMedia: number;
  prioridadBaja: number;
}

/**
 * Estado consolidado de un tenant para la pantalla de aislamiento.
 */
export interface TenantIsolationState {
  tenant: TallerTenant | null;
  usuarios: UsuarioTenant[];
  tecnicos: UsuarioTenant[];
  incidentes: IncidenteTenant[];
  metricas: MetricaOperacionalTenant;
  bitacora: BitacoraTenant[];
}
