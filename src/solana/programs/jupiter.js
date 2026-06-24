/**
 * jupiter.js - Jupiter Aggregator decoder
 *
 * Jupiter is the leading DEX aggregator on Solana.  Multiple program versions
 * have shipped over time; we recognise the most widely-used ones.
 *
 * Because Jupiter instructions use Anchor-serialised data and we don't bundle
 * the full IDL, we simply label the instruction.  The actual swap details
 * (tokens in/out, amounts) are derived from the transaction's balance changes
 * inside decoder.js.
 */

/** Known Jupiter program IDs mapped to a human-readable version label. */
export const JUPITER_PROGRAM_IDS = {
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter v6',
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcPX7rE': 'Jupiter v4',
  'JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph':  'Jupiter v3',
  'jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu':  'Jupiter Limit Order',
  'DCA265Vj8a9CEuX1eb1LWRnDT7uK6q1xMipnNyatn23M': 'Jupiter DCA',
};

/**
 * Check whether a program ID belongs to Jupiter.
 *
 * @param {string} programId
 * @returns {boolean}
 */
export function isJupiterProgram(programId) {
  return programId in JUPITER_PROGRAM_IDS;
}

/**
 * Decode a Jupiter instruction.
 *
 * @param {object} instruction - The instruction object from getParsedTransaction
 * @returns {{ type: string, description: string, details: object, riskFlags: Array }}
 */
export function decodeJupiterInstruction(instruction) {
  const programId = instruction?.programId?.toString?.() ?? instruction?.programId ?? 'unknown';
  const version = JUPITER_PROGRAM_IDS[programId] ?? 'Jupiter (unknown version)';

  // Try to extract any data hint (Anchor discriminator, etc.)
  const data = instruction?.data ?? null;
  const accounts = (instruction?.accounts ?? []).map(
    (a) => a?.pubkey?.toString?.() ?? a?.toString?.() ?? a
  );

  return {
    type: 'jupiterSwap',
    description: `Executed swap via ${version}`,
    details: {
      programId,
      version,
      accountCount: accounts.length,
      // Include the raw base-58 data in case downstream tools want to decode it
      ...(data ? { rawData: data } : {}),
    },
    riskFlags: [],
  };
}
