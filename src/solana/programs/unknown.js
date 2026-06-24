/**
 * unknown.js - Fallback decoder for unrecognised Solana programs
 *
 * Any instruction whose programId doesn't match a known decoder is routed
 * here.  We surface basic details and flag a medium-severity risk so the
 * user is aware they interacted with an unverified contract.
 */

/**
 * Decode an instruction from an unknown / unrecognised program.
 *
 * @param {object} instruction - The instruction object from getParsedTransaction
 * @returns {{ type: string, description: string, details: object, riskFlags: Array }}
 */
export function decodeUnknownInstruction(instruction) {
  const programId = instruction?.programId?.toString?.() ?? instruction?.programId ?? 'unknown';
  const data = instruction?.data ?? null;
  const accounts = (instruction?.accounts ?? []).map(
    (a) => a?.pubkey?.toString?.() ?? a?.toString?.() ?? a
  );

  return {
    type: 'unknown',
    description: `Interacted with unknown program ${programId}`,
    details: {
      programId,
      accountCount: accounts.length,
      accounts: accounts.slice(0, 10), // cap for readability
      ...(data ? { rawData: data } : {}),
    },
    riskFlags: [
      {
        severity: 'medium',
        label: 'Unknown program interaction',
        description:
          `This transaction interacted with program ${programId} which is not in the ` +
          'recognised program registry. Verify manually before trusting the results.',
      },
    ],
  };
}
