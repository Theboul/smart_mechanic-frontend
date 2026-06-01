import { ChangeDetectionStrategy, Component, OnChanges, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { GoogleMapsModule } from '@angular/google-maps';
import { LucideAngularModule, Check, X, MapPin } from 'lucide-angular';
import { TallerCreate, TallerResponse } from '@core/models/workshops.model';
import { environment } from '@env/environment';

@Component({
  selector: 'app-workshop-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatInputModule, 
    MatButtonModule, 
    MatFormFieldModule,
    GoogleMapsModule,
    LucideAngularModule
  ],
  templateUrl: './workshop-form.html',
  styleUrls: ['./workshop-form.scss']
})
export class WorkshopForm implements OnInit, OnChanges {
  readonly initialData = input<TallerResponse | null>(null);
  readonly save = output<TallerCreate>();
  readonly cancel = output<void>();

  private fb = inject(FormBuilder);

  // Iconos
  protected readonly checkIcon = Check;
  protected readonly cancelIcon = X;
  protected readonly mapPinIcon = MapPin;

  apiLoaded = signal(false);

  // Reactividad del Mapa
  mapCenter = signal<google.maps.LatLngLiteral>({ lat: -17.7833, lng: -63.1821 });
  markerPosition = signal<google.maps.LatLngLiteral>({ lat: -17.7833, lng: -63.1821 });
  markerOptions: google.maps.MarkerOptions = { draggable: true };

  workshopForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    nit: ['', [Validators.required, Validators.maxLength(50)]],
    telefono: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email]],
    direccion: ['', [Validators.maxLength(255)]],
    latitud: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitud: [0, [Validators.required, Validators.min(-180), Validators.max(180)]]
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

  ngOnChanges() {
    const data = this.initialData();
    if (data) {
      this.workshopForm.patchValue({
        nombre: data.nombre,
        nit: data.nit,
        telefono: data.telefono || '',
        email: data.email || '',
        direccion: data.direccion || '',
        latitud: data.latitud || -17.7833,
        longitud: data.longitud || -63.1821
      });
      this.workshopForm.get('nit')?.disable();
      
      const lat = data.latitud || -17.7833;
      const lng = data.longitud || -63.1821;
      this.mapCenter.set({ lat, lng });
      this.markerPosition.set({ lat, lng });
    }
  }

  // ── Lógica Mapa ─────────────────────────────────────────────────────────────
  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      this.markerPosition.set({ lat, lng });
      this.workshopForm.patchValue({ latitud: lat, longitud: lng });
      this.reverseGeocode(lat, lng);
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      this.markerPosition.set({ lat, lng });
      this.workshopForm.patchValue({ latitud: lat, longitud: lng });
      this.reverseGeocode(lat, lng);
    }
  }

  private reverseGeocode(lat: number, lng: number) {
    if (typeof google === 'undefined' || !google.maps) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address.substring(0, 255);
        this.workshopForm.patchValue({ direccion: address });
      } else {
        console.warn('Geocoding failed due to:', status);
      }
    });
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    if (this.workshopForm.valid) {
      const raw = this.workshopForm.getRawValue();
      const payload: TallerCreate = {
        nombre: raw.nombre,
        nit: raw.nit,
        telefono: raw.telefono || undefined,
        email: raw.email || undefined,
        direccion: raw.direccion || undefined,
        latitud: raw.latitud,
        longitud: raw.longitud
      };
      this.save.emit(payload);
    } else {
      this.workshopForm.markAllAsTouched();
    }
  }
}
