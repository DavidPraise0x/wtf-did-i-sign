/**
 * EVM Transaction Decoder – Main Orchestrator
 *
 * Takes a raw transaction + receipt (as returned by fetcher.js) and produces
 * a fully decoded, human-readable summary including:
 *   • Decoded instructions (what the TX *did*)
 *   • Balance changes  (who gained / lost what)
 *   • Risk flags       (what could hurt you)
 *   • Transaction meta (gas, status, block, etc.)
 *
 * Decoding strategy (in priority order):
 *   1. Plain ETH/native transfer (no input data)
 *   2. Known ABI match (ERC20 → Uniswap V2 → Uniswap V3)
 *   3. 4byte.directory fallback for the function selector
 *   4. Unknown contract call (raw selector shown)
 */

import { Interface, formatEther, formatUnits, ZeroAddress } from 'ethers';

import { ERC20_ABI, ERC20_FUNCTION_DESCRIPTIONS, getErc20RiskFlags } from './abis/erc20.js';
import { UNISWAP_V2_ABI, UNISWAP_V2_ROUTER_ADDRESSES, UNISWAP_V2_DESCRIPTIONS } from './abis/uniswapV2.js';
import { UNISWAP_V3_ABI, UNISWAP_V3_ROUTER_ADDRESSES, UNISWAP_V3_LEGACY_ROUTER_ADDRESSES, UNISWAP_V3_DESCRIPTIONS } from './abis/uniswapV3.js';
import { lookupSelector, extractFunctionName } from './fourByte.js';
import { getTokenMetadata } from '../chains/tokens.js';

// ---------------------------------------------------------------------------
// Pre-built ethers Interfaces (created once, reused for every decode)
// ---------------------------------------------------------------------------
const erc20Iface = new Interface(ERC20_ABI);
const uniV2Iface = new Interface(UNISWAP_V2_ABI);
const uniV3Iface = new Interface(UNISWAP_V3_ABI);

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

/** Return the chain's native currency symbol from a chainConfig. */
function nativeSymbol(chainConfig) {
  return chainConfig?.nativeCurrency?.symbol ?? chainConfig?.symbol ?? 'ETH';
}

/** Return chainId as a plain number. */
function chainId(chainConfig) {
  return Number(chainConfig?.chainId ?? 1);
}

