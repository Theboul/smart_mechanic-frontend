import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-stat-card',
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="stat-card">
      <mat-card-content>
        <div class="stat-header">
          <span class="stat-label">{{ title() }}</span>
          <div class="stat-icon">
            @if (isLucideIcon(icon())) {
              <lucide-icon [img]="icon()" [size]="20"></lucide-icon>
            } @else if (isMaterialIcon(icon())) {
              <mat-icon>{{ icon() }}</mat-icon>
            } @else {
              {{ icon() }}
            }
          </div>
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
      background: rgba(255, 255, 255, 0.02) !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      border-radius: 16px !important;
    }
    .stat-card:hover {
      box-shadow: 0 4px 20px rgb(var(--sm-rgb-black) / 0.15);
      border-color: rgba(255, 255, 255, 0.1) !important;
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .stat-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--sm-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 10px;
      background: rgba(99, 102, 241, 0.1);
      color: #818cf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .stat-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-body {
      margin-bottom: 0.25rem;
    }
    .stat-value {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--sm-color-text-main);
      margin: 0;
      line-height: 1.1;
    }
    .stat-desc {
      font-size: 0.8rem;
      color: var(--sm-color-text-soft);
      margin: 0.35rem 0 0;
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
  icon = input<any>('📊');
  change = input<number | undefined>(undefined);

  isLucideIcon(val: any): boolean {
    return val && typeof val === 'object';
  }

  isMaterialIcon(val: any): boolean {
    if (typeof val !== 'string') return false;
    return /^[a-z0-9_]+$/.test(val);
  }
}

