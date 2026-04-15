import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeAlert, HomeKpi, HomeQuickAction } from '../../models/home-dashboard.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-home-dashboard',
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-dashboard.component.html',
  styleUrl: './home-dashboard.component.scss',
})
export class HomeDashboardComponent {
  title = input('Centro de Operaciones Smart Mechanic');
  subtitle = input('Vision integral del estado de la plataforma en tiempo real.');
  kpis = input<HomeKpi[]>([]);
  highlights = input<string[]>([]);
  alerts = input<HomeAlert[]>([]);
  quickActions = input<HomeQuickAction[]>([]);

  quickActionSelected = output<HomeQuickAction>();

  selectQuickAction(action: HomeQuickAction): void {
    this.quickActionSelected.emit(action);
  }
}
