import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FeatureItem,
  PagePlaceholderComponent,
} from '../page-placeholder/page-placeholder.component';

export interface PlaceholderRouteData {
  title: string;
  description: string;
  icon: string;
  features?: FeatureItem[];
}

const DEFAULT_PLACEHOLDER_DATA: PlaceholderRouteData = {
  title: 'Pagina',
  description: 'Esta pagina esta en construccion',
  icon: '🚀',
  features: [],
};

@Component({
  selector: 'app-placeholder-route-page',
  imports: [PagePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-placeholder
      [title]="data.title"
      [description]="data.description"
      [icon]="data.icon"
      [features]="data.features ?? []"
    />
  `,
})
export class PlaceholderRoutePageComponent {
  private route = inject(ActivatedRoute);

  get data(): PlaceholderRouteData {
    const routeData = this.route.snapshot.data['placeholder'] as
      | Partial<PlaceholderRouteData>
      | undefined;

    return {
      ...DEFAULT_PLACEHOLDER_DATA,
      ...routeData,
      features: routeData?.features ?? DEFAULT_PLACEHOLDER_DATA.features,
    };
  }
}
