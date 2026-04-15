import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-stat-card',
  imports: [CommonModule, MatCardModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="stat-card">
      <mat-card-content>
        <div class="stat-header">
          <span class="stat-label">{{ title() }}</span>
          <div class="stat-icon">{{ icon() }}</div>
        </div>
        <div class="stat-body">
          <p class="stat-value">{{ value() }}</p>
          <p class="stat-desc">{{ description() }}</p>
        </div>
        @if (change() !== undefined) {
          <div class="stat-footer">
            <span [class]="change()! > 0 ? 'change-positive' : 'change-negative'">
              {{ change()! > 0 ? '+' : '' }}{{ change() }}%
              {{ change()! > 0 ? 'aumento' : 'disminucion' }}
            </span>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .stat-card {
      height: 100%;
      transition: box-shadow 0.2s ease;
    }
    .stat-card:hover {
      box-shadow: 0 4px 20px rgb(var(--sm-rgb-black) / 0.15);
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .stat-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--sm-color-text-soft);
    }
    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.5rem;
      background: rgb(var(--sm-rgb-sapphire-500) / 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .stat-body {
      margin-bottom: 0.5rem;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--sm-color-text-title);
      margin: 0;
      line-height: 1.2;
    }
    .stat-desc {
      font-size: 0.75rem;
      color: var(--sm-color-text-soft);
      margin: 0.25rem 0 0;
    }
    .stat-footer {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgb(var(--sm-rgb-slate-400) / 0.2);
    }
    .change-positive {
      font-size: 0.75rem;
      color: var(--sm-color-success-500);
      font-weight: 500;
    }
    .change-negative {
      font-size: 0.75rem;
      color: var(--sm-color-danger-500);
      font-weight: 500;
    }
  `],
})
export class StatCardComponent {
  title = input('');
  value = input<string | number>(0);
  description = input('');
  icon = input('📊');
  change = input<number | undefined>(undefined);
}
