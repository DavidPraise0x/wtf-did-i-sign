/**
 * system.js - Solana System Program decoder
 *
 * Program ID: 11111111111111111111111111111111
 * Handles the native System Program instructions that deal with SOL transfers,
 * account creation, assignment, and allocation.
 */

export const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';

const LAMPORTS_PER_SOL = 1_000_000_000;
const LARGE_TRANSFER_THRESHOLD_SOL = 10;

/**
 * Decode a parsed System Program instruction.
 *
 * @param {object} instruction - The parsed instruction from getParsedTransaction
 * @returns {{ type: string, description: string, details: object, riskFlags: Array }}
 */
export function decodeSystemInstruction(instruction) {
  const parsed = instruction?.parsed;
  const type = parsed?.type ?? 'unknown';
  const info = parsed?.info ?? {};

  switch (type) {
    case 'transfer':
      return decodeTransfer(info);
    case 'createAccount':
      return decodeCreateAccount(info);
    case 'assign':
      return decodeAssign(info);
    case 'allocate':
      return decodeAllocate(info);
    default:
      return {
        type,
        description: `System Program instruction: ${type}`,
        details: info,
        riskFlags: [],
      };
  }
}

// ── Private helpers ──────────────────────────────────────────────────────────

function decodeTransfer(info) {
  const lamports = Number(info.lamports ?? 0);
  const sol = lamports / LAMPORTS_PER_SOL;
  const destination = info.destination ?? 'unknown';
  const source = info.source ?? 'unknown';

  const riskFlags = [];
  if (sol > LARGE_TRANSFER_THRESHOLD_SOL) {
    riskFlags.push({
      severity: 'medium',
      label: 'Large SOL transfer',
      description: `Transferring ${sol} SOL (> ${LARGE_TRANSFER_THRESHOLD_SOL} SOL threshold).`,
    });
  }

  return {
    type: 'transfer',
    description: `Transferred ${sol} SOL to ${destination}`,
    details: { source, destination, lamports, sol },
    riskFlags,
  };
}

function decodeCreateAccount(info) {
  const lamports = Number(info.lamports ?? 0);
  const sol = lamports / LAMPORTS_PER_SOL;
  const space = Number(info.space ?? 0);
  const newAccount = info.newAccount ?? 'unknown';
  const source = info.source ?? 'unknown';
  const owner = info.owner ?? 'unknown';

  return {
    type: 'createAccount',
    description: `Created account ${newAccount} with ${sol} SOL (${space} bytes) owned by ${owner}`,
    details: { source, newAccount, lamports, sol, space, owner },
    riskFlags: [],
  };
}

function decodeAssign(info) {
  const account = info.account ?? 'unknown';
  const owner = info.owner ?? 'unknown';

  return {
    type: 'assign',
    description: `Assigned account ${account} to program ${owner}`,
    details: { account, owner },
    riskFlags: [],
  };
}

function decodeAllocate(info) {
  const account = info.account ?? 'unknown';
  const space = Number(info.space ?? 0);

  return {
    type: 'allocate',
    description: `Allocated ${space} bytes for account ${account}`,
    details: { account, space },
    riskFlags: [],
  };
}
