import winston from 'winston';
/**
 * Dedicated logger for data compression metrics.
 * Tracks: original size, compressed size, ratio, and decompressed size.
 * Output: server/logs/compression.log
 */
declare const compressionLogger: winston.Logger;
export interface CompressionMetrics {
    collection: string;
    id: string;
    originalBytes: number;
    compressedBytes: number;
    ratio: string;
    savedBytes: number;
    savedPercent: string;
}
export interface DecompressionMetrics {
    collection: string;
    id: string;
    compressedBytes: number;
    decompressedBytes: number;
    ratio: string;
}
export declare function logCompression(metrics: CompressionMetrics): void;
export declare function logDecompression(metrics: DecompressionMetrics): void;
export default compressionLogger;
//# sourceMappingURL=compressionLogger.d.ts.map