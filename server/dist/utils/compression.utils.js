import { ZstdCodec } from 'zstd-codec';
let zstdInstance = null;
async function getZstd() {
    if (!zstdInstance) {
        zstdInstance = await new Promise((resolve) => {
            ZstdCodec.run((zstd) => resolve(new zstd.Simple()));
        });
    }
    return zstdInstance;
}
/**
 * Compresses an object into a Zstandard buffer.
 * Zstd offers much faster compression/decompression speeds than LZMA.
 */
export async function compressData(data) {
    const zstd = await getZstd();
    const jsonStr = JSON.stringify(data);
    const input = Buffer.from(jsonStr);
    const compressed = zstd.compress(input);
    return Buffer.from(compressed);
}
/**
 * Decompresses a Zstandard buffer back into an object.
 */
export async function decompressData(compressed) {
    const zstd = await getZstd();
    const decompressed = zstd.decompress(compressed);
    const jsonStr = Buffer.from(decompressed).toString();
    return JSON.parse(jsonStr);
}
//# sourceMappingURL=compression.utils.js.map