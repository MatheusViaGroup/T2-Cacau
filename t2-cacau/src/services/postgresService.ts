import { FrotaView } from '../types';

// Dados simulados da frota (anteriormente vinham do PostgreSQL)
const FROTA_MOCK: FrotaView[] = [
  {
    CAVALO: "ABC-1234",
    CARRETA: "CAR-1001",
    EVO_DESCRICAO_RESUMIDA: "Volvo FH 540",
    VALOR: 0,
    PLANTA: "Planta Bahia",
    COD_PESSOA: "MOT-01",
    MOTORISTA: "João Silva",
    MODALIDADE: "FROTA",
    DESTINO: null
  },
  {
    CAVALO: "XYZ-9876",
    CARRETA: "CAR-2002",
    EVO_DESCRICAO_RESUMIDA: "Scania R450",
    VALOR: 0,
    PLANTA: "Planta Bahia",
    COD_PESSOA: "MOT-02",
    MOTORISTA: "Maria Oliveira",
    MODALIDADE: "FROTA",
    DESTINO: null
  },
  {
     CAVALO: "TOP-1000",
     CARRETA: "CAR-3000",
     EVO_DESCRICAO_RESUMIDA: "Mercedes Actros",
     VALOR: 0,
     PLANTA: "Planta Bahia",
     COD_PESSOA: "MOT-03",
     MOTORISTA: "Carlos Pereira",
     MODALIDADE: "AGREGADO",
     DESTINO: null
  },
  {
     CAVALO: "T2-0001",
     CARRETA: "BAU-001",
     EVO_DESCRICAO_RESUMIDA: "Volvo FH 460",
     VALOR: 0,
     PLANTA: "Planta Bahia",
     COD_PESSOA: "MOT-04",
     MOTORISTA: "José Santos",
     MODALIDADE: "FROTA",
     DESTINO: null
  },
  {
    CAVALO: "T2-0002",
    CARRETA: "BAU-002",
    EVO_DESCRICAO_RESUMIDA: "DAF XF",
    VALOR: 0,
    PLANTA: "Planta Bahia",
    COD_PESSOA: "MOT-05",
    MOTORISTA: "Ana Costa",
    MODALIDADE: "FROTA",
    DESTINO: null
 }
];

// Mantivemos o nome "PostgresService" apenas para não quebrar a importação nas outras páginas,
// mas ele agora serve apenas dados locais.
export const PostgresService = {
  getFrotaDisponivel: async (): Promise<FrotaView[]> => {
    // Simula uma chamada assíncrona, mas retorna os dados locais imediatamente
    return Promise.resolve(FROTA_MOCK);
  }
};