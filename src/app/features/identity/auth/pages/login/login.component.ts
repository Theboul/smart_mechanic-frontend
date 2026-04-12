import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

// Importaciones de Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

// Imports de la arquitectura del dominio
import { AuthService } from '../../data-access/auth.service';
import { AuthStore } from '../../state/auth.store';
import { LoginCredentials } from '../../schemas/auth.schema';

@Component({
  selector: 'app-login',
  standalone: true,
  // Aquí es crucial importar los módulos de Material para que la plantilla los reconozca
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Iniciar Sesión</mat-card-title>
          <mat-card-subtitle>Ingresa al demo con Angular Material</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            
            <!-- Campo de Correo con Material -->
            <mat-form-field appearance="outline">
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" formControlName="email">
              @if (loginForm.get('email')?.hasError('email')) {
                <mat-error>Por favor, ingresa un correo válido</mat-error>
              }
              @if (loginForm.get('email')?.hasError('required')) {
                <mat-error>El correo es obligatorio</mat-error>
              }
            </mat-form-field>
            
            <!-- Campo de Contraseña con Material -->
            <mat-form-field appearance="outline">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" formControlName="password">
              @if (loginForm.get('password')?.hasError('required')) {
                <mat-error>La contraseña es obligatoria</mat-error>
              }
            </mat-form-field>
            
            <!-- Botón de Envío usando Material -->
            <button 
              mat-flat-button 
              color="primary" 
              type="submit" 
              [disabled]="loginForm.invalid || authService.loginMutation.isPending()">
              
              @if (authService.loginMutation.isPending()) {
                Autenticando...
              } @else {
                Ingresar a la Plataforma
              }
            </button>
          </form>

          <!-- Manejo de errores de TanStack Query integrado con Material -->
          @if (authService.loginMutation.isError()) {
            <mat-error class="global-error">
              {{ authService.loginMutation.error().message }}
            </mat-error>
          }

          <!-- Estado Exitoso desde nuestro NgRx SignalStore -->
          @if (authStore.isAuthenticated()) {
            <div class="success-box">
              <p>¡Bienvenido de vuelta!</p>
              <p>Has ingresado como: <strong>{{ authStore.user()?.name }}</strong></p>
              <button mat-stroked-button color="warn" (click)="logout()">Cerrar sesión</button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 1rem;
      background-color: transparent; /* Hereda del layout base si existe */
    }
    
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 1rem;
    }

    mat-card-header {
      margin-bottom: 1.5rem;
      text-align: center;
    }
    
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem; /* Separación entre material inputs */
    }

    /* Forzar que el botón ocupe y se vea centrado */
    button[type="submit"] {
      margin-top: 1rem;
      padding: 0.5rem 0;
      font-size: 1rem;
    }

    .global-error {
      display: block;
      margin-top: 1.5rem;
      text-align: center;
      font-weight: 500;
      background-color: #fef2f2;
      padding: 10px;
      border-radius: 4px;
    }

    .success-box {
      margin-top: 2rem;
      padding: 1.5rem;
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      text-align: center;
      color: #166534;
    }

    .success-box strong {
      display: block;
      margin-top: 0.5rem;
      font-size: 1.1rem;
    }

    .success-box button {
      margin-top: 1rem;
      width: 100%;
    }
  `]
})
export class LoginComponent {
  // Inyectamos la mutación de TanStack Query
  public authService = inject(AuthService);
  
  // Inyectamos nuestro contenedor de estado global (NgRx Signals)
  public authStore = inject(AuthStore);
  
  private fb = inject(FormBuilder);
  
  public loginForm: FormGroup = this.fb.group({
    email: ['admin@demo.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value as LoginCredentials;
      
      this.authService.loginMutation.mutate(credentials, {
        onSuccess: (user) => {
          this.authStore.loginSuccess(user, 'dummy.jwt.token');
        }
      });
    }
  }

  logout() {
    this.authStore.logout();
    this.authService.loginMutation.reset();
  }
}
