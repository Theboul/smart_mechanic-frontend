import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

export interface FeatureItem {
  name: string;
  description: string;
}

@Component({
  selector: 'app-page-placeholder',
  imports: [CommonModule, MatCardModule, MatDividerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder-container">
      <div class="page-header">
        <h1 class="page-title">{{ title() }}</h1>
        <p class="page-desc">{{ description() }}</p>
      </div>

      <mat-card class="coming-soon-card">
        <mat-card-content>
          <div class="coming-soon-content">
            <div class="coming-soon-icon">{{ icon() }}</div>
            <h2 class="coming-soon-title">{{ title() }}</h2>
            <p class="coming-soon-text">
              Modulo en construccion. Pronto estaran disponibles todas las
              funcionalidades para {{ title() }}.
            </p>
            <div class="coming-soon-badge">
              <span class="badge-dot"></span>
              Proximamente
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @if (features().length > 0) {
        <div class="features-grid">
          @for (feature of features(); track feature.name) {
            <mat-card class="feature-card">
              <mat-card-content>
                <p class="feature-name">{{ feature.name }}</p>
                <p class="feature-desc">{{ feature.description }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--sm-color-text-title);
      margin: 0 0 0.5rem;
    }
    .page-desc {
      color: var(--sm-color-text-soft);
      margin: 0;
    }
    .coming-soon-card {
      text-align: center;
      padding: 2rem;
    }
    .coming-soon-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .coming-soon-icon {
      font-size: 4rem;
      line-height: 1;
    }
    .coming-soon-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--sm-color-text-title);
      margin: 0;
    }
    .coming-soon-text {
      color: var(--sm-color-text-soft);
      max-width: 28rem;
      margin: 0;
    }
    .coming-soon-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 1rem;
      background: rgb(var(--sm-rgb-sapphire-500) / 0.14);
      color: var(--sm-color-sapphire-100);
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid rgb(var(--sm-rgb-sapphire-400) / 0.3);
    }
    .badge-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--sm-color-sapphire-400);
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .feature-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--sm-color-text-title);
      margin: 0 0 0.25rem;
    }
    .feature-desc {
      font-size: 0.85rem;
      color: var(--sm-color-text-soft);
      margin: 0;
    }
  `],
})
export class PagePlaceholderComponent {
  title = input('Pagina');
  description = input('Esta pagina esta en construccion');
  icon = input('🚀');
  features = input<FeatureItem[]>([]);
}
