const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

/**
 * Returns a full IPFS image URL for display.
 * If cid is already a full URL, returns as-is. Otherwise prefixes with Pinata gateway.
 */
export function ipfsImageUrl(cid: string | undefined | null): string {
  if (!cid || typeof cid !== "string") return "/placeholder.svg";
  const trimmed = cid.trim();
  if (!trimmed) return "/placeholder.svg";

  // If it's already a full URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  // Format gateway URL - ensure it has a protocol
  let gateway = PINATA_GATEWAY;
  if (gateway && !gateway.startsWith('http')) {
    gateway = `https://${gateway}`;
  }

  // Clean the CID and construct URL
  const cleanCid = trimmed.replace("ipfs://", "").replace(/^\/ipfs\//, "");
  return `${gateway}/ipfs/${cleanCid}`;
}
