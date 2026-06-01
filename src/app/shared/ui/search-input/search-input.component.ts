import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideAngularModule, Search } from 'lucide-angular';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    LucideAngularModule
  ],
  template: `
    <mat-form-field appearance="outline" class="sm-capsule-field" subscriptSizing="dynamic">
      <input
        matInput
        type="text"
        [placeholder]="placeholder()"
        [ngModel]="value()"
        (ngModelChange)="value.set($event)"
      />
      <lucide-icon [img]="icon()" [size]="18" matSuffix></lucide-icon>
    </mat-form-field>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class SearchInputComponent {
  value = model<string>('');
  placeholder = input<string>('Buscar...');
  icon = input<any>(Search);
}
