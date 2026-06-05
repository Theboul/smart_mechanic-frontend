import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentHistoryResponse } from '@core/models/workshops.model';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, Clock, User, CheckCircle2, AlertTriangle, Compass } from 'lucide-angular';

@Component({
  selector: 'app-incident-timeline',
  standalone: true,
  imports: [CommonModule, MatIconModule, LucideAngularModule],
  templateUrl: './incident-timeline.html',
  styleUrls: ['./incident-timeline.scss']
})
export class IncidentTimeline implements OnInit, OnChanges {
  @Input() history: IncidentHistoryResponse[] = [];
  
  sortedHistory: IncidentHistoryResponse[] = [];

  readonly clockIcon = Clock;
  readonly userIcon = User;

  ngOnInit() {
    this.sortHistory();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['history']) {
      this.sortHistory();
    }
  }

  private sortHistory() {
    if (!this.history) {
      this.sortedHistory = [];
      return;
    }
    // Ordenar de más antiguo a más reciente
    this.sortedHistory = [...this.history].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  }

  getStatusDisplay(status: string): string {
    if (!status) return 'REGISTRADO';
    return status.replace(/_/g, ' ').toUpperCase();
  }

  getStatusIcon(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDIENTE':
      case 'BUSCANDO_TALLER':
        return 'hourglass_empty';
      case 'TALLER_ASIGNADO':
        return 'assignment_turned_in';
      case 'EN_CAMINO':
        return 'directions_car';
      case 'EN_ATENCION':
        return 'build';
      case 'FINALIZADO':
      case 'COMPLETADO':
        return 'check_circle';
      case 'CANCELADO':
        return 'cancel';
      default:
        return 'info';
    }
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase().replace(/_/g, '-')}`;
  }
}
