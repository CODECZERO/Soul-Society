export declare class SeireiteiVaultService {
    private server;
    private adminKeypair;
    /**
     * Stores any data object on-chain in a specific collection.
     */
    put(collection: string, id: string, data: any, skipIndex?: boolean): Promise<void>;
    /**
     * Stores a record with a secondary index (e.g., Email lookup).
     */
    putWithIndex(collection: string, id: string, data: any, indexField: string, indexValue: string): Promise<void>;
    /**
     * Retrieves a record ID using a secondary index.
     */
    getByIndex(collection: string, indexField: string, indexValue: string): Promise<any | null>;
    /**
     * Updates the systemic collection index on-chain.
     */
    private updateIndex;
    /**
     * Retrieves all records for a collection.
     */
    getAll(collection: string): Promise<any[]>;
    /**
     * Retrieves and decompresses data from the vault.
     */
    get(collection: string, id: string): Promise<any | null>;
}
export declare const seireiteiVault: SeireiteiVaultService;
//# sourceMappingURL=seireiteiVault.service.d.ts.map