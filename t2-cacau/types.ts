export interface Origem {
  id: string;
  nome: string;
}

export interface Destino {
  id: string;
  nome: string;
}

export type ProdutoTipo = "Manteiga" | "Licor" | "Manteiga Raw" | "Licor Raw";

export const PRODUTOS: ProdutoTipo[] = ["Manteiga", "Licor", "Manteiga Raw", "Licor Raw"];

export interface Carga {
  id: string;
  origemId: string;
  destinoId: string;
  dataColeta: string; // YYYY-MM-DD
  horarioAgendamento: string; // HH:mm
  produto: ProdutoTipo;
  
  // Transport Data (Optional - Assigned later)
  motoristaNome?: string;
  placaCavalo?: string;
  placaCarreta?: string;
  motoristaTelefone?: string; // New V5 field

  // New Status Field (V4)
  statusCavaloConfirmado?: boolean;
}

export interface Restricao {
  id: string;
  motoristaNome: string;
  placaCavalo: string;
  placaCarreta: string;
  dataParou: string; // YYYY-MM-DD
  dataVoltou: string; // YYYY-MM-DD
  observacao: string;
}

// New Interface for Driver Contacts (V4)
export interface ContatoMotorista {
  id: string;
  motoristaNome: string;
  telefone: string; // Format: 55999999999
}

// Matches the SQL View provided
export interface FrotaView {
  CAVALO: string;
  CARRETA: string;
  EVO_DESCRICAO_RESUMIDA: string;
  VALOR: number;
  PLANTA: string;
  COD_PESSOA: string;
  MOTORISTA: string;
  MODALIDADE: string;
  DESTINO: string | null;
}