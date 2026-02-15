// Cache for exchange rate to avoid too many API calls
let cachedRate = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache
/**
 * Get current XLM to INR exchange rate
 * Uses CoinGecko API with caching
 */
export async function getXLMtoINRRate() {
    const now = Date.now();
    // Return cached rate if still valid
    if (cachedRate && (now - lastFetchTime) < CACHE_DURATION) {
        return cachedRate;
    }
    try {
        // Fetch from CoinGecko API using native fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=inr", { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.stellar && data.stellar.inr) {
            const rate = data.stellar.inr;
            if (typeof rate === 'number' && rate > 0) {
                cachedRate = rate;
                lastFetchTime = now;
                console.log(`✅ XLM/INR rate updated: ₹${cachedRate}`);
                return cachedRate;
            }
        }
        // Fallback to default rate if API response is invalid
        console.warn("⚠️  Invalid CoinGecko response, using fallback rate");
        return 28.60; // Fallback rate
    }
    catch (error) {
        console.error("❌ Error fetching XLM/INR rate:", error.message);
        // Return cached rate if available, otherwise use fallback
        if (cachedRate) {
            console.log(`ℹ️  Using cached rate: ₹${cachedRate}`);
            return cachedRate;
        }
        console.log("ℹ️  Using fallback rate: ₹28.60");
        return 28.60; // Fallback rate
    }
}
/**
 * Convert XLM amount to INR
 */
export async function convertXLMtoINR(xlmAmount) {
    const rate = await getXLMtoINRRate();
    return Math.round(xlmAmount * rate);
}
/**
 * Convert INR amount to XLM
 */
export async function convertINRtoXLM(inrAmount) {
    const rate = await getXLMtoINRRate();
    return inrAmount / rate;
}
//# sourceMappingURL=exchangeRate.util.js.map