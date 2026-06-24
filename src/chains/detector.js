/**
 * Auto-detect blockchain from transaction hash format
 *
 * - Solana signatures: Base58 encoded, typically 87-88 characters
 * - EVM tx hashes: Hex string, '0x' prefix + 64 hex chars = 66 chars total
 */

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;
const EVM_TX_REGEX = /^0x[a-fA-F0-9]{64}$/;

/**
 * Detect the chain type from a transaction hash
 * @param {string} hash - The transaction hash to analyze
 * @returns {{ type: 'solana'|'evm'|'unknown', chain?: string }}
 */
export function detectChain(hash) {
  const trimmed = hash.trim();

  if (BASE58_REGEX.test(trimmed)) {
    return { type: 'solana', chain: 'solana' };
  }

  if (EVM_TX_REGEX.test(trimmed)) {
    return { type: 'evm', chain: null }; // User must pick specific EVM chain
  }

  return { type: 'unknown', chain: null };
}

/**
 * Validate a transaction hash format
 * @param {string} hash
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateHash(hash) {
  const trimmed = hash.trim();

  if (!trimmed) {
    return { valid: false, error: 'Please enter a transaction hash' };
  }

  if (trimmed.length < 20) {
    return { valid: false, error: 'Transaction hash is too short' };
  }

  const detected = detectChain(trimmed);
  if (detected.type === 'unknown') {
    return {
      valid: false,
      error: 'Unrecognized hash format. Solana hashes are ~88 chars (Base58). EVM hashes start with 0x followed by 64 hex characters.',
    };
  }

  return { valid: true };
}
