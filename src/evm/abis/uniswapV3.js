import { formatTokenAmount } from '../../chains/tokens.js';

// ---------------------------------------------------------------------------
// ABI fragments
// ---------------------------------------------------------------------------
export const UNISWAP_V3_ABI = [
  // ---- single-hop swaps ----
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) calldata params) external payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) calldata params) external payable returns (uint256 amountIn)',

  // ---- multi-hop swaps ----
  'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum) calldata params) external payable returns (uint256 amountOut)',
  'function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum) calldata params) external payable returns (uint256 amountIn)',

  // ---- multicall variants ----
  'function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory results)',
  'function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)',
];

// ---------------------------------------------------------------------------
// Known Uniswap V3 SwapRouter / SwapRouter02 addresses by chain ID
// ---------------------------------------------------------------------------
export const UNISWAP_V3_ROUTER_ADDRESSES = {
  // Ethereum mainnet – SwapRouter02
  1: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  // Goerli
  5: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  // Polygon mainnet
  137: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  // Arbitrum One
  42161: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  // Base
  8453: '0x2626664c2603336E57B271c5C0b26F421741e481',
  // BSC mainnet (PancakeSwap V3 uses a different router; Uni V3 not officially deployed)
  // 56: undefined,
};

// ---------------------------------------------------------------------------
// Older SwapRouter (non-02) – some dApps still target this
// ---------------------------------------------------------------------------
export const UNISWAP_V3_LEGACY_ROUTER_ADDRESSES = {
  1: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  5: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  137: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  42161: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
};

// ---------------------------------------------------------------------------
// Human-readable descriptions
// ---------------------------------------------------------------------------
export const UNISWAP_V3_DESCRIPTIONS = {
  exactInputSingle: (args) => {
    const params = args.params ?? args;
    const inFormatted = formatTokenAmount(params.tokenIn, params.amountIn);
    const outFormatted = formatTokenAmount(params.tokenOut, params.amountOutMinimum);
    return `Swap exactly ${inFormatted} for at least ${outFormatted} (fee tier: ${params.fee})`;
  },
  exactOutputSingle: (args) => {
    const params = args.params ?? args;
    const inFormatted = formatTokenAmount(params.tokenIn, params.amountInMaximum);
    const outFormatted = formatTokenAmount(params.tokenOut, params.amountOut);
    return `Swap up to ${inFormatted} to receive exactly ${outFormatted} (fee tier: ${params.fee})`;
  },
  exactInput: (args) => {
    const params = args.params ?? args;
    return `Multi-hop swap: send exactly ${params.amountIn} tokens, expecting at least ${params.amountOutMinimum} output tokens`;
  },
  exactOutput: (args) => {
    const params = args.params ?? args;
    return `Multi-hop swap: receive exactly ${params.amountOut} tokens, spending at most ${params.amountInMaximum} input tokens`;
  },
  multicall: () =>
    'Batched multicall containing multiple operations (inspect inner calls for details)',
};
