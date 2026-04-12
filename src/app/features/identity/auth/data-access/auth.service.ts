import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { LoginCredentials, User } from '../schemas/auth.schema';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  // Reemplaza con la URL base real o inyecta desde un archivo de entorno
  private apiUrl = '/api/auth';

  /**
   * Mutation de TanStack Query para hacer Login.
   * Maneja automáticamente los estados de isPending, isError, isSuccess a nivel de UI.
   */
  loginMutation = injectMutation(() => ({
    mutationKey: ['login'],
    mutationFn: async (credentials: LoginCredentials): Promise<User> => {
      // Usamos el HttpClient clásico de Angular, convirtiéndolo a Promesa
      // para que encaje perfecto con async/await y TanStack Query nativamente.
      // Aquí estamos simulando una llamada real. En un backend de verdad, 
      // retornaríamos lo que devuelva el POST.
      
      // Simulamos la respuesta para poder correr la demo sin backend real
      return new Promise<User>((resolve, reject) => {
        setTimeout(() => {
          if (credentials.email === 'admin@demo.com' && credentials.password === '123456') {
            resolve({
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Administrador Demo',
              email: 'admin@demo.com',
              role: 'ADMIN'
            });
          } else {
            reject(new Error("Credenciales incorrectas (Usa: admin@demo.com / 123456)"));
          }
        }, 1500);
      });
      
      // Ejemplo real:
      // return firstValueFrom(this.http.post<User>(`${this.apiUrl}/login`, credentials));
    }
  }));
}
