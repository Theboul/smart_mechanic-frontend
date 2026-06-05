export interface EvidenceResponse {
  id_evidencia: string;
  id_incidente: string;
  tipo_archivo: 'IMAGEN' | 'AUDIO';
  url_archivo: string;
  fecha_subida: string;
}

export interface AnalysisResponse {
  id_analisis: string;
  id_incidente: string;
  resumen_ia: string;
  objetos_detectados: string[]; // Ej: ["faro roto", "parachoques abollado"]
  severidad_estimada: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  costo_estimado_min: number;
  costo_estimado_max: number;
  fecha_analisis: string;
}

export interface IncidentDetailResponse {
  id_incidente: string;
  id_vehiculo: string;
  id_taller: string | null;
  id_sucursal?: string | null;
  branch_name?: string | null;
  descripcion: string | null;
  telefono: string | null;
  estado_incidente: string;
  prioridad_incidente: string;
  latitud: number;
  longitud: number;
  transcripcion_audio: string | null;
  resumen_ia: string | null;
  analisis_consolidado: string | null;
  fecha_reporte?: string;
  evidencias: EvidenceResponse[];
}
