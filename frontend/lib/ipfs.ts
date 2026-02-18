const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

/**
 * Returns a full IPFS image URL for display.
 * If cid is already a full URL, returns as-is. Otherwise prefixes with Pinata gateway.
 */
export function ipfsImageUrl(cid: string | undefined | null): string {
  if (!cid || typeof cid !== "string") return "/placeholder.svg";
  const trimmed = cid.trim();
  if (!trimmed) return "/placeholder.svg";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("ipfs://")) return `${PINATA_GATEWAY}/ipfs/${trimmed.replace("ipfs://", "")}`;
  return `${PINATA_GATEWAY}/ipfs/${trimmed}`;
}
