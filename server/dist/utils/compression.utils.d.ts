/**
 * Compresses an object into a Zstandard buffer.
 * Zstd offers much faster compression/decompression speeds than LZMA.
 */
export declare function compressData(data: any): Promise<Buffer>;
/**
 * Decompresses a Zstandard buffer back into an object.
 */
export declare function decompressData(compressed: Buffer): Promise<any>;
//# sourceMappingURL=compression.utils.d.ts.map