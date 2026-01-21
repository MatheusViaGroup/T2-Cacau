
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
  CargaId: string;
  Origem: string;
  Destino: string;
  DataColeta: string;
  HorarioAgendamento: string;
  Produto: string;
  MotoristaNome: string;
  PlacaCavalo: string;
  PlacaCarreta: string;
  MotoristaTelefone: string;
  StatusCavaloConfirmado: boolean;
  StatusSistema: string;
}

export interface Restricao {
  id: string;
  Motorista: string;
  PlacaCavalo: string;
  PlacaCarreta: string;
  DataParou: string;
  DataVoltou: string;
  Observação: string;
}

export interface AdminListItem {
  id: string;
  Title?: string;
  NomeLocal?: string;
  NomeMotorista?: string;
  TelefoneWhatsapp?: string;
}

export interface SharePointFields {
  id: string;
  fields: {
    [key: string]: any;
  };
}
