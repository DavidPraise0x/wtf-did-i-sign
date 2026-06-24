/**
 * decoder.js - Main Solana transaction decoder orchestrator
 *
 * Takes a fully-parsed transaction (from getParsedTransaction) and:
 *   1. Routes each instruction to the correct program-specific decoder
 *   2. Processes inner (CPI) instructions the same way
 *   3. Computes SOL and token balance changes from the transaction metadata
 *   4. Extracts top-level metadata (fee, status, slot, signers, etc.)
 *
 * Returns a single unified object that downstream UI layers can consume.
 */

import { SYSTEM_PROGRAM_ID, decodeSystemInstruction }       from './programs/system.js';
import { TOKEN_PROGRAM_ID, decodeTokenInstruction }          from './programs/token.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, decodeAssociatedInstruction } from './programs/associated.js';
import { JUPITER_PROGRAM_IDS, isJupiterProgram, decodeJupiterInstruction } from './programs/jupiter.js';
import { RAYDIUM_PROGRAM_IDS, isRaydiumProgram, decodeRaydiumInstruction } from './programs/raydium.js';
import { MEMO_PROGRAM_IDS, isMemoProgram, decodeMemoInstruction }          from './programs/memo.js';
import { decodeUnknownInstruction }                          from './programs/unknown.js';
import { getTokenMetadata }                                  from '../chains/tokens.js';

const LAMPORTS_PER_SOL = 1_000_000_000;

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decode a fully-parsed Solana transaction into a human-readable summary.
 *
 * @param {object} parsedTx - The result of Connection.getParsedTransaction()
 * @returns {{
 *   instructions: DecodedInstruction[],
 *   balanceChanges: BalanceChange[],
 *   meta: { fee: number, status: string, slot: number, blockTime: number|null, signers: string[] }
 * }}
 */
