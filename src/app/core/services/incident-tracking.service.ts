import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthStore } from '@features/identity/auth/state/auth.store';

export interface TrackingData {
  latitud: number;
  longitud: number;
  velocidad?: number;
  eta_minutos?: number;
  polyline_ruta?: string;
  timestamp: string;
}

export interface StatusData {
  nuevo_estado: string;
  mensaje: string;
}

export interface WebSocketMessage {
  type: 'TRACKING_UPDATE' | 'STATUS_UPDATE' | 'PING';
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class IncidentTrackingService {
  private authStore = inject(AuthStore);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private socket: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private activeIncidentId: string | null = null;

  /**
   * Conecta al WebSocket de un incidente específico para recibir actualizaciones en tiempo real.
   */
  connect(incidentId: string): Observable<WebSocketMessage> {
    if (!this.isBrowser) {
      return this.messageSubject.asObservable();
    }

    // Si ya estamos conectados al mismo incidente, simplemente retornamos el observable
    if (this.socket && this.activeIncidentId === incidentId) {
      return this.messageSubject.asObservable();
    }

    // Desconectar conexión previa si existiera
    this.disconnect();

    this.activeIncidentId = incidentId;
    const token = this.authStore.accessToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Parsear el host desde apiUrl (que contiene http://localhost:8000/api/v1)
    const url = new URL(environment.apiUrl);
    const host = url.host;
    
    // Construir la URL del WS del incidente
    const wsUrl = `${protocol}//${host}/api/v1/emergencies/ws/incidents/${incidentId}?token=${token || ''}`;
    console.log(`📡 Conectando al WebSocket de tracking: ${wsUrl}`);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`✅ Conexión WebSocket establecida para incidente: ${incidentId}`);
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.messageSubject.next(message);
        } catch (e) {
          console.error('Error al deserializar mensaje WebSocket:', e);
        }
      };

      this.socket.onclose = (event) => {
        console.log(`🔌 WebSocket de incidente cerrado: ${incidentId}`, event);
        this.socket = null;
        
        // Auto-reconexión si seguimos viendo el mismo incidente
        if (this.activeIncidentId === incidentId) {
          setTimeout(() => {
            if (this.activeIncidentId === incidentId) {
              this.connect(incidentId);
            }
          }, 3000);
        }
      };

      this.socket.onerror = (error) => {
        console.error(`❌ Error en WebSocket de incidente: ${incidentId}`, error);
      };

    } catch (e) {
      console.error('Error al iniciar conexión WebSocket:', e);
    }

    return this.messageSubject.asObservable();
  }

  /**
   * Cierra la conexión WebSocket activa.
   */
  disconnect() {
    this.activeIncidentId = null;
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket de incidente...');
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Envía un mensaje PING al WebSocket
   */
  ping() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send('ping');
    }
  }
}
