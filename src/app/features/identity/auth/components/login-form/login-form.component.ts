import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  @Output() onSubmitCredentials = new EventEmitter<LoginCredentials>();

  public loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  submitForm() {
    if (this.loginForm.valid) {
      this.onSubmitCredentials.emit(this.loginForm.value);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}