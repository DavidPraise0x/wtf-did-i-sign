/**
 * EVM Layer – Public API
 *
 * Re-exports everything a consumer needs from a single entry point:
 *
 *   import { fetchEvmTransaction, decodeEvmTransaction } from './evm/index.js';
 */

export { fetchEvmTransaction } from './fetcher.js';
export { decodeEvmTransaction } from './decoder.js';
export { lookupSelector, extractFunctionName } from './fourByte.js';

// ABI re-exports (useful for advanced consumers / tests)
export { ERC20_ABI, ERC20_FUNCTION_DESCRIPTIONS, getErc20RiskFlags } from './abis/erc20.js';
export { UNISWAP_V2_ABI, UNISWAP_V2_ROUTER_ADDRESSES, UNISWAP_V2_DESCRIPTIONS } from './abis/uniswapV2.js';
export {
  UNISWAP_V3_ABI,
  UNISWAP_V3_ROUTER_ADDRESSES,
  UNISWAP_V3_LEGACY_ROUTER_ADDRESSES,
  UNISWAP_V3_DESCRIPTIONS,
} from './abis/uniswapV3.js';
