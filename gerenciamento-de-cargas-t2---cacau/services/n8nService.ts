
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
  /**
   * Busca dados da frota no n8n com extração robusta de resultados.
   * O n8n muitas vezes encapsula a resposta em objetos dependendo do nó de saída.
   */
  async getFrotaMotoristas(): Promise<FrotaMotorista[]> {
    console.log("[n8nService] getFrotaMotoristas - Iniciando requisição ao Webhook");
    
    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/frota');
      
      if (!response.ok) {
        console.error(`[n8nService] Erro HTTP: ${response.status} ${response.statusText}`);
        throw new Error(`Erro na comunicação com n8n: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // LOG DE DIAGNÓSTICO: Extremamente importante para identificar a estrutura real
      console.log("[n8nService] Resposta bruta recebida do n8n:", rawData);

      let finalArray: FrotaMotorista[] = [];

      // LÓGICA DE EXTRAÇÃO DEFENSIVA
      if (Array.isArray(rawData)) {
        console.log("[n8nService] Formato detectado: Array Direto");
        finalArray = rawData;
      } 
      else if (rawData && typeof rawData === 'object') {
        console.log("[n8nService] Formato detectado: Objeto. Tentando extrair array de chaves conhecidas...");
        
        // Tenta encontrar o array em propriedades comuns
        const potentialArray = 
          rawData.data || 
          rawData.value || 
          rawData.motoristas || 
          rawData.items || 
          rawData.rows;

        if (Array.isArray(potentialArray)) {
          console.log("[n8nService] Array extraído com sucesso de uma sub-chave");
          finalArray = potentialArray;
        } else {
          console.warn("[n8nService] Objeto recebido mas nenhuma chave de array válida foi encontrada", Object.keys(rawData));
          // Se o objeto em si contém as propriedades do motorista (único item)
          if (rawData.MOTORISTA) {
             console.log("[n8nService] Único motorista detectado fora de array. Encapsulando...");
             finalArray = [rawData];
          }
        }
      }

      console.log(`[n8nService] Processamento concluído. Itens validados: ${finalArray.length}`);
      
      // Garante que o retorno seja sempre um array para evitar crashes no frontend (.filter, .map)
      return finalArray;

    } catch (error) {
      console.error("[n8nService] Erro crítico ao processar frota:", error);
      
      // Retorno resiliente: nunca retorna undefined para não quebrar o UI
      return [];
    }
  }
};
