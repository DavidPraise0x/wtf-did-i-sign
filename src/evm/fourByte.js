/**
 * 4byte.directory API lookup for unknown function selectors.
 *
 * When a transaction's input data doesn't match any of our bundled ABIs
 * we fall back to 4byte.directory – a public registry that maps 4-byte
 * selectors to their text signatures (e.g. "transfer(address,uint256)").
 *
 * Results are cached in-memory so the same selector is never fetched twice.
 */

const FOUR_BYTE_API = 'https://www.4byte.directory/api/v1/signatures/';
const TIMEOUT_MS = 3_000;

/** @type {Map<string, string | null>} selector → text signature */
const cache = new Map();

/**
 * Look up a 4-byte function selector against 4byte.directory.
 *
 * @param {string} selector  Hex selector including '0x' prefix, e.g. '0xa9059cbb'
 * @returns {Promise<string | null>}  The most popular text signature, or null on miss / error.
 */
export async function lookupSelector(selector) {
  // Normalise to lowercase 10-char hex (0x + 8 hex digits)
  const key = selector.toLowerCase().slice(0, 10);

  // Return from cache if we already looked this up
  if (cache.has(key)) {
    return cache.get(key);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const url = `${FOUR_BYTE_API}?hex_signature=${key}&ordering=id`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      cache.set(key, null);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      cache.set(key, null);
      return null;
    }

    // The first result (ordered by id, ascending) is typically the most
    // canonical / popular signature.
    const textSig = data.results[0].text_signature ?? null;
    cache.set(key, textSig);
    return textSig;
  } catch (_err) {
    // Network errors, timeouts, JSON parse failures – all swallowed.
    cache.set(key, null);
    return null;
  }
}

/**
 * Extract just the function name from a text signature string.
 * e.g. "transfer(address,uint256)" → "transfer"
 *
 * @param {string} textSignature
 * @returns {string}
 */
export function extractFunctionName(textSignature) {
  if (!textSignature) return 'unknown';
  const idx = textSignature.indexOf('(');
  return idx > 0 ? textSignature.slice(0, idx) : textSignature;
}
