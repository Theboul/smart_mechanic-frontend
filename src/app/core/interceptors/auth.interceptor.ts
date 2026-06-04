import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';
import { StorageService } from '../services/storage.service';

/**
 * Functional Interceptor de Angular 17+ 
 * Atrapa cada petición antes de enviarla al servidor local y le adjunta el Token temporalmente
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  
  // Extraemos el JWT del almacenamiento seguro
  const token = storageService.getItem('access_token');

  // Aplicar cabecera siempre que el usuario tenga un token y esté llamando a nuestra API
  const isApiRequest = req.url.includes(environment.apiUrl) || req.url.startsWith('/api');

  if (token && isApiRequest) {
    const selectedBranch = storageService.getItem('selected_branch');
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (selectedBranch) {
      headers['X-Selected-Branch'] = selectedBranch;
    }
    req = req.clone({
      setHeaders: headers,
    });
  }

  // Continuar el envío de la petición ya "manchada" con el header
  return next(req);
};
