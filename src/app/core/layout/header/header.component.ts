import { Component, inject, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { StorageService } from '@core/services/storage.service';
import { LogOut, Menu, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    LucideAngularModule,
  ],
  template: `
    <mat-toolbar class="app-header">
      <!-- Botón hamburguesa móvil -->
      @if (showMenuButton) {
        <button mat-icon-button (click)="menuToggled.emit()" class="menu-toggle-btn">
          <lucide-icon [img]="menuIcon" [size]="20" aria-hidden="true"></lucide-icon>
        </button>
      }

      <!-- Título / Branding -->
      <div class="header-brand">
        <span class="brand-logo">SM</span>
        <div class="brand-text">
          <span class="brand-name">SMART MECHANIC</span>
          <span class="brand-subtitle">Panel de Control</span>
        </div>
      </div>

      <span class="header-spacer"></span>

      <!-- Acciones del lado derecho -->
      <div class="header-actions">
        <!-- Selector de Contexto (Branch Switcher) para el Owner -->
        @if (isOwner()) {
          <mat-form-field appearance="outline" class="branch-select-field" subscriptSizing="dynamic">
            <mat-select [value]="selectedBranch()" (selectionChange)="onBranchChange($event.value)" placeholder="Todas las sucursales">
              <mat-option value="">🌐 Todas las sucursales</mat-option>
              @for (b of branches(); track b.id_sucursal) {
                <mat-option [value]="b.id_sucursal">🏢 {{ b.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <!-- Info del usuario logueado -->
        @if (authStore.isAuthenticated()) {
          <span class="user-name">{{ authStore.user()?.nombre }}</span>
        }

        <!-- Botón de Logout -->
        <button mat-stroked-button (click)="logout()" class="logout-btn">
          <lucide-icon [img]="logoutIcon" [size]="16" aria-hidden="true"></lucide-icon>
          Cerrar sesión
        </button>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    :host {}

    .app-header {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 4rem;
      border-bottom: 1px solid rgb(var(--sm-rgb-slate-400) / 0.18);
      color: var(--sm-color-text-main);
      background:
        radial-gradient(circle at 20% -30%, rgb(var(--sm-rgb-sapphire-500) / 0.25), transparent 45%),
        linear-gradient(145deg, var(--sm-color-gunmetal-850), var(--sm-color-gunmetal-900));
      box-shadow:
        0 10px 26px -16px rgb(var(--sm-rgb-black) / 0.85),
        inset 0 1px 0 rgb(var(--sm-rgb-white) / 0.04);
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.7rem;
      background: linear-gradient(
        135deg,
        var(--sm-color-sapphire-500),
        var(--sm-color-sapphire-700)
      );
      color: var(--sm-color-white);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      flex-shrink: 0;
      box-shadow:
        0 8px 16px -10px rgb(var(--sm-rgb-sapphire-500) / 0.9),
        inset 0 1px 0 rgb(var(--sm-rgb-white) / 0.2);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .brand-name {
      font-weight: 700;
      font-size: 1rem;
      color: var(--sm-color-text-title);
    }

    .brand-subtitle {
      font-size: 0.7rem;
      color: var(--sm-color-text-soft);
    }

    .header-spacer {
      flex: 1;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-name {
      font-size: 0.875rem;
      color: var(--sm-color-text-main);
      border-radius: 999px;
      border: 1px solid rgb(var(--sm-rgb-sapphire-400) / 0.3);
      background: rgb(var(--sm-rgb-sapphire-500) / 0.12);
      padding: 0.35rem 0.7rem;
    }

    .logout-btn {
      color: var(--sm-color-sapphire-100);
      border-color: rgb(var(--sm-rgb-sapphire-400) / 0.35);
      background: rgb(var(--sm-rgb-sapphire-500) / 0.12);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .logout-btn:hover {
      background: linear-gradient(
        145deg,
        var(--sm-color-sapphire-500),
        var(--sm-color-sapphire-600)
      );
      color: var(--sm-color-white);
    }

    .menu-toggle-btn {
      color: var(--sm-color-text-main);
      margin-right: 0.5rem;
      border: none;
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .branch-select-field {
      width: 220px;
      font-size: 0.8rem;
      
      ::ng-deep .mat-mdc-form-field-infix {
        padding-top: 6px !important;
        padding-bottom: 6px !important;
        min-height: 36px !important;
      }
      ::ng-deep .mat-mdc-text-field-wrapper {
        background: rgba(255, 255, 255, 0.03) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 8px !important;
        height: 36px !important;
      }
      ::ng-deep .mat-mdc-select-value {
        color: var(--sm-color-text-main) !important;
        font-weight: 600;
      }
      ::ng-deep .mat-mdc-select-arrow {
        color: var(--sm-color-text-muted) !important;
      }
    }

    @media (max-width: 768px) {
      .branch-select-field {
        width: 150px;
      }
    }

    @media (max-width: 600px) {
      .brand-subtitle, .user-name {
        display: none;
      }
 
      .app-header {
        padding-inline: 0.6rem;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  public authStore = inject(AuthStore);
  private router = inject(Router);
  private workshopsService = inject(WorkshopsService);
  private storageService = inject(StorageService);
  
  @Input() showMenuButton = false;
  @Output() menuToggled = new EventEmitter<void>();

  protected readonly logoutIcon = LogOut;
  protected readonly menuIcon = Menu;

  isOwner = computed(() => {
    const user = this.authStore.user();
    return (user?.rol_nombre || '').toLowerCase().trim() === 'admin_taller' && user?.rol_contexto === 'owner';
  });

  branches = signal<any[]>([]);
  selectedBranch = signal<string>('');

  ngOnInit() {
    if (this.isOwner()) {
      this.workshopsService.getBranches().subscribe({
        next: (res) => {
          this.branches.set(res || []);
        },
        error: (err) => {
          console.error('Error fetching branches for header switcher:', err);
        }
      });
      this.selectedBranch.set(this.storageService.getItem('selected_branch') || '');
    }
  }

  onBranchChange(value: string) {
    if (value) {
      this.storageService.setItem('selected_branch', value);
    } else {
      this.storageService.removeItem('selected_branch');
    }
    this.selectedBranch.set(value);
    window.location.reload();
  }

  logout() {
    this.storageService.removeItem('selected_branch');
    this.authStore.logout();
    this.router.navigate(['/identity/auth']);
  }
}