export function decodeSolanaTransaction(parsedTx) {
  if (!parsedTx) {
    return emptyResult('Transaction data is null or undefined');
  }

  const message = parsedTx.transaction?.message;
  const meta    = parsedTx.meta;

  if (!message) {
    return emptyResult('Transaction message is missing');
  }

  // ── 1. Decode top-level instructions ─────────────────────────────────
  const topLevelIxs = message.instructions ?? [];
  const decodedInstructions = topLevelIxs.map((ix, idx) => {
    try {
      return { ...routeInstruction(ix), index: idx, inner: false };
    } catch (err) {
      return safeError(ix, idx, false, err);
    }
  });

  // ── 2. Decode inner (CPI) instructions ───────────────────────────────
  const innerIxGroups = meta?.innerInstructions ?? [];
  for (const group of innerIxGroups) {
    const parentIndex = group.index;
    const innerIxs = group.instructions ?? [];
    for (const innerIx of innerIxs) {
      try {
        decodedInstructions.push({
          ...routeInstruction(innerIx),
          index: parentIndex,
          inner: true,
        });
      } catch (err) {
        decodedInstructions.push(safeError(innerIx, parentIndex, true, err));
      }
    }
  }

  // ── 3. Compute balance changes ───────────────────────────────────────
  const balanceChanges = computeBalanceChanges(parsedTx);

  // ── 4. Extract metadata ──────────────────────────────────────────────
  const accountKeys = message.accountKeys ?? [];
  const signers = accountKeys
    .filter((k) => k.signer)
    .map((k) => k.pubkey?.toString?.() ?? k.pubkey ?? 'unknown');

  const fee = meta?.fee ?? 0;
  const status = meta?.err ? 'failed' : 'success';
  const slot = parsedTx.slot ?? 0;
  const blockTime = parsedTx.blockTime ?? null;

  return {
    instructions: decodedInstructions,
    balanceChanges,
    meta: { fee, status, slot, blockTime, signers },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Instruction routing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Route a single instruction to its program-specific decoder.
 *
 * @param {object} instruction
 * @returns {{ programName: string, type: string, description: string, details: object, riskFlags: Array }}
 */
function routeInstruction(instruction) {
  const programId = instruction?.programId?.toString?.() ?? instruction?.programId ?? '';

  // System Program
  if (programId === SYSTEM_PROGRAM_ID) {
    return { programName: 'System Program', ...decodeSystemInstruction(instruction) };
  }

  // SPL Token Program
  if (programId === TOKEN_PROGRAM_ID) {
    return { programName: 'SPL Token', ...decodeTokenInstruction(instruction) };
  }

  // Associated Token Account Program
  if (programId === ASSOCIATED_TOKEN_PROGRAM_ID) {
    return { programName: 'Associated Token Account', ...decodeAssociatedInstruction(instruction) };
  }

  // Jupiter (multiple program IDs)
  if (isJupiterProgram(programId)) {
    return { programName: JUPITER_PROGRAM_IDS[programId] ?? 'Jupiter', ...decodeJupiterInstruction(instruction) };
  }

  // Raydium (multiple program IDs)
  if (isRaydiumProgram(programId)) {
    return { programName: `Raydium ${RAYDIUM_PROGRAM_IDS[programId] ?? ''}`.trim(), ...decodeRaydiumInstruction(instruction) };
  }

  // Memo Program (v1 & v2)
  if (isMemoProgram(programId)) {
    return { programName: 'Memo Program', ...decodeMemoInstruction(instruction) };
  }

  // Compute Budget Program (common, low-interest – just label it)
  if (programId === 'ComputeBudget111111111111111111111111111111') {
    return {
      programName: 'Compute Budget',
      type: 'computeBudget',
      description: 'Set compute unit limit / price',
      details: { programId },
      riskFlags: [],
    };
  }

  // Unknown / unrecognised program
  return { programName: 'Unknown', ...decodeUnknownInstruction(instruction) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Balance change computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute SOL and token balance changes from the transaction metadata.
 *
 * @param {object} parsedTx
 * @returns {BalanceChange[]}
 */
function computeBalanceChanges(parsedTx) {
  const changes = [];
  const meta = parsedTx.meta;
  const accountKeys = parsedTx.transaction?.message?.accountKeys ?? [];

  if (!meta) return changes;

  // ── SOL balance changes ──────────────────────────────────────────────
  const preBalances  = meta.preBalances  ?? [];
  const postBalances = meta.postBalances ?? [];

  for (let i = 0; i < preBalances.length; i++) {
    const pre  = preBalances[i]  ?? 0;
    const post = postBalances[i] ?? 0;
    const diff = post - pre;

    if (diff !== 0) {
      const address = resolveAccountAddress(accountKeys, i);
      changes.push({
        address,
        token: 'SOL',
        symbol: 'SOL',
        change: diff / LAMPORTS_PER_SOL,
        decimals: 9,
      });
    }
  }

  // ── Token balance changes ────────────────────────────────────────────
  const preTokenBalances  = meta.preTokenBalances  ?? [];
  const postTokenBalances = meta.postTokenBalances ?? [];

  // Build a lookup: accountIndex → { pre, post }
  const tokenMap = new Map();

  for (const tb of preTokenBalances) {
    const key = tb.accountIndex;
    if (!tokenMap.has(key)) tokenMap.set(key, {});
    tokenMap.get(key).pre = tb;
  }
  for (const tb of postTokenBalances) {
    const key = tb.accountIndex;
    if (!tokenMap.has(key)) tokenMap.set(key, {});
    tokenMap.get(key).post = tb;
  }

  for (const [accountIndex, { pre, post }] of tokenMap.entries()) {
    const preAmount  = Number(pre?.uiTokenAmount?.uiAmount  ?? 0);
    const postAmount = Number(post?.uiTokenAmount?.uiAmount ?? 0);
    const diff = postAmount - preAmount;

    if (diff === 0) continue;

    const mint     = post?.mint ?? pre?.mint ?? 'unknown';
    const owner    = post?.owner ?? pre?.owner ?? resolveAccountAddress(accountKeys, accountIndex);
    const decimals = post?.uiTokenAmount?.decimals ?? pre?.uiTokenAmount?.decimals ?? 0;

    const tokenMeta = getTokenMetadata(mint);
    const symbol = tokenMeta ? tokenMeta.symbol : mint;
    const dec = tokenMeta ? tokenMeta.decimals : decimals;

    changes.push({
      address: owner,
      token: mint,
      symbol,
      change: diff,
      decimals: dec,
    });
  }

  return changes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely resolve an account's public key from the accountKeys array.
 */
function resolveAccountAddress(accountKeys, index) {
  const key = accountKeys[index];
  if (!key) return 'unknown';
  return key.pubkey?.toString?.() ?? key.pubkey ?? key.toString?.() ?? 'unknown';
}

/**
 * Produce a safe error entry when an individual instruction decoder throws.
 */
function safeError(instruction, index, inner, err) {
  const programId = instruction?.programId?.toString?.() ?? instruction?.programId ?? 'unknown';
  return {
    programName: 'Error',
    type: 'decodingError',
    description: `Failed to decode instruction from program ${programId}: ${err.message}`,
    details: { programId, error: err.message },
    riskFlags: [{
      severity: 'low',
      label: 'Decoding failure',
      description: `Could not decode this instruction. Raw data may still be inspected.`,
    }],
    index,
    inner,
  };
}

/**
 * Return an empty / error result when the transaction itself is unusable.
 */
function emptyResult(reason) {
  return {
    instructions: [],
    balanceChanges: [],
    meta: {
      fee: 0,
      status: 'unknown',
      slot: 0,
      blockTime: null,
      signers: [],
      error: reason,
    },
  };
}
