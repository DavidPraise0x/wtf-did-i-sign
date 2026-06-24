/**
 * Chain configuration — RPCs, explorers, colors, and metadata
 * All RPCs are free, public, and require no API key
 */

export const CHAINS = {
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    type: 'solana',
    rpc: 'https://api.mainnet-beta.solana.com',
    rpcs: [
      'https://api.mainnet-beta.solana.com',
      'https://rpc.ankr.com/solana',
      'https://solana.public-rpc.com'
    ],
    explorer: 'https://solscan.io/tx/',
    addressExplorer: 'https://solscan.io/account/',
    color: '#9945FF',
    icon: '/chains/solana.svg',
    decimals: 9,
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'evm',
    rpc: 'https://eth.llamarpc.com',
    rpcs: [
      'https://cloudflare-eth.com',
      'https://eth.llamarpc.com',
      'https://ethereum-rpc.publicnode.com',
      'https://rpc.flashbots.net'
    ],
    explorer: 'https://etherscan.io/tx/',
    addressExplorer: 'https://etherscan.io/address/',
    color: '#627EEA',
    icon: '/chains/ethereum.svg',
    decimals: 18,
  },
  base: {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    type: 'evm',
    rpc: 'https://mainnet.base.org',
    rpcs: [
      'https://mainnet.base.org',
      'https://base.llamarpc.com',
      'https://base-rpc.publicnode.com'
    ],
    explorer: 'https://basescan.org/tx/',
    addressExplorer: 'https://basescan.org/address/',
    color: '#0052FF',
    icon: '/chains/base.svg',
    decimals: 18,
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    type: 'evm',
    rpc: 'https://polygon-rpc.com',
    rpcs: [
      'https://polygon-rpc.com',
      'https://polygon.llamarpc.com',
      'https://polygon-bor-rpc.publicnode.com'
    ],
    explorer: 'https://polygonscan.com/tx/',
    addressExplorer: 'https://polygonscan.com/address/',
    color: '#8247E5',
    icon: '/chains/polygon.svg',
    decimals: 18,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ETH',
    type: 'evm',
    rpc: 'https://arb1.arbitrum.io/rpc',
    rpcs: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
      'https://arbitrum-one-rpc.publicnode.com'
    ],
    explorer: 'https://arbiscan.io/tx/',
    addressExplorer: 'https://arbiscan.io/address/',
    color: '#28A0F0',
    icon: '/chains/arbitrum.svg',
    decimals: 18,
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Chain',
    symbol: 'BNB',
    type: 'evm',
    rpc: 'https://bsc-dataseed.binance.org',
    rpcs: [
      'https://bsc-dataseed.binance.org',
      'https://binance.llamarpc.com',
      'https://bsc-rpc.publicnode.com'
    ],
    explorer: 'https://bscscan.com/tx/',
    addressExplorer: 'https://bscscan.com/address/',
    color: '#F0B90B',
    icon: '/chains/bsc.svg',
    decimals: 18,
  },
};

/**
 * Get chain config by ID
 */
export function getChain(chainId) {
  return CHAINS[chainId] || null;
}

/**
 * Get all EVM chains
 */
export function getEvmChains() {
  return Object.values(CHAINS).filter(c => c.type === 'evm');
}