/** Shorten an address for display: 0x1234…abcd */
function shortAddr(addr) {
  if (!addr) return '(unknown)';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Safely convert a BigInt value to a human-readable string with decimals. */
function fmtUnits(value, decimals = 18) {
  try {
    return formatUnits(value ?? 0n, decimals);
  } catch {
    return String(value);
  }
}

/** Returns true when input data is empty (plain transfer). */
function isPlainTransfer(inputData) {
  return !inputData || inputData === '0x' || inputData === '0x00';
}

// ---------------------------------------------------------------------------
// Event log parsers
// ---------------------------------------------------------------------------

/**
 * Parse Transfer & Approval events out of receipt logs using the ERC20 ABI.
 * Returns { transfers: [], approvals: [] }.
 */
function parseEventLogs(receipt) {
  const transfers = [];
  const approvals = [];

  if (!receipt?.logs) return { transfers, approvals };

  for (const log of receipt.logs) {
    try {
      const parsed = erc20Iface.parseLog({ topics: log.topics, data: log.data });
      if (!parsed) continue;

      if (parsed.name === 'Transfer') {
        transfers.push({
          token: log.address,
          from: parsed.args.from,
          to: parsed.args.to,
          value: parsed.args.value, // BigInt
        });
      } else if (parsed.name === 'Approval') {
        approvals.push({
          token: log.address,
          owner: parsed.args.owner,
          spender: parsed.args.spender,
          value: parsed.args.value,
        });
      }
    } catch {
      // Log doesn't match the ERC20 ABI – that's fine, skip it.
    }
  }

  return { transfers, approvals };
}

// ---------------------------------------------------------------------------
// Balance-change computation
// ---------------------------------------------------------------------------

/**
 * Build a list of BalanceChange objects from the native value transfer and
 * all ERC20 Transfer events.
 *
 * @param {import('ethers').TransactionResponse} tx
 * @param {{ from: string, to: string, value: bigint }[]} transfers
 * @param {object} chainConfig
 * @returns {BalanceChange[]}
 */
function computeBalanceChanges(tx, transfers, chainConfig) {
  /** @type {Map<string, Map<string, { change: bigint, symbol: string, decimals: number }>>} */
  const ledger = new Map(); // address → token → { change, symbol, decimals }

  const sym = nativeSymbol(chainConfig);

  // Helper: ensure entry exists and add delta
  function addDelta(address, token, symbol, decimals, delta) {
    if (!address || address === ZeroAddress) return;
    const addrLower = address.toLowerCase();
    if (!ledger.has(addrLower)) ledger.set(addrLower, new Map());
    const tokenMap = ledger.get(addrLower);
    const tokenLower = token.toLowerCase();
    if (!tokenMap.has(tokenLower)) {
      tokenMap.set(tokenLower, { change: 0n, symbol, decimals });
    }
    const entry = tokenMap.get(tokenLower);
    entry.change += delta;
  }

  // ---- native value ----
  const value = tx.value ?? 0n;
  if (value > 0n && tx.from) {
    addDelta(tx.from, 'native', sym, 18, -value);
    if (tx.to) addDelta(tx.to, 'native', sym, 18, value);
  }

  // ---- ERC20 transfers ----
  for (const t of transfers) {
    const meta = getTokenMetadata(t.token);
    const symbol = meta ? meta.symbol : t.token;
    const decimals = meta ? meta.decimals : 18;
    addDelta(t.from, t.token, symbol, decimals, -(t.value ?? 0n));
    addDelta(t.to, t.token, symbol, decimals, t.value ?? 0n);
  }

  // Flatten to array
  /** @type {BalanceChange[]} */
  const changes = [];
  for (const [address, tokenMap] of ledger) {
    for (const [token, { change, symbol, decimals }] of tokenMap) {
      if (change === 0n) continue; // net zero – skip
      changes.push({
        address,
        token,
        symbol,
        change: Number(fmtUnits(change, decimals)),
        decimals,
      });
    }
  }

  return changes;
}

// ---------------------------------------------------------------------------
// ABI-specific decoders
// ---------------------------------------------------------------------------

/**
 * Try to decode input data against a given Interface.
 * @returns {{ name: string, args: object, fragment: import('ethers').FunctionFragment } | null}
 */
function tryDecode(iface, data) {
  try {
    const parsed = iface.parseTransaction({ data });
    if (parsed) return { name: parsed.name, args: parsed.args, fragment: parsed.fragment };
  } catch { /* no match */ }
  return null;
}

/**
 * Helper to recursively clean ethers v6 Result objects and convert BigInts to strings
 */
function cleanResultValue(val) {
  if (val == null) return val;
  if (typeof val === 'bigint') return val.toString();
  if (typeof val.toObject === 'function') {
    return cleanResultValue(val.toObject());
  }
  if (Array.isArray(val)) {
    return val.map(cleanResultValue);
  }
  if (typeof val === 'object') {
    const cleaned = {};
    for (const key of Object.keys(val)) {
      cleaned[key] = cleanResultValue(val[key]);
    }
    return cleaned;
  }
  return val;
}

/** Build a DecodedInstruction from a successful ABI decode. */
function buildInstruction(programName, functionName, descriptionFn, args, riskFlagsFn, tokenAddress) {
  const argsObj = cleanResultValue(args) || {};
  if (tokenAddress) {
    argsObj.tokenAddress = tokenAddress;
  }

  const description =
    typeof descriptionFn === 'function'
      ? descriptionFn(argsObj)
      : `Called ${functionName}`;

  const riskFlags =
    typeof riskFlagsFn === 'function'
      ? riskFlagsFn(functionName, argsObj)
      : [];

  return {
    programName,
    type: functionName,
    description,
    details: argsObj,
    riskFlags,
  };
}

// ---------------------------------------------------------------------------
// Main decode function
// ---------------------------------------------------------------------------

/**
 * Decode an EVM transaction + receipt into a structured, human-readable format.
 *
 * @param {import('ethers').TransactionResponse} tx       Transaction object from provider.getTransaction
 * @param {import('ethers').TransactionReceipt | null} receipt  Receipt (null for pending TXs)
 * @param {object} chainConfig  Chain metadata – { chainId, nativeCurrency: { symbol, decimals }, name, ... }
 *
 * @returns {Promise<{
 *   instructions: DecodedInstruction[],
 *   balanceChanges: BalanceChange[],
 *   meta: object
 * }>}
 */
export async function decodeEvmTransaction(tx, receipt, chainConfig = {}) {
  const instructions = [];
  const inputData = tx.data ?? tx.input ?? '0x';
  const sym = nativeSymbol(chainConfig);
  const cid = chainId(chainConfig);

  // ------------------------------------------------------------------
  // 1. Plain native-currency transfer
  // ------------------------------------------------------------------
  if (isPlainTransfer(inputData)) {
    const ethValue = fmtUnits(tx.value ?? 0n, 18);
    instructions.push({
      programName: 'Native Transfer',
      type: 'transfer',
      description: `Transferred ${ethValue} ${sym} to ${shortAddr(tx.to)}`,
      details: {
        from: tx.from,
        to: tx.to,
        value: ethValue,
        symbol: sym,
      },
      riskFlags: [],
    });
  } else {
    // ----------------------------------------------------------------
    // 2. Contract interaction – try known ABIs first
    // ----------------------------------------------------------------
    let decoded = null;
    let programName = 'Unknown Contract';
    let descriptionFn = null;
    let riskFlagsFn = null;

    // 2a. ERC20
    decoded = tryDecode(erc20Iface, inputData);
    if (decoded) {
      programName = 'ERC20 Token';
      descriptionFn = ERC20_FUNCTION_DESCRIPTIONS[decoded.name];
      riskFlagsFn = getErc20RiskFlags;
    }

    // 2b. Uniswap V2 Router
    if (!decoded) {
      decoded = tryDecode(uniV2Iface, inputData);
      if (decoded) {
        const isKnownRouter = Object.values(UNISWAP_V2_ROUTER_ADDRESSES).some(
          (addr) => addr.toLowerCase() === (tx.to ?? '').toLowerCase(),
        );
        programName = isKnownRouter ? 'Uniswap V2 Router' : 'DEX Router (Uniswap V2 Fork)';
        descriptionFn = UNISWAP_V2_DESCRIPTIONS[decoded.name];
      }
    }

    // 2c. Uniswap V3 Router
    if (!decoded) {
      decoded = tryDecode(uniV3Iface, inputData);
      if (decoded) {
        const allV3 = { ...UNISWAP_V3_ROUTER_ADDRESSES, ...UNISWAP_V3_LEGACY_ROUTER_ADDRESSES };
        const isKnownRouter = Object.values(allV3).some(
          (addr) => addr?.toLowerCase() === (tx.to ?? '').toLowerCase(),
        );
        programName = isKnownRouter ? 'Uniswap V3 Router' : 'DEX Router (Uniswap V3 Fork)';
        descriptionFn = UNISWAP_V3_DESCRIPTIONS[decoded.name];
      }
    }

    if (decoded) {
      instructions.push(
        buildInstruction(programName, decoded.name, descriptionFn, decoded.args, riskFlagsFn, tx.to),
      );
    } else {
      // --------------------------------------------------------------
      // 3. Fallback – 4byte.directory lookup
      // --------------------------------------------------------------
      const selector = inputData.slice(0, 10); // '0x' + 8 hex chars
      const textSig = await lookupSelector(selector);
      const fnName = extractFunctionName(textSig);

      instructions.push({
        programName: `Contract ${shortAddr(tx.to)}`,
        type: fnName,
        description: textSig
          ? `Called function: ${textSig}`
          : `Called unknown function (selector: ${selector})`,
        details: {
          selector,
          textSignature: textSig,
          to: tx.to,
          value: fmtUnits(tx.value ?? 0n, 18),
        },
        riskFlags: textSig
          ? []
          : [
              {
                severity: 'medium',
                label: 'Unknown function',
                description:
                  'The function selector could not be matched to any known ABI. ' +
                  'Proceed with caution – the contract may perform unexpected actions.',
              },
            ],
      });
    }
  }

  // ------------------------------------------------------------------
  // 4. Parse event logs for token movements
  // ------------------------------------------------------------------
  const { transfers, approvals } = parseEventLogs(receipt);

  // Add approval events as separate instructions (they often carry risk)
  for (const a of approvals) {
    instructions.push({
      programName: 'ERC20 Token',
      type: 'Approval',
      description: `Approved ${shortAddr(a.spender)} to spend tokens at ${shortAddr(a.token)}`,
      details: {
        token: a.token,
        owner: a.owner,
        spender: a.spender,
        value: a.value?.toString(),
      },
      riskFlags: [],
    });
  }

  // ------------------------------------------------------------------
  // 5. Compute balance changes
  // ------------------------------------------------------------------
  const balanceChanges = computeBalanceChanges(tx, transfers, chainConfig);

  // ------------------------------------------------------------------
  // 6. Build meta
  // ------------------------------------------------------------------
  const gasUsed = receipt?.gasUsed ?? null;
  const effectiveGasPrice = receipt?.gasPrice ?? receipt?.effectiveGasPrice ?? tx.gasPrice ?? null;
  let fee = null;
  if (gasUsed != null && effectiveGasPrice != null) {
    try {
      fee = formatEther(gasUsed * effectiveGasPrice);
    } catch {
      fee = null;
    }
  }

  const meta = {
    fee,
    status: receipt ? (Number(receipt.status) === 1 ? 'success' : 'reverted') : 'pending',
    blockNumber: receipt?.blockNumber ?? tx.blockNumber ?? null,
    timestamp: null, // Receipt doesn't carry timestamp – the caller should enrich this from the block.
    from: tx.from ?? null,
    to: tx.to ?? null,
    nonce: tx.nonce ?? null,
    gasUsed: gasUsed?.toString() ?? null,
  };

  return { instructions, balanceChanges, meta };
}
