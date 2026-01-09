export interface Reseller {
  _id?: string;
  name: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AppType = 'hrms' | 'social-media' | 'backend-assist';

export interface ResellerApp {
  _id?: string;
  resellerId: string;
  appType: AppType;
  host: string;
  settings?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResellerWithApps extends Reseller {
  apps: ResellerApp[];
}