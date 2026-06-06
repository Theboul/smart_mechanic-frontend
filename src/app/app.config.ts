import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsBo from '@angular/common/locales/es-BO';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// Nuevos Providers requeridos para la arquitectura
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { importProvidersFrom } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';

registerLocaleData(localeEsBo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    provideAnimationsAsync(),                 // Necesario para Angular Material
    provideAngularQuery(new QueryClient()),   // Necesario para TanStack Query
    importProvidersFrom(MatSnackBarModule),   // Necesario para notificaciones Snackbar
    { provide: LOCALE_ID, useValue: 'es-BO' }
  ]
};
