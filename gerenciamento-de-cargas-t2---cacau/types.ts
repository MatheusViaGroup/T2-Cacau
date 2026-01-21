
export type ProdutoType = 'Manteiga' | 'Licor' | 'Manteiga Raw' | 'Licor Raw';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export interface T2_Origem {
  ID?: number;
  NomeLocal: string;
}

export interface T2_Destino {
  ID?: number;
  NomeLocal: string;
}

export interface T2_Telefone {
  ID?: number;
  NomeMotorista: string;
  TelefoneWhatsapp: string;
}

export interface T2_Restricao {
  ID?: number;
  Motorista: string;
  PlacaCavalo: string;
  PlacaCarreta: string;
  DataParou: string;
  DataVoltou: string;
  Observação: string;
}

export interface T2_Carga {
  ID?: number;
  CargaId: string;
  Origem: string;
  Destino: string;
  DataColeta: string;
  HorarioAgendamento: string;
  Produto: ProdutoType;
  MotoristaNome: string;
  PlacaCavalo: string;
  PlacaCarreta: string;
  MotoristaTelefone: string;
  StatusCavaloConfirmado: boolean;
  StatusSistema: string;
}

export enum Screen {
  CARGAS = 'CARGAS',
  RESTRICOES = 'RESTRICOES',
  ADMIN = 'ADMIN'
}
