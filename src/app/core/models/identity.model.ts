export interface UserLogin {
  correo: string;
  contrasena: string;
}

export interface UserResponse {
  id_usuario: string;
  nombre: string;
  telefono?: string;
  correo: string;
  rol_nombre: string;
  estado: boolean;
  rol_contexto?: string;
  id_taller?: string;
  id_sucursal?: string;
  placas?: string[];
}

export interface VehicleResponse {
  id_vehiculo: string;
  id_usuario: string;
  matricula: string;
  marca: string;
  modelo: string;
  ano: number;
  color?: string | null;
  foto?: string | null;
}

export interface TokenSchema {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface UserProfileUpdate {
  nombre?: string;
  telefono?: string;
}
