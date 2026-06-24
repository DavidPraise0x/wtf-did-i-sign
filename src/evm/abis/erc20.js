/**
 * ERC20 ABI fragments for ethers.js v6 Interface.
 *
 * Human-readable ABI strings covering the most common ERC20
 * interactions: transfer, approve, transferFrom, allowance helpers,
 * and the Transfer / Approval events that every compliant token emits.
 */

import { MaxUint256 } from 'ethers';
import { formatTokenAmount } from '../../chains/tokens.js';

// ---------------------------------------------------------------------------
// ABI fragments (human-readable format understood by ethers.Interface)
// ---------------------------------------------------------------------------
export const ERC20_ABI = [
  // ---- mutative functions ----
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function increaseAllowance(address spender, uint256 addedValue) returns (bool)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',

  // ---- events ----
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// ---------------------------------------------------------------------------
// Human-readable description templates keyed by function name.
// Each value is a function that receives the decoded args object and returns
// a plain-English string.
// ---------------------------------------------------------------------------
export const ERC20_FUNCTION_DESCRIPTIONS = {
  transfer: (args) => {
    const formatted = formatTokenAmount(args.tokenAddress, args.amount);
    return `Transfer ${formatted} to ${args.to}`;
  },

  approve: (args) => {
    const formatted = formatTokenAmount(args.tokenAddress, args.amount);
    return `Approve ${args.spender} to spend ${formatted} on your behalf`;
  },

  transferFrom: (args) => {
    const formatted = formatTokenAmount(args.tokenAddress, args.amount);
    return `Transfer ${formatted} from ${args.from} to ${args.to}`;
  },

  increaseAllowance: (args) =>
    `Increase allowance for ${args.spender} by ${args.addedValue} tokens`,

  decreaseAllowance: (args) =>
    `Decrease allowance for ${args.spender} by ${args.subtractedValue} tokens`,
};

// ---------------------------------------------------------------------------
// Risk-flag helpers
// ---------------------------------------------------------------------------

/**
 * Inspect a decoded `approve` call and return risk flags.
 *
 * If the approved amount equals MaxUint256 the approval is effectively
 * unlimited, which is a well-known attack surface.
 *
 * @param {object} args  Decoded function arguments (from ethers Interface.decodeFunctionData)
 * @returns {import('../decoder.js').RiskFlag[]}
 */
export function getErc20RiskFlags(functionName, args) {
  const flags = [];

  if (functionName === 'approve') {
    // args.amount is a BigInt in ethers v6
    if (args.amount !== undefined && args.amount.toString() === MaxUint256.toString()) {
      flags.push({
        severity: 'high',
        label: 'Unlimited token approval',
        description:
          'This transaction approves the spender to transfer an unlimited amount of your tokens. ' +
          'If the spender contract is compromised, all tokens in your wallet could be drained.',
      });
    }
  }

  return flags;
}
