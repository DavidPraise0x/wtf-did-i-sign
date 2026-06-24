/**
 * fetcher.js - Solana RPC connection and transaction fetching
 *
 * Provides a single async entry-point for pulling a fully-parsed transaction
 * from any Solana RPC endpoint.  The RPC URL is always caller-supplied so the
 * module stays environment-agnostic.
 */

import { Connection } from '@solana/web3.js';
import { SOLANA_MOCKS } from '../chains/mockData.js';

// Solana base-58 signatures are 87-88 characters long
const SIGNATURE_REGEX = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;

/**
 * Fetch and return a fully-parsed Solana transaction.
 *
 * @param {string} rpcUrl  - The Solana JSON-RPC endpoint URL
 * @param {string} signature - The base-58 encoded transaction signature
 * @returns {Promise<object>} The parsed transaction object from getParsedTransaction
 * @throws {Error} On invalid input, missing transaction, or RPC failures
 */
export async function fetchTransaction(rpcUrl, signature) {
  // ── Validate inputs ──────────────────────────────────────────────────
  if (!rpcUrl || typeof rpcUrl !== 'string') {
    throw new Error('A valid Solana RPC URL is required.');
  }

  if (!signature || typeof signature !== 'string') {
    throw new Error('A valid transaction signature string is required.');
  }

  const trimmed = signature.trim();
  if (!SIGNATURE_REGEX.test(trimmed)) {
    throw new Error(
      `Invalid Solana transaction signature format: "${trimmed}". ` +
      'Expected an 87-88 character base-58 string.'
    );
  }

  // Check offline mock database first (for hackathon demo reliability)
  if (SOLANA_MOCKS[trimmed]) {
    console.log(`[Fetcher] Serving mock Solana transaction for signature: ${trimmed}`);
    return SOLANA_MOCKS[trimmed];
  }

  // ── Create connection & fetch ────────────────────────────────────────
  let connection;
  try {
    connection = new Connection(rpcUrl, 'confirmed');
  } catch (err) {
    throw new Error(`Failed to create Solana RPC connection to "${rpcUrl}": ${err.message}`);
  }

  let parsedTx;
  try {
    parsedTx = await connection.getParsedTransaction(trimmed, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
  } catch (err) {
    // Distinguish between network-level errors and RPC errors
    if (err.message?.includes('fetch')) {
      throw new Error(`Network error reaching Solana RPC at "${rpcUrl}": ${err.message}`);
    }
    throw new Error(`Solana RPC error while fetching transaction: ${err.message}`);
  }

  if (!parsedTx) {
    throw new Error(
      `Transaction not found for signature "${trimmed}". ` +
      'It may not exist, may still be processing, or may have been dropped.'
    );
  }

  return parsedTx;
}
