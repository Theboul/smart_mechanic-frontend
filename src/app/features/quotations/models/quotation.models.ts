export type QuotationPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type QuotationRequestState = string;
export type QuotationQuoteState = string;
export type QuotationEnvironmentState = string;

export interface QuotationWorkshopOption {
  id_taller: string;
  id_sucursal_representante: string;
  workshop_name?: string | null;
  branch_name?: string | null;
  distancia_km?: number | string | null;
}

export interface QuotationRequestCreate {
  id_vehiculo: string;
  latitud: number;
  longitud: number;
  descripcion?: string | null;
  observaciones?: string | null;
  prioridad?: QuotationPriority;
  categoria_servicio?: string | null;
  radius_km?: number;
}

export interface QuotationRequestSelect {
  id_cotizacion: string;
}

export interface QuotationWorkshopQuoteCreate {
  mano_obra_estimado: number;
  repuestos_estimado: number;
  total_estimado: number;
  tiempo_estimado_minutos: number;
  observaciones?: string | null;
  vigencia_horas?: number;
}

export interface QuotationWorkshopRejectCreate {
  motivo?: string | null;
}

export interface QuotationRequestResponse {
  id_solicitud_cotizacion: string;
  id_cliente: string;
  id_vehiculo: string;
  client_name?: string | null;
  client_phone?: string | null;
  vehicle_label?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_plate?: string | null;
  descripcion?: string | null;
  observaciones?: string | null;
  prioridad: QuotationPriority | string;
  categoria_servicio?: string | null;
  estado: QuotationRequestState;
  fecha_vencimiento: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  compatible_workshops: QuotationWorkshopOption[];
}

export interface QuotationWorkshopInboxItemResponse {
  id_solicitud_taller: string;
  id_solicitud_cotizacion: string;
  id_taller: string;
  id_sucursal_representante: string;
  workshop_name?: string | null;
  branch_name?: string | null;
  estado_envio: QuotationEnvironmentState;
  fecha_envio: string;
  fecha_actualizacion: string;
  request: QuotationRequestResponse;
}

export interface QuotationResponse {
  id_cotizacion: string;
  id_solicitud_cotizacion: string;
  id_solicitud_taller: string;
  id_taller: string;
  id_sucursal_representante: string;
  id_admin_responde: string;
  mano_obra_estimado: number | string;
  repuestos_estimado: number | string;
  total_estimado: number | string;
  tiempo_estimado_minutos: number;
  observaciones?: string | null;
  vigencia_hasta: string;
  estado: QuotationQuoteState;
  id_incidente_generado?: string | null;
  fecha_creacion: string;
  fecha_modificacion: string;
  workshop_name?: string | null;
  branch_name?: string | null;
  responder_name?: string | null;
}

export interface QuotationIncidentResponse {
  id_incidente: string;
  id_taller?: string | null;
  id_sucursal?: string | null;
  id_cotizacion_origen?: string | null;
  origen?: string | null;
  estado_incidente: string;
  prioridad_incidente: string;
}
