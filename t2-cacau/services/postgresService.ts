import { FrotaView } from '../types';

// Fallback data in case the Node.js server is not running
const FALLBACK_DATA: FrotaView[] = [
  {
    CAVALO: "ABC-1234",
    CARRETA: "CAR-9876",
    EVO_DESCRICAO_RESUMIDA: "Volvo FH 540",
    VALOR: 50000,
    PLANTA: "Planta Bahia",
    COD_PESSOA: "MOT001",
    MOTORISTA: "Carlos Santos (DADOS FICTÍCIOS - LIGUE O SERVIDOR)",
    MODALIDADE: "FROTA",
    DESTINO: null
  }
];

export const PostgresService = {
  /**
   * Fetches fleet data from the local Node.js BFF (Backend for Frontend).
   * 
   * IMPORTANT: Browsers cannot connect directly to PostgreSQL (TCP/IP).
   * You must run 'node server.js' to act as the bridge.
   */
  getFrotaDisponivel: async (): Promise<FrotaView[]> => {
    try {
      const response = await fetch('http://localhost:3001/api/frota');
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data: FrotaView[] = await response.json();
      return data;
    } catch (error) {
      console.warn('Failed to connect to local BFF server (http://localhost:3001). Using fallback data.');
      console.warn('Please ensure you are running "node server.js" in the terminal.');
      return FALLBACK_DATA;
    }
  }
};
