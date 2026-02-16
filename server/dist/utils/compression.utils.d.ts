export interface CompressResult {
    buffer: Buffer;
    originalSize: number;
    compressedSize: number;
}
export interface DecompressResult {
    data: any;
    compressedSize: number;
    decompressedSize: number;
}
/**
 * Compresses an object into a Zstandard buffer.
 * Returns buffer + size metrics for logging.
 */
export declare function compressData(data: any): Promise<CompressResult>;
/**
 * Decompresses a Zstandard buffer back into an object.
 * Returns parsed data + size metrics for logging.
 */
export declare function decompressData(compressed: Buffer): Promise<DecompressResult>;
//# sourceMappingURL=compression.utils.d.ts.map