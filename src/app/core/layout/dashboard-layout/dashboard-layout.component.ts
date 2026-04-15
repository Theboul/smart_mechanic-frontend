import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SidebarComponent } from '@core/layout/sidebar/sidebar.component';
import { HeaderComponent } from '@core/layout/header/header.component';
import { AuthStore } from '@features/identity/auth/state/auth.store';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    SidebarComponent,
    HeaderComponent,
  ],
  template: `
    <mat-sidenav-container class="layout-container">
      <!-- Sidebar (sidenav) -->
      <mat-sidenav
        mode="side"
        opened
        class="app-sidenav"
        fixedInViewport="true"
      >
        <app-sidebar></app-sidebar>
      </mat-sidenav>

      <!-- Contenido principal -->
      <mat-sidenav-content class="layout-content">
        <app-header></app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .layout-container {
      height: 100vh;
      overflow: hidden;
      background:
        radial-gradient(
          circle at 50% -25%,
          var(--sm-color-gunmetal-800) 0%,
          var(--sm-color-gunmetal-950) 75%
        );
    }

    .app-sidenav {
      width: 280px;
      border-right: 1px solid rgb(var(--sm-rgb-slate-400) / 0.2);
      background: linear-gradient(
        160deg,
        var(--sm-color-gunmetal-850),
        var(--sm-color-gunmetal-900)
      );
    }

    .layout-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: transparent;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 2rem;
      max-width: 1400px;
      background:
        linear-gradient(
          180deg,
          rgb(var(--sm-rgb-black) / 0.12),
          rgb(var(--sm-rgb-black) / 0.4)
        );
    }

    @media (max-width: 960px) {
      .app-sidenav {
        width: 260px;
      }
      .main-content {
        padding: 1rem;
      }
    }
  `]
})
export class DashboardLayoutComponent {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  constructor() {
    // Guard inline: redirige si no hay sesión autenticada
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/identity/auth']);
    }
  }
}
