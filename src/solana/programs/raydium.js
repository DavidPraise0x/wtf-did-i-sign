/**
 * raydium.js - Raydium DEX decoder
 *
 * Raydium operates several on-chain programs for different pool types.
 * We recognise the three main ones:
 *   • AMM V4  – classic constant-product AMM
 *   • CLMM    – concentrated-liquidity market maker
 *   • CP-Swap – newer constant-product swap
 */

/** Map of known Raydium program IDs → pool type labels. */
export const RAYDIUM_PROGRAM_IDS = {
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'AMM V4',
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK': 'CLMM',
  'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C': 'CP-Swap',
};

/**
 * Check whether a program ID belongs to Raydium.
 *
 * @param {string} programId
 * @returns {boolean}
 */
export function isRaydiumProgram(programId) {
  return programId in RAYDIUM_PROGRAM_IDS;
}

/**
 * Decode a Raydium instruction.
 *
 * @param {object} instruction - The instruction object from getParsedTransaction
 * @returns {{ type: string, description: string, details: object, riskFlags: Array }}
 */
export function decodeRaydiumInstruction(instruction) {
  const programId = instruction?.programId?.toString?.() ?? instruction?.programId ?? 'unknown';
  const poolType = RAYDIUM_PROGRAM_IDS[programId] ?? 'Unknown Pool';

  const data = instruction?.data ?? null;
  const accounts = (instruction?.accounts ?? []).map(
    (a) => a?.pubkey?.toString?.() ?? a?.toString?.() ?? a
  );

  return {
    type: 'raydiumInteraction',
    description: `Interacted with Raydium ${poolType}`,
    details: {
      programId,
      poolType,
      accountCount: accounts.length,
      ...(data ? { rawData: data } : {}),
    },
    riskFlags: [],
  };
}
