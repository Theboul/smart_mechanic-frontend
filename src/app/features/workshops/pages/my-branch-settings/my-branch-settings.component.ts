import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { WorkshopsService } from '../../data-access/workshops.service';
import { SucursalCreate, SucursalResponse } from '@core/models/workshops.model';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GoogleMapsModule } from '@angular/google-maps';
import { LucideAngularModule, Building, MapPin, Phone, Save } from 'lucide-angular';
import { PageHeaderComponent, LoadingStateComponent } from '@shared/ui';
import { environment } from '@env/environment';

@Component({
  selector: 'app-my-branch-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSnackBarModule,
    GoogleMapsModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Configuración de Mi Taller" 
        subtitle="Actualiza las coordenadas GPS, dirección física y teléfonos de contacto de tu local asignado."
        [icon]="branchIcon">
      </app-page-header>

      @if (branchQuery.isLoading()) {
        <app-loading-state message="Sincronizando con tu taller..."></app-loading-state>
      } @else if (branchQuery.isError()) {
        <div class="error-container sm-glass-card">
          ⚠️ No tienes asignado ningún taller físico en el sistema o el taller no existe. Contacta al administrador Owner.
        </div>
      } @else {
        <div class="settings-grid sm-glass-card">
          <div class="form-container">
            <h3 class="branch-name">{{ branchQuery.data()?.nombre }}</h3>
            <p class="branch-meta">ID de Sucursal: {{ branchQuery.data()?.id_sucursal }}</p>

            <form [formGroup]="branchForm" (ngSubmit)="onSubmit()" class="branch-form">
              <mat-form-field appearance="outline">
                <mat-label>Dirección Física del Taller</mat-label>
                <input matInput formControlName="direccion" placeholder="Ej: Av. Principal 123" />
                <mat-error>La dirección es requerida</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Teléfono de Contacto</mat-label>
                <input matInput formControlName="telefono" placeholder="Ej: 77712345" />
              </mat-form-field>

              <div class="coords-row">
                <mat-form-field appearance="outline">
                  <mat-label>Latitud</mat-label>
                  <input matInput formControlName="latitud" type="number" readonly />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Longitud</mat-label>
                  <input matInput formControlName="longitud" type="number" readonly />
                </mat-form-field>
              </div>

              <button mat-flat-button color="primary" class="save-btn" type="submit"
                [disabled]="branchForm.invalid || updateMutation.isPending()">
                <lucide-icon [img]="saveIcon" [size]="18"></lucide-icon>
                {{ updateMutation.isPending() ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </form>
          </div>

          <div class="map-container">
            <p class="map-label">📍 Ubicación Geográfica en Google Maps:</p>
            @if (apiLoaded()) {
              <google-map 
                height="350px" 
                width="100%" 
                [center]="mapCenter()" 
                [zoom]="14"
                (mapClick)="onMapClick($event)">
                <map-marker 
                  [position]="markerPosition()"
                  [options]="markerOptions"
                  (mapDragend)="onMarkerDragEnd($event)">
                </map-marker>
              </google-map>
            } @else {
              <div class="map-loading-placeholder" style="height: 350px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.15); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; color: var(--sm-color-text-muted);">
                Cargando mapa interactivo...
              </div>
            }
            <span class="map-help">Haz clic sobre el mapa para calibrar las coordenadas exactas de tu taller.</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
    
    .settings-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; padding: 2rem; border-radius: 16px; border: 1px solid rgba(var(--sm-rgb-sapphire-400), 0.15); }
    .branch-name { font-size: 1.25rem; font-weight: 700; color: var(--sm-color-text-title); margin: 0; }
    .branch-meta { font-size: 0.7rem; color: var(--sm-color-text-muted); font-family: monospace; margin: 0.25rem 0 1.5rem 0; }

    .branch-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .coords-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .save-btn { display: inline-flex; align-items: center; gap: 0.5rem; width: fit-content; padding: 0.5rem 1.5rem; margin-top: 1rem; }

    .map-container { display: flex; flex-direction: column; gap: 0.5rem; }
    .map-label { font-size: 0.8rem; font-weight: 600; color: var(--sm-color-sapphire-300); margin: 0; }
    .map-help { font-size: 0.7rem; color: var(--sm-color-text-muted); margin-top: 0.25rem; }

    .error-container { padding: 2rem; text-align: center; color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; }

    @media (max-width: 960px) {
      .settings-grid { grid-template-columns: 1fr; }
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MyBranchSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private workshopsService = inject(WorkshopsService);
  private snackBar = inject(MatSnackBar);
  private queryClient = injectQueryClient();

  // Iconos
  readonly branchIcon = Building;
  readonly mapPinIcon = MapPin;
  readonly phoneIcon = Phone;
  readonly saveIcon = Save;

  apiLoaded = signal(false);

  // Reactividad del Mapa
  mapCenter = signal<google.maps.LatLngLiteral>({ lat: -17.7833, lng: -63.1821 });
  markerPosition = signal<google.maps.LatLngLiteral>({ lat: -17.7833, lng: -63.1821 });
  markerOptions: google.maps.MarkerOptions = { draggable: true };

  branchForm = this.fb.nonNullable.group({
    direccion: ['', Validators.required],
    telefono: [''],
    latitud: [0, Validators.required],
    longitud: [0, Validators.required]
  });

  ngOnInit() {
    this.loadGoogleMapsScript().then(() => this.apiLoaded.set(true));
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

  // ── Queries ─────────────────────────────────────────────────────────────────
  branchQuery = injectQuery(() => ({
    queryKey: ['my-branch'],
    queryFn: () => lastValueFrom(this.workshopsService.getMyBranch()),
    gcTime: 0 // Evitar guardar cache de asignaciones cruzadas
  }));

  // Cargar datos en el formulario cuando la query se complete
  constructor() {
    effect(() => {
      const branch = this.branchQuery.data();
      if (branch) {
        this.branchForm.patchValue({
          direccion: branch.direccion,
          telefono: branch.telefono || '',
          latitud: branch.latitud || -17.7833,
          longitud: branch.longitud || -63.1821
        });
        
        const lat = branch.latitud || -17.7833;
        const lng = branch.longitud || -63.1821;
        this.mapCenter.set({ lat, lng });
        this.markerPosition.set({ lat, lng });
      }
    });
  }

  // ── Lógica Mapa ─────────────────────────────────────────────────────────────
  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      this.markerPosition.set({ lat, lng });
      this.branchForm.patchValue({ latitud: lat, longitud: lng });
      this.reverseGeocode(lat, lng);
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      this.markerPosition.set({ lat, lng });
      this.branchForm.patchValue({ latitud: lat, longitud: lng });
      this.reverseGeocode(lat, lng);
    }
  }

  private reverseGeocode(lat: number, lng: number) {
    if (typeof google === 'undefined' || !google.maps) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address.substring(0, 255);
        this.branchForm.patchValue({ direccion: address });
      } else {
        console.warn('Geocoding failed due to:', status);
      }
    });
  }

  // ── Mutations ───────────────────────────────────────────────────────────────
  updateMutation = injectMutation(() => ({
    mutationFn: (data: SucursalCreate) => lastValueFrom(this.workshopsService.updateMyBranchLocal(data)),
    onSuccess: () => {
      this.snackBar.open('✅ Configuración de taller guardada con éxito', 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['my-branch'] });
    },
    onError: () => this.snackBar.open('❌ Error al actualizar el taller', 'Cerrar', { duration: 4000 })
  }));

  onSubmit() {
    if (this.branchForm.invalid) return;

    const branch = this.branchQuery.data();
    if (!branch) return;

    const raw = this.branchForm.getRawValue();
    const payload: SucursalCreate = {
      nombre: branch.nombre, // Se mantiene el nombre original corporativo
      direccion: raw.direccion,
      telefono: raw.telefono || undefined,
      latitud: raw.latitud,
      longitud: raw.longitud
    };

    this.updateMutation.mutate(payload);
  }
}
