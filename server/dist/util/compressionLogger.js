import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '../../logs');
/**
 * Dedicated logger for data compression metrics.
 * Tracks: original size, compressed size, ratio, and decompressed size.
 * Output: server/logs/compression.log
 */
const compressionLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.printf(({ timestamp, message, ...meta }) => {
        return `[${timestamp}] ${message} | ${JSON.stringify(meta)}`;
    })),
    transports: [
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'compression.log'),
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 3,
        }),
    ],
});
export function logCompression(metrics) {
    compressionLogger.info('COMPRESS', {
        collection: metrics.collection,
        id: metrics.id,
        original: `${metrics.originalBytes}B`,
        compressed: `${metrics.compressedBytes}B`,
        ratio: metrics.ratio,
        saved: `${metrics.savedBytes}B (${metrics.savedPercent})`,
    });
}
export function logDecompression(metrics) {
    compressionLogger.info('DECOMPRESS', {
        collection: metrics.collection,
        id: metrics.id,
        compressed: `${metrics.compressedBytes}B`,
        decompressed: `${metrics.decompressedBytes}B`,
        ratio: metrics.ratio,
    });
}
export default compressionLogger;
//# sourceMappingURL=compressionLogger.js.map