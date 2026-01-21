import { FrotaView } from '../types';

// Dados estáticos simplificados para uso sem banco de dados (Mock)
// Isso substitui a chamada complexa ao banco de dados PostgreSQL
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
  }
];

// Mantivemos o nome "PostgresService" apenas para não quebrar a importação nas outras páginas,
// mas ele agora serve apenas dados locais (Mock).
export const PostgresService = {
  getFrotaDisponivel: async (): Promise<FrotaView[]> => {
    // Retorna os dados estáticos imediatamente (Simulando uma API rápida)
    return Promise.resolve(FROTA_MOCK);
  }
};