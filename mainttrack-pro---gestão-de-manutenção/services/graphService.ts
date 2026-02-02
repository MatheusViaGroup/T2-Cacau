
import { Client } from "@microsoft/microsoft-graph-client";

const SITE_PATHS = {
    POWERAPPS: { host: "vialacteoscombr.sharepoint.com", path: "/sites/Powerapps" }
};

export const LISTS = {
    MANUTENCOES: { id: "8a610e5f-a2e2-487b-8623-8fd07910fcf8", siteRef: "POWERAPPS" as const },
    USUARIOS: { id: "70f8aa21-b3ac-411e-a49b-18740d2d713d", siteRef: "POWERAPPS" as const },
    PLANTAS: { id: "27445107-a454-4cf0-8dc7-50e276abe65f", siteRef: "POWERAPPS" as const },
    AREAS: { id: "1e7897ce-c6c0-4824-91b3-7aa0d4836070", siteRef: "POWERAPPS" as const },
    OFICINAS: { id: "27d52937-d870-4840-80e3-1d65b6427a0d", siteRef: "POWERAPPS" as const },
    ATIVOS: { id: "c7e4a3c3-7683-4ad2-a771-5d010ef1b3bc", siteRef: "POWERAPPS" as const },
    PRODUTOS: { id: "9097abea-fabb-4643-ad50-61c689b1c86c", siteRef: "POWERAPPS" as const }
};

export class GraphService {
    private client: Client;
    private siteIds: Record<string, string> = {};

    constructor(token: string) {
        this.client = Client.init({
            authProvider: (done) => done(null, token)
        });
    }

    async resolveSites() {
        console.log("GraphService: Resolvendo IDs dos sites...");
        for (const [key, config] of Object.entries(SITE_PATHS)) {
            try {
                const site = await this.client.api(`/sites/${config.host}:${config.path}`).get();
                this.siteIds[key] = site.id;
                console.log(`GraphService: Site ${key} ok -> ${site.id}`);
            } catch (error: any) {
                console.error(`GraphService: Erro ao resolver site ${key}:`, error.message);
            }
        }
    }

    async getListItems(listConfig: { id: string, siteRef: string }) {
        const siteId = this.siteIds[listConfig.siteRef];
        if (!siteId) {
            console.warn(`GraphService: Site ID não resolvido para ${listConfig.siteRef}`);
            return [];
        }

        try {
            const response = await this.client
                .api(`/sites/${siteId}/lists/${listConfig.id}/items`)
                .expand("fields")
                .top(999)
                .get();
            
            return response.value.map((item: any) => ({
                id: item.id,
                ...item.fields
            }));
        } catch (error: any) {
            console.error(`GraphService: Erro ao ler lista ${listConfig.id}:`, error.message);
            return [];
        }
    }

    async createItem(listConfig: { id: string, siteRef: string }, fields: any) {
        const siteId = this.siteIds[listConfig.siteRef];
        if (!siteId) throw new Error("SiteID não disponível");
        
        return await this.client
            .api(`/sites/${siteId}/lists/${listConfig.id}/items`)
            .post({ fields });
    }

    async updateItem(listConfig: { id: string, siteRef: string }, itemId: string, fields: any) {
        const siteId = this.siteIds[listConfig.siteRef];
        if (!siteId) throw new Error("SiteID não disponível");
        
        return await this.client
            .api(`/sites/${siteId}/lists/${listConfig.id}/items/${itemId}/fields`)
            .patch(fields);
    }

    async deleteItem(listConfig: { id: string, siteRef: string }, itemId: string) {
        const siteId = this.siteIds[listConfig.siteRef];
        if (!siteId) throw new Error("SiteID não disponível");
        
        return await this.client
            .api(`/sites/${siteId}/lists/${listConfig.id}/items/${itemId}`)
            .delete();
    }
}
