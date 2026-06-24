/**
 * memo.js - Solana Memo Program decoder
 *
 * Two versions of the Memo program exist on mainnet:
 *   v1: Memo1UhkJBfCvE3urwUn9LcnJUCxidag1MeJa47UMJD
 *   v2: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
 *
 * Both take arbitrary UTF-8 data and store it in the transaction log.
 */

export const MEMO_PROGRAM_IDS = [
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',  // v2
  'Memo1UhkJBfCvE3urwUn9LcnJUCxidag1MeJa47UMJD',  // v1
];

/**
 * Check whether a program ID is a Memo program.
 *
 * @param {string} programId
 * @returns {boolean}
 */
export function isMemoProgram(programId) {
  return MEMO_PROGRAM_IDS.includes(programId);
}

/**
 * Decode a Memo instruction.
 *
 * The Solana RPC typically puts the memo text directly into `instruction.parsed`
 * as a string.  If it doesn't, we fall back to the raw `data` field.
 *
 * @param {object} instruction - The instruction object from getParsedTransaction
 * @returns {{ type: string, description: string, details: object, riskFlags: Array }}
 */
export function decodeMemoInstruction(instruction) {
  let memoText = '';

  // getParsedTransaction usually surfaces memo content as a plain string
  if (typeof instruction?.parsed === 'string') {
    memoText = instruction.parsed;
  } else if (typeof instruction?.data === 'string') {
    // Raw data – attempt to decode from base-58 / UTF-8
    memoText = tryDecodeData(instruction.data);
  }

  // Truncate extremely long memos for display
  const display = memoText.length > 280
    ? memoText.slice(0, 277) + '...'
    : memoText;

  return {
    type: 'memo',
    description: display ? `Memo: ${display}` : 'Empty memo',
    details: {
      text: memoText,
      length: memoText.length,
    },
    riskFlags: [],
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Best-effort decode of raw instruction data into a UTF-8 string.
 * If decoding fails we return the raw string as-is.
 */
function tryDecodeData(raw) {
  try {
    // In a browser/Node 18+ environment, atob + TextDecoder can handle base64.
    // Memo data from the RPC is typically already UTF-8, so we try that first.
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(raw, 'base64').toString('utf-8');
    }
    return raw;
  } catch {
    return raw;
  }
}
