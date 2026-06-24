/**
 * Pre-loaded example transactions for the "Try Example" button
 * Real/simulated mainnet transactions that demonstrate different features
 */

export const EXAMPLES = [
  {
    label: '🔄 SOL Swap (Jupiter)',
    chain: 'solana',
    hash: '4gVHFHxyBMmfD3jYrYhmqQhEGjTwbGHWMDGK9pUasPmCfXJ7yxCmRxR2FT8QWNynBAD2j2c6LXJEkYuwVbGYqrS',
    description: 'A Jupiter token swap on Solana (SOL -> USDC)',
  },
  {
    label: '⚠️ SOL Multi-IX (Risk)',
    chain: 'solana',
    hash: '3mJp4aB8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    description: 'Solana multi-instruction TX demonstrating System transfer + Unlimited Approval + Close Account',
  },
  {
    label: '💸 ETH Transfer',
    chain: 'ethereum',
    hash: '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060',
    description: 'A simple ETH transfer on Ethereum',
  },
  {
    label: '🔄 Uniswap Swap',
    chain: 'ethereum',
    hash: '0x2b72ee38c0f592db43df5e0b456e1d13e6d3ade66a83a5d8a7f5b54b6c5',
    description: 'A Uniswap V3 swap on Ethereum (ETH -> USDC)',
  },
  {
    label: '🔴 ERC20 Approve (Risk)',
    chain: 'ethereum',
    hash: '0x9e8d6a2b5c7f0e3d8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c9d0e1f',
    description: 'ERC20 approve calldata showing high risk Unlimited Token Approval warning',
  },
  {
    label: '⚡ Base Transfer',
    chain: 'base',
    hash: '0x1f4a3c9b0e8d6a2b5c7f0e3d8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5',
    description: 'A simple value transfer on Base L2',
  },
];
