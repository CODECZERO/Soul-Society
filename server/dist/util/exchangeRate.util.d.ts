/**
 * Get current XLM to INR exchange rate
 * Uses CoinGecko API with caching
 */
export declare function getXLMtoINRRate(): Promise<number>;
/**
 * Convert XLM amount to INR
 */
export declare function convertXLMtoINR(xlmAmount: number): Promise<number>;
/**
 * Convert INR amount to XLM
 */
export declare function convertINRtoXLM(inrAmount: number): Promise<number>;
//# sourceMappingURL=exchangeRate.util.d.ts.map