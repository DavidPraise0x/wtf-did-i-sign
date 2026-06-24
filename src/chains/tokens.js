import { formatUnits } from 'ethers';

/**
 * Known token metadata lookup dictionary (for formatting symbols and decimals)
 * Covers major tokens on supported chains to ensure premium UX.
 */

export const KNOWN_TOKENS = {
  // --- Ethereum (Chain ID 1) ---
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', decimals: 18 },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { symbol: 'WBTC', decimals: 8 },
  '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', decimals: 18 },

  // --- Base (Chain ID 8453) ---
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { symbol: 'USDC', decimals: 6 },
  '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18 },

  // --- Polygon (Chain ID 137) ---
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': { symbol: 'USDC', decimals: 6 },
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: 'USDC.e', decimals: 6 },
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6 },
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': { symbol: 'WETH', decimals: 18 },

  // --- Arbitrum (Chain ID 42161) ---
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831': { symbol: 'USDC', decimals: 6 },
  '0xff970a61a23b80415820337536446814124c2941': { symbol: 'USDC.e', decimals: 6 },
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': { symbol: 'USDT', decimals: 6 },
  '0x82af49447d8a07e3bd95bd0d56f352415231aa11': { symbol: 'WETH', decimals: 18 },

  // --- Solana (Mint Addresses) ---
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6 },
  'So11111111111111111111111111111111111111112': { symbol: 'wSOL', decimals: 9 },
  'DezXAZ8z7PnrnRJjz3wXqpR2R9S1YJmXcsjA1YXYwt6':  { symbol: 'BONK', decimals: 5 },
  'JUPyiwrYd2hx74V08R1Ym686ZO1m42wXJgUP5C1c32M3': { symbol: 'JUP', decimals: 6 },
};

/**
 * Look up token metadata (symbol, decimals) by address or mint
 * @param {string} address - Token address or mint (case-insensitive)
 * @returns {{ symbol: string, decimals: number } | null}
 */
export function getTokenMetadata(address) {
  if (!address) return null;
  const cleaned = address.toLowerCase().trim();
  // Check case-insensitive for EVM addresses
  if (cleaned.startsWith('0x')) {
    return KNOWN_TOKENS[cleaned] || null;
  }
  // Case-sensitive check for Solana mints
  const solAddress = address.trim();
  return KNOWN_TOKENS[solAddress] || null;
}

/**
 * Format a raw token amount into a human-readable string with symbol
 * @param {string} address - Token address or mint
 * @param {string|number|bigint} rawAmount - Raw amount
 * @returns {string} Formatted string
 */
export function formatTokenAmount(address, rawAmount) {
  if (rawAmount == null) return '0';
  const meta = getTokenMetadata(address);
  const rawStr = String(rawAmount);
  if (!meta) {
    // If not a known token, show raw amount and short address
    const shortAddr = address && address.startsWith('0x') ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
    return `${rawStr} (token: ${shortAddr})`;
  }
  try {
    const bigVal = BigInt(rawStr);
    // Check if amount represents unlimited approval (MaxUint256 or MaxUint64)
    if (bigVal >= 115792089237316195423570985008687907853269984665640564039457584007913129639900n ||
        bigVal === 18446744073709551615n) {
      return `UNLIMITED ${meta.symbol}`;
    }
    const formatted = formatUnits(bigVal, meta.decimals);
    // Remove trailing zeros to make it clean
    const cleaned = parseFloat(formatted).toString();
    return `${cleaned} ${meta.symbol}`;
  } catch {
    return `${rawStr} ${meta.symbol}`;
  }
}
