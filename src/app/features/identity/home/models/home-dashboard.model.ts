import { LucideIconData } from 'lucide-angular';

export interface HomeKpi {
  label: string;
  value: string;
  icon: LucideIconData;
  detail: string;
  trend: number;
}

export interface HomeQuickAction {
  key: 'create-emergency' | 'view-reports' | 'manage-workshops' | 'open-settings';
  label: string;
  icon: LucideIconData;
  description: string;
}

export interface HomeAlert {
  title: string;
  description: string;
  level: 'high' | 'medium' | 'low';
}
