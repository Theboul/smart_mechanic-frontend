import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentResponse } from '@core/models/workshops.model';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-incident-details-card',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  templateUrl: './incident-details-card.html',
  styleUrls: ['./incident-details-card.scss']
})
export class IncidentDetailsCard {
  @Input() incident!: IncidentResponse;

  getPriorityColor(priority: string): string {
    switch (priority.toUpperCase()) {
      case 'CRITICA': return 'warn';
      case 'ALTA': return 'accent';
      case 'MEDIA': return 'primary';
      default: return '';
    }
  }
}
