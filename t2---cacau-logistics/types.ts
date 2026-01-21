
export enum ProductType {
  MANTEIGA = 'Manteiga',
  LICOR = 'Licor',
  AMENDOA = 'Amêndoa',
  TORTA = 'Torta'
}

export interface Driver {
  MOTORISTA: string;
  CAVALO: string;
  CARRETA: string;
}

export interface Carga {
  id: string;
  status: 'Pendente' | 'Confirmado';
  product: ProductType;
  origin: string;
  destination: string;
  date: string;
  time: string;
  driverName: string;
  truckPlate: string;
  trailerPlate: string;
  confirmed: boolean;
}

export interface Restricao {
  id: string;
  driverName: string;
  startDate: string;
  endDate: string;
  observation: string;
}

export interface AdminListItem {
  id: string;
  title: string;
  metadata?: string; // e.g., WhatsApp number for contacts
}

export interface SharePointFields {
  id: string;
  fields: {
    [key: string]: any;
  };
}
