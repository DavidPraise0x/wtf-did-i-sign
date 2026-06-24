/**
 * Offline Mock Transaction Data for examples
 * This allows all examples to function perfectly even without internet,
 * when RPCs are rate-limiting, or when transactions are pruned from history.
 */

export const SOLANA_MOCKS = {
  // 🔄 SOL Swap (Jupiter)
  '4gVHFHxyBMmfD3jYrYhmqQhEGjTwbGHWMDGK9pUasPmCfXJ7yxCmRxR2FT8QWNynBAD2j2c6LXJEkYuwVbGYqrS': {
    slot: 254829381,
    blockTime: 1712398402,
    transaction: {
      message: {
        accountKeys: [
          { pubkey: '3sN3tL8zG1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN', signer: true, writable: true },
          { pubkey: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', signer: false, writable: true }
        ],
        instructions: [
          {
            programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
            data: '382a9d8',
            accounts: []
          }
        ]
      }
    },
    meta: {
      fee: 5000,
      err: null,
      preBalances: [10000000000, 50000000],
      postBalances: [8499995000, 50000000], // Spent 1.5 SOL + fee
      preTokenBalances: [
        {
          accountIndex: 1,
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          owner: '3sN3tL8zG1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN',
          uiTokenAmount: { uiAmount: 100.0, decimals: 6, uiAmountString: '100.0' }
        }
      ],
      postTokenBalances: [
        {
          accountIndex: 1,
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          owner: '3sN3tL8zG1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN',
          uiTokenAmount: { uiAmount: 350.0, decimals: 6, uiAmountString: '350.0' }
        }
      ],
      innerInstructions: []
    }
  },

  // ⚠️ SOL Multi-IX (Risk)
  '3mJp4aB8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6': {
    slot: 254829390,
    blockTime: 1712398500,
    transaction: {
      message: {
        accountKeys: [
          { pubkey: '3sN3tL8zG1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN', signer: true, writable: true },
          { pubkey: '9xY5AbCd1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN', signer: false, writable: true },
          { pubkey: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', signer: false, writable: false },
          { pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', signer: false, writable: false },
          { pubkey: '11111111111111111111111111111111', signer: false, writable: false }
        ],
        instructions: [
          {
            programId: '11111111111111111111111111111111',
            program: 'system',
            parsed: {
              type: 'transfer',
              info: {
                source: '3sN3tL8zG1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN',
                destination: '9xY5AbCd1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN',
                lamports: 15000000000 // 15 SOL (triggers medium risk)
              }
            }
          },
          {
            programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            program: 'spl-token',
            parsed: {
              type: 'approveChecked',
              info: {
                source: '3sN3tL8zG1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN',
                delegate: '9xY5AbCd1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN',
                mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                tokenAmount: {
                  amount: '999999999999999999', // Triggers high risk (unlimited approve)
                  decimals: 6,
                  uiAmountString: '999999999999.999999'
                }
              }
            }
          },
          {
            programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            program: 'spl-token',
            parsed: {
              type: 'closeAccount',
              info: {
                account: '3sN3tL8zG1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN',
                destination: '9xY5AbCd1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN',
                owner: '3sN3tL8zG1oN6vA1b8sN2oA1b8sN2oA1b8sN2oA1b8sN'
              }
            }
          }
        ]
      }
    },
    meta: {
      fee: 15000,
      err: null,
      preBalances: [25000000000, 1000000000, 0, 0, 0],
      postBalances: [9999985000, 16000000000, 0, 0, 0],
      preTokenBalances: [],
      postTokenBalances: []
    }
  }
};

export const EVM_MOCKS = {
  // 💸 ETH Transfer
  '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060': {
    transaction: {
      hash: '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060',
      from: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      to: '0x3c44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      value: 1500000000000000000n, // 1.5 ETH
      data: '0x',
      nonce: 42,
      gasLimit: 21000n,
      gasPrice: 20000000000n
    },
    receipt: {
      status: 1,
      blockNumber: 19482931,
      gasUsed: 21000n,
      logs: []
    }
  },

  // 🔄 Uniswap Swap
  '0x2b72ee38c0f592db43df5e0b456e1d13e6d3ade66a83a5d8a7f5b54b6c5': {
    transaction: {
      hash: '0x2b72ee38c0f592db43df5e0b456e1d13e6d3ade66a83a5d8a7f5b54b6c5',
      from: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      to: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 SwapRouter
      value: 500000000000000000n, // 0.5 ETH
      // exactInputSingle selector 0x414bf389
      // params: (tokenIn, tokenOut, fee, recipient, deadline, amountIn, amountOutMinimum, sqrtPriceLimitX96)
      data: '0x414bf389' +
            '000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' + // WETH
            '000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' + // USDC
            '0000000000000000000000000000000000000000000000000000000000000bb8' + // fee 3000
            '00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f' + // recipient
            '00000000000000000000000000000000000000000000000000000000667954b0' + // deadline
            '00000000000000000000000000000000000000000000000006f05b59d3b20000' + // 0.5 WETH
            '0000000000000000000000000000000000000000000000000000000047868c00' + // 1200.0 USDC (outMin)
            '0000000000000000000000000000000000000000000000000000000000000000', // priceLimit
      nonce: 43,
      gasLimit: 150000n,
      gasPrice: 15000000000n
    },
    receipt: {
      status: 1,
      blockNumber: 19482935,
      gasUsed: 112000n,
      logs: [
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer
            '0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564', // from Router
            '0x00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f'  // to user
          ],
          data: '0x0000000000000000000000000000000000000000000000000000000047868c00' // 1200.0 USDC (6 decimals)
        }
      ]
    }
  },

  // 🔴 ERC20 Approve (Risk)
  '0x9e8d6a2b5c7f0e3d8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c9d0e1f': {
    transaction: {
      hash: '0x9e8d6a2b5c7f0e3d8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c9d0e1f',
      from: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC Token
      value: 0n,
      // approve(spender, amount)
      // spender: 0xE592427A0AEce92De3Edee1F18E0157C05861564 (Uniswap Router)
      // amount: MaxUint256 (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
      data: '0x095ea7b3' +
            '000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564' +
            'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      nonce: 44,
      gasLimit: 60000n,
      gasPrice: 12000000000n
    },
    receipt: {
      status: 1,
      blockNumber: 19482940,
      gasUsed: 45000n,
      logs: [
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          topics: [
            '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', // Approval
            '0x00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f',
            '0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564'
          ],
          data: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
        }
      ]
    }
  },

  // ⚡ Base Transfer
  '0x1f4a3c9b0e8d6a2b5c7f0e3d8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5': {
    transaction: {
      hash: '0x1f4a3c9b0e8d6a2b5c7f0e3d8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5',
      from: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      to: '0x3c44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      value: 2000000000000000000n, // 2 ETH
      data: '0x',
      nonce: 10,
      gasLimit: 21000n,
      gasPrice: 100000000n
    },
    receipt: {
      status: 1,
      blockNumber: 13829482,
      gasUsed: 21000n,
      logs: []
    }
  }
};
