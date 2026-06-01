import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { User } from '../schemas/auth.schema';
import { StorageService } from '@core/services/storage.service';

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
     * Carga el estado inicial desde el almacenamiento persistente.
     * Útil para sobrevivir a refrescos de página.
     */
    init() {
      const token = storageService.getItem('access_token');
      const userData = storageService.getItem('user_data');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          patchState(store, { user, accessToken: token, isAuthenticated: true });
        } catch (e) {
          console.error('Error recuperando sesión:', e);
          storageService.removeItem('access_token');
          storageService.removeItem('user_data');
        }
      }
    },

    loginSuccess(user: User, token: string) {
      patchState(store, { user, accessToken: token, isAuthenticated: true });
      storageService.setItem('access_token', token);
      storageService.setItem('user_data', JSON.stringify(user));
    },

    updateUser(user: User) {
      patchState(store, { user });
      storageService.setItem('user_data', JSON.stringify(user));
    },
    
    logout() {
      patchState(store, initialState);
      storageService.removeItem('access_token');
      storageService.removeItem('user_data');
    }
  }))
);
