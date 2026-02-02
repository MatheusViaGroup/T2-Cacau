
export enum MaintenanceStatus {
  NOT_STARTED = 'Não iniciada',
  IN_PROGRESS = 'Em andamento',
  COMPLETED = 'Concluída',
  RETORNO_COMPRAS = 'Retorno Compras'
}

export enum MaintenanceType {
  SERVICE = 'Serviço',
  PURCHASE = 'Compra'
}

export const FIXED_CATEGORIES = [
  'Manutenção Preventiva',
  'Planejamento Corretiva',
  'Não Planejado',
  'Corretiva Emergencial'
] as const;

export type MaintenanceCategory = typeof FIXED_CATEGORIES[number];

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  COMPRAS = 'compras'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isSpecial: boolean;
  allowedPlants: string[]; // Array de plantas permitidas
}

export interface MaintenanceTask {
  id: string;
  title: string;
  type: MaintenanceType;
  productName?: string;
  plant: string;
  placa: string;
  area: string;
  category: string;
  location: string;
  plannedDate: string;
  plannedCost: number;
  status: MaintenanceStatus;
  description?: string;
  createdAt: string;
  orderNumber?: string;
  completionDate?: string;
  cost?: number;
  isWithPlan?: boolean;
  // Campos de Compras
  expectedArrivalDate?: string;
  negotiatedValue?: number;
  shippingValue?: number;
  vendor?: string;
}

export interface ConfigItem {
  id: string;
  name: string;
}

export interface LocationItem extends ConfigItem {
  plantName: string;
}

export interface PlacaItem extends ConfigItem {
  plantName: string;
}

export interface ProductItem extends ConfigItem {
  areaName: string;
}
