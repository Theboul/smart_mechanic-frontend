import { Component, inject, PLATFORM_ID, effect, OnDestroy } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EmergenciesService } from '../../data-access/emergencies.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom, Subscription } from 'rxjs';
import { IncidentDetailsCard } from '../../components/incident-details-card/incident-details-card';
import { EvidenceViewer } from '../../components/evidence-viewer/evidence-viewer';
import { AiAnalysisPanel } from '../../components/ai-analysis-panel/ai-analysis-panel';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent, LoadingStateComponent } from '@shared/ui';
import { LucideAngularModule, Siren, Map as MapIcon, Compass } from 'lucide-angular';
import { GoogleMapsModule } from '@angular/google-maps';
import { environment } from '@env/environment';
import { IncidentTrackingService, WebSocketMessage } from '@core/services/incident-tracking.service';

@Component({
  selector: 'app-incident-details-page',
  standalone: true,
  imports: [
    CommonModule, 
    IncidentDetailsCard, 
    EvidenceViewer, 
    AiAnalysisPanel,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    LoadingStateComponent,
    LucideAngularModule,
    GoogleMapsModule
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Detalles del Incidente" 
        subtitle="Información detallada y análisis de la emergencia mecánica en tiempo real."
        [icon]="sirenIcon">
        <button prefix mat-icon-button (click)="goBack()" aria-label="Volver">
          <mat-icon>arrow_back</mat-icon>
        </button>
      </app-page-header>

      @if (incidentQuery.isPending()) {
        <app-loading-state message="Consultando detalles del incidente..."></app-loading-state>
      } @else if (incidentQuery.isError()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>No se pudo cargar la información. El incidente no existe o no tienes permisos.</p>
          <button mat-flat-button color="primary" (click)="incidentQuery.refetch()">Reintentar</button>
        </div>
      } @else {
        <div class="details-layout">
          <div class="main-column">
            <div class="card">
              <app-incident-details-card [incident]="incidentQuery.data()!"></app-incident-details-card>
            </div>
            
            <div class="card">
              <app-evidence-viewer [evidences]="incidentQuery.data()!.evidencias"></app-evidence-viewer>
            </div>
          </div>

          <div class="side-column">
            <!-- Google Maps Card -->
            <div class="card map-card">
              <div class="map-header">
                <div class="title-section">
                  <lucide-icon [img]="mapIcon" [size]="16"></lucide-icon>
                  <span>Seguimiento de Asistencia</span>
                </div>
                
                @if (etaMinutos !== null) {
                  <span class="eta-badge">
                    <lucide-icon [img]="compassIcon" [size]="12" class="spin"></lucide-icon>
                    Llega en {{ etaMinutos }} min
                  </span>
                }
              </div>
              
              <div class="details-map-container">
                @if (mapsLoaded) {
                  <google-map 
                    height="100%" 
                    width="100%" 
                    [center]="mapCenter" 
                    [zoom]="mapZoom" 
                    [options]="mapOptions">
                    
                    <!-- Marcador de la Emergencia -->
                    <map-marker 
                      [position]="mapCenter" 
                      [options]="incidentMarkerOptions">
                    </map-marker>

                    <!-- Marcador del Técnico en ruta -->
                    @if (techPosition) {
                      <map-marker 
                        [position]="techPosition" 
                        [options]="techMarkerOptions">
                      </map-marker>
                    }

                    <!-- Polilínea del trayecto calculado por Google Directions -->
                    @if (polylinePath.length > 0) {
                      <map-polyline 
                        [path]="polylinePath" 
                        [options]="polylineOptions">
                      </map-polyline>
                    }
                  </google-map>
                } @else {
                  <div class="map-loading-placeholder">
                    <mat-icon class="spin">cached</mat-icon>
                    <span>Cargando Google Maps...</span>
                  </div>
                }
              </div>
            </div>

            <div class="card">
              <app-ai-analysis-panel [analysis]="incidentQuery.data()!.analisis_consolidado"></app-ai-analysis-panel>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }

    .details-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;

      @media (min-width: 1200px) {
        grid-template-columns: 1fr 400px;
      }
    }

    .main-column {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .side-column {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .card {
      background: var(--sm-color-gunmetal-900);
      border-radius: 12px;
      border: 1px solid rgba(var(--sm-rgb-slate-400), 0.1);
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    /* Map Card Styles */
    .map-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .map-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--sm-color-sapphire-400);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .eta-badge {
      background: rgba(var(--sm-rgb-sapphire-400), 0.15);
      color: var(--sm-color-sapphire-300);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      border: 1px solid rgba(var(--sm-rgb-sapphire-400), 0.2);
    }

    .details-map-container {
      height: 280px;
      width: 100%;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      overflow: hidden;
    }

    .map-loading-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: var(--sm-color-text-soft);
      background: rgba(255, 255, 255, 0.02);
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
      span { font-size: 0.8rem; }
    }

    .error-state {
      padding: 3rem;
      text-align: center;
      background: rgba(var(--sm-rgb-slate-400), 0.05);
      border-radius: 12px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--sm-color-crimson-500); margin-bottom: 1rem; }
      p { color: var(--sm-color-text-soft); margin-bottom: 1.5rem; }
    }

    .spin {
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class IncidentDetails implements OnDestroy {
  private route = inject(ActivatedRoute);
  private emergenciesService = inject(EmergenciesService);
  private trackingService = inject(IncidentTrackingService);
  private location = inject(Location);
  private platformId = inject(PLATFORM_ID);

  incidentId = this.route.snapshot.paramMap.get('id') || '';
  mapsLoaded = false;
  
  // Coordenadas del Mapa
  mapCenter: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  mapZoom = 15;
  techPosition: google.maps.LatLngLiteral | null = null;
  polylinePath: google.maps.LatLngLiteral[] = [];
  etaMinutos: number | null = null;

  // Estilo Dark Premium para Google Maps
  mapOptions: google.maps.MapOptions = {
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1f2937' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f3f4f6' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#60a5fa' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#374151' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1f2937' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4b5563' }] },
      { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
      { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
      { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#60a5fa' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#111827' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] }
    ],
    disableDefaultUI: true,
    zoomControl: true
  };

  // Opciones de Marcadores
  incidentMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      fillColor: '#ef4444', // Crimson / Rojo
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.5,
      anchor: { x: 12, y: 22 } as any
    },
    title: 'Incidente de Emergencia'
  };

  techMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42.99L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
      fillColor: '#3b82f6', // Sapphire / Azul
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 1.5,
      scale: 1.2,
      anchor: { x: 12, y: 12 } as any
    },
    title: 'Técnico de Auxilio'
  };

  polylineOptions: google.maps.PolylineOptions = {
    strokeColor: '#60a5fa', // Celeste / Azul claro
    strokeOpacity: 0.8,
    strokeWeight: 4
  };

  readonly sirenIcon = Siren;
  readonly mapIcon = MapIcon;
  readonly compassIcon = Compass;

  private trackingSubscription?: Subscription;

  incidentQuery = injectQuery(() => ({
    queryKey: ['incident', this.incidentId],
    queryFn: () => lastValueFrom(this.emergenciesService.getIncidentById(this.incidentId)),
    enabled: !!this.incidentId
  }));

  constructor() {
    // Iniciar carga del script de mapas y conexión de sockets cuando se cargue el incidente
    effect(() => {
      const data = this.incidentQuery.data();
      if (data && data.latitud && data.longitud && isPlatformBrowser(this.platformId)) {
        this.mapCenter = { lat: data.latitud, lng: data.longitud };
        this.loadGoogleMapsScript().then(() => {
          this.mapsLoaded = true;
          this.subscribeToTracking(data.estado_incidente);
        });
      }
    });
  }

  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).google) {
        resolve();
        return;
      }

      const scriptId = 'google-maps-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', () => resolve());
      }
    });
  }

  private subscribeToTracking(status: string) {
    // Solo suscribirse a tracking en vivo si el estado del incidente está en progreso de atención
    const activeStates = ['TALLER_ASIGNADO', 'EN_CAMINO', 'EN_ATENCION'];
    if (activeStates.includes(status)) {
      console.log(`🔌 Iniciando suscripción de tracking para incidente: ${this.incidentId}`);
      this.trackingSubscription = this.trackingService.connect(this.incidentId).subscribe({
        next: (message: WebSocketMessage) => {
          this.handleWebsocketMessage(message);
        },
        error: (err) => {
          console.error('Error en WebSocket de seguimiento:', err);
        }
      });
    }
  }

  private handleWebsocketMessage(message: WebSocketMessage) {
    if (message.type === 'TRACKING_UPDATE' && message.data) {
      console.log('📍 Actualización de tracking recibida:', message.data);
      const { latitud, longitud, eta_minutos, polyline_ruta } = message.data;
      
      if (latitud && longitud) {
        this.techPosition = { lat: latitud, lng: longitud };
        
        // Auto-centrar el mapa para mostrar ambos marcadores
        if ((window as any).google) {
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(this.mapCenter);
          bounds.extend(this.techPosition);
          // Si el mapa ya está instanciado, se puede re-encuadrar, o simplemente dejamos que el zoom ajuste
        }
      }

      if (eta_minutos !== undefined) {
        this.etaMinutos = eta_minutos;
      }

      if (polyline_ruta && (window as any).google) {
        try {
          const decoded = google.maps.geometry.encoding.decodePath(polyline_ruta);
          this.polylinePath = decoded.map(p => ({ lat: p.lat(), lng: p.lng() }));
        } catch (e) {
          console.error('Error al decodificar la polilínea de ruta:', e);
        }
      }
    } else if (message.type === 'STATUS_UPDATE') {
      console.log('🚨 Cambio de estado detectado por WebSocket. Refrescando datos...');
      this.incidentQuery.refetch();
    }
  }

  ngOnDestroy() {
    if (this.trackingSubscription) {
      this.trackingSubscription.unsubscribe();
    }
    this.trackingService.disconnect();
  }

  goBack() {
    this.location.back();
  }
}
