import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface Appointment {
  id_cita: string;
  id_incidente_origen?: string;
  id_cliente: string;
  id_vehiculo: string;
  id_taller: string;
  id_sucursal: string;
  id_tecnico?: string;
  fecha_hora: string;
  duracion_minutos: number;
  estado: string; // "PENDIENTE_CONFIRMACION", "CONFIRMADA", "REPROGRAMACION_SOLICITADA", "CANCELADA", "COMPLETADA"
  tipo: string;
  motivo: string;
  observaciones?: string;
  prioridad: string; // "BAJA", "MEDIA", "ALTA"
  creado_por: string;
  rol_creador: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  
  // Enriched fields
  cliente_nombre?: string;
  cliente_telefono?: string;
  vehiculo_matricula?: string;
  vehiculo_marca?: string;
  vehiculo_modelo?: string;
  tecnico_nombre?: string;
  sucursal_nombre?: string;
}

export interface SlotAvailability {
  fecha_hora: string;
  disponible: boolean;
  motivo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchedulingService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/scheduling`;

  getSlotsAvailability(sucursalId: string, dateStr: string, tecnicoId?: string): Observable<SlotAvailability[]> {
    const params: any = { id_sucursal: sucursalId, date: dateStr };
    if (tecnicoId) {
      params.id_tecnico = tecnicoId;
    }
    return this.http.get<SlotAvailability[]>(`${this.API_URL}/slots/availability`, { params });
  }

  createAppointment(data: {
    tipo?: string;
    id_incidente_origen?: string;
    id_cliente?: string;
    id_vehiculo: string;
    id_sucursal?: string;
    fecha_hora: string;
    motivo: string;
    observaciones?: string;
    prioridad: string;
    id_tecnico?: string;
  }): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.API_URL}/appointments`, data);
  }

  getWorkshopAppointments(filters: {
    sucursalId?: string;
    estado?: string;
    prioridad?: string;
    tipo?: string;
    search?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    idTecnico?: string;
  } = {}): Observable<Appointment[]> {
    const params: any = {};
    if (filters.sucursalId) params.id_sucursal = filters.sucursalId;
    if (filters.estado && filters.estado !== 'all' && filters.estado !== 'past') params.estado = filters.estado;
    if (filters.prioridad && filters.prioridad !== 'all') params.prioridad = filters.prioridad;
    if (filters.tipo && filters.tipo !== 'all') params.tipo = filters.tipo;
    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.fechaDesde) params.fecha_desde = filters.fechaDesde;
    if (filters.fechaHasta) params.fecha_hasta = filters.fechaHasta;
    if (filters.idTecnico) params.id_tecnico = filters.idTecnico;
    return this.http.get<Appointment[]>(`${this.API_URL}/appointments/workshop`, { params });
  }

  confirmAppointment(appointmentId: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/appointments/${appointmentId}/confirm`, {});
  }

  rescheduleAppointment(appointmentId: string, data: { fecha_hora: string; observaciones?: string }): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/appointments/${appointmentId}/reschedule`, data);
  }

  cancelAppointment(appointmentId: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/appointments/${appointmentId}/cancel`, {});
  }

  completeAppointment(appointmentId: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/appointments/${appointmentId}/complete`, {});
  }
}
