/**
 * associated.js - Associated Token Account Program decoder
 *
 * Program ID: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL
 * Handles the ATA program, which creates deterministic token accounts
 * for a given wallet + mint pair.
 */

export const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

/**
 * Decode an Associated Token Account instruction.
 *
 * The ATA program doesn't produce rich parsed data the way System/Token do,
 * so we infer details from the accounts array when parsed info is unavailable.
 *
 * Account layout (create / createIdempotent):
 *   [0] fundingAccount  – payer
 *   [1] associatedAccount – the ATA being created
 *   [2] walletAddress   – owner of the ATA
 *   [3] splTokenMint    – the token mint
 *   [4] systemProgram
 *   [5] tokenProgram
 *
 * @param {object} instruction - The parsed instruction from getParsedTransaction
 * @returns {{ type: string, description: string, details: object, riskFlags: Array }}
 */
export function decodeAssociatedInstruction(instruction) {
  const parsed = instruction?.parsed;
  const info = parsed?.info ?? {};
  const type = parsed?.type ?? 'create';

  // Prefer parsed info when available
  let mint = info.mint ?? 'unknown';
  let owner = info.wallet ?? info.owner ?? 'unknown';
  let account = info.account ?? 'unknown';
  let payer = info.source ?? info.payer ?? 'unknown';

  // Fallback: extract from raw accounts list if parsed info is sparse
  if (mint === 'unknown' || owner === 'unknown') {
    const accounts = instruction?.accounts ?? [];
    if (accounts.length >= 4) {
      payer = accounts[0]?.pubkey?.toString?.() ?? accounts[0]?.toString?.() ?? payer;
      account = accounts[1]?.pubkey?.toString?.() ?? accounts[1]?.toString?.() ?? account;
      owner = accounts[2]?.pubkey?.toString?.() ?? accounts[2]?.toString?.() ?? owner;
      mint = accounts[3]?.pubkey?.toString?.() ?? accounts[3]?.toString?.() ?? mint;
    }
  }

  return {
    type: type === 'create' || type === 'createIdempotent'
      ? 'createAssociatedTokenAccount'
      : type,
    description: `Created associated token account for ${mint} owned by ${owner}`,
    details: { payer, account, owner, mint },
    riskFlags: [],
  };
}
