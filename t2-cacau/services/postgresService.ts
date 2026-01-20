import { FrotaView } from '../types';

export const PostgresService = {
  /**
   * Busca a lista de motoristas/frota disponível diretamente do n8n.
   * Endpoint: https://n8n.datastack.viagroup.com.br/webhook/frota
   */
  getFrotaDisponivel: async (): Promise<FrotaView[]> => {
    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/frota');
      
      if (!response.ok) {
        throw new Error(`Erro na requisição n8n: ${response.status}`);
      }
      
      const data: FrotaView[] = await response.json();
      return data;
    } catch (error) {
      console.error('Falha ao buscar frota do n8n:', error);
      // Retorna array vazio para não quebrar a tela, mas loga o erro
      return [];
    }
  }
};