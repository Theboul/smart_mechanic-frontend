import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { User } from '../schemas/auth.schema';
import { StorageService } from '../../../../core/services/storage.service';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
};

/**
 * Nuestro Store global para identidad usando NgRx Signals.
 * Proveído en la raíz ('root') para que otros módulos (ej. guards) puedan ver la sesión.
 */
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, storageService = inject(StorageService)) => ({
    /**
     * Se llama después de que TanStack Query (AuthService) termine exitosamente su mutación.
     */
    loginSuccess(user: User, token: string) {
      patchState(store, { user, accessToken: token, isAuthenticated: true });
      // Guardar el token de forma segura (Compatible con SSR y Node!)
      storageService.setItem('access_token', token);
    },
    
    logout() {
      patchState(store, initialState);
      // Limpiar al cerrar sesión
      storageService.removeItem('access_token');
    }
  }))
);
