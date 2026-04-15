import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../state/auth.store';
import { User } from '../../schemas/auth.schema';
import { LoginFormComponent, LoginCredentials } from '../../components/login-form/login-form.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginFormComponent],
  template: `
    <app-login-form (onSubmitCredentials)="iniciarSesion($event)"></app-login-form>
  `
})
export class LoginComponent {
  public authStore = inject(AuthStore);
  private router = inject(Router);

  constructor() {
    // Si ya está autenticado, no debería ver el login
    if (this.authStore.isAuthenticated()) {
      this.router.navigate(['/identity/home']);
    }
  }

  // La lógica pura reside aquí, la interfaz visual ni se entera
  iniciarSesion(credentials: LoginCredentials) {
    const userName = credentials.email.split('@')[0] || 'Nuevo Usuario';

    const user: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: userName,
      email: credentials.email,
      role: 'ADMIN', // En el futuro se obtendrá del JWT
    };

    // Puedes usar la propiedad credentials.rememberMe para decidir cómo guardar el token
    console.log('Recordar sesión marcado como:', credentials.rememberMe);

    this.authStore.loginSuccess(user, 'dummy.jwt.token');
    this.router.navigate(['/identity/home']);
  }
}