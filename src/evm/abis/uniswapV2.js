/**
 * Uniswap V2 Router ABI fragments and known contract addresses.
 *
 * Covers all standard Router02 swap & liquidity functions in
 * human-readable format for ethers.js v6.
 */

// ---------------------------------------------------------------------------
// ABI fragments
// ---------------------------------------------------------------------------
export const UNISWAP_V2_ABI = [
  // ---- swaps ----
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
  'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)',
  'function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
  'function swapETHForExactTokens(uint256 amountOut, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)',

  // ---- liquidity ----
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
  'function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)',
  'function removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external returns (uint256 amountToken, uint256 amountETH)',
];

// ---------------------------------------------------------------------------
// Known Uniswap V2 Router02 addresses by chain ID
// ---------------------------------------------------------------------------
export const UNISWAP_V2_ROUTER_ADDRESSES = {
  // Ethereum mainnet
  1: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  // Goerli (deprecated but still referenced)
  5: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  // BSC mainnet (PancakeSwap V2 uses a different router but Uni forks exist)
  56: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  // Polygon mainnet (QuickSwap – Uniswap V2 fork)
  137: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  // Arbitrum One
  42161: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
  // Base
  8453: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
};

// ---------------------------------------------------------------------------
// Human-readable descriptions for decoded Uniswap V2 calls
// ---------------------------------------------------------------------------
export const UNISWAP_V2_DESCRIPTIONS = {
  swapExactTokensForTokens: (args) =>
    `Swap exactly ${args.amountIn} tokens along path [${args.path.join(' → ')}], expecting at least ${args.amountOutMin} output tokens`,
  swapTokensForExactTokens: (args) =>
    `Swap up to ${args.amountInMax} tokens to receive exactly ${args.amountOut} tokens along path [${args.path.join(' → ')}]`,
  swapExactETHForTokens: (args) =>
    `Swap exact ETH for tokens along path [${args.path.join(' → ')}], expecting at least ${args.amountOutMin} output tokens`,
  swapTokensForExactETH: (args) =>
    `Swap up to ${args.amountInMax} tokens to receive exactly ${args.amountOut} ETH along path [${args.path.join(' → ')}]`,
  swapExactTokensForETH: (args) =>
    `Swap exactly ${args.amountIn} tokens for ETH along path [${args.path.join(' → ')}], expecting at least ${args.amountOutMin} ETH`,
  swapETHForExactTokens: (args) =>
    `Swap ETH to receive exactly ${args.amountOut} tokens along path [${args.path.join(' → ')}]`,
  addLiquidity: (args) =>
    `Add liquidity: up to ${args.amountADesired} of token ${args.tokenA} and ${args.amountBDesired} of token ${args.tokenB}`,
  addLiquidityETH: (args) =>
    `Add liquidity: up to ${args.amountTokenDesired} of token ${args.token} paired with ETH`,
  removeLiquidity: (args) =>
    `Remove ${args.liquidity} LP tokens for token pair ${args.tokenA} / ${args.tokenB}`,
  removeLiquidityETH: (args) =>
    `Remove ${args.liquidity} LP tokens for token ${args.token} / ETH pair`,
};
