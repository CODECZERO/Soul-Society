let cachedRate: number | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // Cache for 5 minutes

const FALLBACK_RATE = 15 // Fallback if API fails

export async function getExchangeRate(): Promise<number> {
  const now = Date.now()

  // Return cached rate if still valid
  if (cachedRate !== null && now - lastFetchTime < CACHE_DURATION) {
    return cachedRate
  }

  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=inr")
    const data = await response.json()
    const rate = data.stellar?.inr || FALLBACK_RATE
    cachedRate = rate
    lastFetchTime = now
    return rate
  } catch (error) {
    console.error("[v0] Failed to fetch exchange rate:", error)
    return cachedRate || FALLBACK_RATE
  }
}

export function convertRsToXlm(amountInRs: number, rate: number): number {
  return amountInRs / rate
}

export function convertXlmToRs(amountInXlm: number, rate: number): number {
  return amountInXlm * rate
}
