import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'emergencies/details/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'quotations/requests/:requestId',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
