import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <mat-form-field appearance="outline" class="sm-capsule-field" subscriptSizing="dynamic">
      <mat-select [ngModel]="value()" (ngModelChange)="value.set($event)">
        @if (placeholder()) {
          <mat-option [value]="emptyValue()">{{ placeholder() }}</mat-option>
        }
        @for (opt of options(); track opt.value) {
          <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class SelectComponent {
  value = model<any>('');
  placeholder = input<string>('');
  emptyValue = input<any>('');
  options = input<SelectOption[]>([]);
}
