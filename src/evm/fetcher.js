/**
 * EVM Transaction Fetcher
 *
 * Connects to any EVM-compatible chain via a JSON-RPC URL and retrieves
 * the full transaction object plus its receipt.  Both are needed by the
 * decoder: the transaction carries input data / value, while the receipt
 * has logs (events) and the execution status.
 *
 * Uses ethers.js v6.
 */

import { JsonRpcProvider } from 'ethers';
import { EVM_MOCKS } from '../chains/mockData.js';

// Simple regex for a 66-char hex TX hash (0x + 64 hex digits)
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Fetch an EVM transaction and its receipt from an RPC endpoint.
 *
 * @param {string} rpcUrl   JSON-RPC endpoint URL (e.g. "https://eth.llamarpc.com")
 * @param {string} txHash   Transaction hash (0x-prefixed, 66 chars)
 * @returns {Promise<{ transaction: import('ethers').TransactionResponse, receipt: import('ethers').TransactionReceipt }>}
 * @throws {Error} On invalid hash, missing TX, or RPC communication problems.
 */
export async function fetchEvmTransaction(rpcUrl, txHash) {
  // ---- input validation ----
  if (!rpcUrl || typeof rpcUrl !== 'string') {
    throw new Error('fetchEvmTransaction: rpcUrl is required and must be a non-empty string.');
  }

  if (!txHash || typeof txHash !== 'string') {
    throw new Error('fetchEvmTransaction: txHash is required and must be a non-empty string.');
  }

  if (!TX_HASH_RE.test(txHash)) {
    throw new Error(
      `fetchEvmTransaction: invalid transaction hash "${txHash}". ` +
      'Expected a 0x-prefixed, 64-character hex string.',
    );
  }

  // Check offline mock database first (for hackathon demo reliability)
  if (EVM_MOCKS[txHash]) {
    console.log(`[Fetcher] Serving mock EVM transaction for hash: ${txHash}`);
    return EVM_MOCKS[txHash];
  }

  // ---- create provider ----
  let provider;
  try {
    provider = new JsonRpcProvider(rpcUrl);
  } catch (err) {
    throw new Error(`fetchEvmTransaction: failed to create JsonRpcProvider for "${rpcUrl}": ${err.message}`);
  }

  // ---- fetch transaction + receipt in parallel ----
  let transaction, receipt;
  try {
    [transaction, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
    ]);
  } catch (err) {
    // Distinguish known RPC-level errors
    const msg = err?.message ?? String(err);
    if (msg.includes('could not detect network') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT')) {
      throw new Error(
        `fetchEvmTransaction: unable to reach RPC endpoint "${rpcUrl}". ` +
        `Underlying error: ${msg}`,
      );
    }
    throw new Error(`fetchEvmTransaction: RPC error while fetching TX "${txHash}": ${msg}`);
  }

  // ---- handle not-found ----
  if (!transaction) {
    throw new Error(
      `fetchEvmTransaction: transaction "${txHash}" not found. ` +
      'It may not exist, is still pending, or the RPC node does not have it.',
    );
  }

  // Receipt can legitimately be null for *pending* transactions.
  // We still return it so the caller can decide how to handle pending state.

  return { transaction, receipt };
}
