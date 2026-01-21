
export interface FrotaMotorista {
  CAVALO: string;
  CARRETA: string;
  MOTORISTA: string;
  PLANTA: string;
  MODALIDADE: string;
  DESTINO: string;
  EVO_DESCRICAO_RESUMIDA: string;
  VALOR: string;
}

export const n8nService = {
  async getFrotaMotoristas(): Promise<FrotaMotorista[]> {
    console.log("[n8nService] getFrotaMotoristas - Iniciando busca de dados da frota");
    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/frota');
      
      if (!response.ok) {
        throw new Error(`Erro n8n: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[n8nService] getFrotaMotoristas - Sucesso:", data.length, "motoristas encontrados");
      return data;
    } catch (error) {
      console.error("[n8nService] getFrotaMotoristas - Erro:", error);
      throw error;
    }
  }
};
