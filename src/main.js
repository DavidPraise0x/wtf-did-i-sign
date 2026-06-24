/**
 * WTF Did I Sign? — Main Entry Point
 * Orchestrates the full decode flow: input → detect → fetch → decode → analyze → render
 */

// Buffer polyfill — must be before @solana/web3.js
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import './style.css';
import { CHAINS, getChain } from './chains/config.js';
import { detectChain, validateHash } from './chains/detector.js';
import { analyzeRisk } from './risk/analyzer.js';
import { renderResults, showLoading, hideLoading, showError, hideError, clearResults } from './ui/renderer.js';
import { initCosmicBackground } from './ui/background.js';

// --- State ---
let selectedChain = 'auto';
let isLoading = false;
let historyItems = [];

// --- DOM refs ---
const txInput = document.getElementById('tx-input');
const searchBtn = document.getElementById('search-btn');
const errorRetry = document.getElementById('error-retry');
const historyToggleBtn = document.getElementById('history-toggle-btn');
const historyDrawer = document.getElementById('history-drawer');
const historyCloseBtn = document.getElementById('history-close-btn');
const historyClearBtn = document.getElementById('history-clear-btn');
const historyList = document.getElementById('history-list');

// --- Initialize ---
function init() {
  initCosmicBackground();
  setupChainSelector();
  setupSearchHandlers();
  setupHistory();
}

// --- Chain Selector ---
function setupChainSelector() {
  const buttons = document.querySelectorAll('.chain-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedChain = btn.dataset.chain;
    });
  });
}

// Examples setup removed.

// --- Search Handlers ---
function setupSearchHandlers() {
  searchBtn.addEventListener('click', handleSearch);

  txInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Auto-detect chain on paste
  txInput.addEventListener('paste', () => {
    setTimeout(() => {
      const detected = detectChain(txInput.value);
      if (detected.type === 'solana' && selectedChain === 'auto') {
        const solBtn = document.querySelector('.chain-btn[data-chain="solana"]');
        if (solBtn) {
          document.querySelectorAll('.chain-btn').forEach(b => b.classList.remove('active'));
          solBtn.classList.add('active');
          selectedChain = 'solana';
        }
      }
    }, 50);
  });

  errorRetry.addEventListener('click', handleSearch);
}

// --- Auto-Detect EVM Chain on the fly ---
async function autoDetectEvmChain(txHash) {
  const { fetchEvmTransaction } = await import('./evm/fetcher.js');
  const evmChains = Object.values(CHAINS).filter(c => c.type === 'evm');

  console.log(`[Detector] Querying all EVM chains in parallel for hash: ${txHash}`);
  
  const queries = evmChains.map(async (chain) => {
    const rpcs = Array.isArray(chain.rpcs) ? chain.rpcs : [chain.rpc];
    // Try the first two rpcs for speed
    for (const rpc of rpcs.slice(0, 2)) {
      try {
        const { transaction } = await fetchEvmTransaction(rpc, txHash);
        if (transaction) {
          console.log(`[Detector] Found transaction on chain: ${chain.name}`);
          return chain.id;
        }
      } catch (err) {
        // Ignore and try next RPC
      }
    }
    return null;
  });

  const results = await Promise.all(queries);
  return results.find(id => id !== null) || null;
}

// --- Main Search Flow ---
async function handleSearch() {
  const hash = txInput.value.trim();

  // Validate
  const validation = validateHash(hash);
  if (!validation.valid) {
    showError(validation.error);
    return;
  }

  if (isLoading) return;
  isLoading = true;

  showLoading();
  hideError();
  document.body.className = ''; // Reset ambient glow

  try {
    let chainId = selectedChain;
    let detectEvmOnTheFly = false;

    // Determine chain
    if (chainId === 'auto') {
      const detected = detectChain(hash);
      if (detected.type === 'solana') {
        chainId = 'solana';
      } else if (detected.type === 'evm') {
        detectEvmOnTheFly = true;
      } else {
        throw new Error('Could not detect chain type from hash format.');
      }
    }

    // Resolve EVM chain on the fly if needed
    if (detectEvmOnTheFly) {
      chainId = await autoDetectEvmChain(hash);
      if (!chainId) {
        throw new Error(
          'Transaction not found on Ethereum, Base, Polygon, Arbitrum, or BNB Chain. ' +
          'Please verify the hash or select a network manually.'
        );
      }
      
      // Update UI active button to show detected chain
      const chainBtn = document.querySelector(`.chain-btn[data-chain="${chainId}"]`);
      if (chainBtn) {
        document.querySelectorAll('.chain-btn').forEach(b => b.classList.remove('active'));
        chainBtn.classList.add('active');
        selectedChain = chainId;
      }
    }

    const chainConfig = getChain(chainId);
    if (!chainConfig) {
      throw new Error(`Unknown chain: ${chainId}`);
    }

    let decoded;
    if (chainConfig.type === 'solana') {
      decoded = await decodeSolanaTransaction(chainConfig, hash);
    } else {
      decoded = await decodeEvmTransaction(chainConfig, hash);
    }

    // Run risk analysis
    const risk = analyzeRisk(decoded.instructions);

    // Update ambient glow color on body
    document.body.className = '';
    document.body.classList.add(`risk-${risk.level}`);

    // Render results
    hideLoading();
    renderResults(decoded, risk, chainConfig);

    // Save search to history
    saveToHistory(hash, chainConfig.id, risk.level, risk.score);

  } catch (err) {
    console.error('Decode error:', err);
    hideLoading();
    document.body.className = ''; // Reset glow on error
    showError(err.message || 'Failed to decode transaction. Please check the hash and try again.');
  } finally {
    isLoading = false;
  }
}

// --- Solana Decode Flow ---
async function decodeSolanaTransaction(chainConfig, signature) {
  // Dynamic import to code-split
  const { fetchTransaction } = await import('./solana/fetcher.js');
  const { decodeSolanaTransaction: decode } = await import('./solana/decoder.js');

  const rpcs = Array.isArray(chainConfig.rpcs) ? chainConfig.rpcs : [chainConfig.rpc];
  let lastError = null;

  for (const rpc of rpcs) {
    try {
      console.log(`[Decoder] Trying Solana RPC: ${rpc}`);
      const parsedTx = await fetchTransaction(rpc, signature);
      const decoded = decode(parsedTx);
      decoded.meta.signature = signature;
      return decoded;
    } catch (err) {
      console.warn(`[Decoder] Solana RPC failed (${rpc}):`, err.message);
      lastError = err;
      if (err.message.toLowerCase().includes('not found')) {
        throw new Error(
          `Transaction not found on Solana. ` +
          `Please verify the transaction signature is correct and has been confirmed.`
        );
      }
    }
  }

  throw lastError || new Error('All Solana RPC endpoints failed to fetch.');
}

// --- EVM Decode Flow ---
async function decodeEvmTransaction(chainConfig, txHash) {
  const { fetchEvmTransaction } = await import('./evm/fetcher.js');
  const { decodeEvmTransaction: decode } = await import('./evm/decoder.js');

  const rpcs = Array.isArray(chainConfig.rpcs) ? chainConfig.rpcs : [chainConfig.rpc];
  let lastError = null;

  for (const rpc of rpcs) {
    try {
      console.log(`[Decoder] Trying EVM RPC: ${rpc}`);
      const { transaction, receipt } = await fetchEvmTransaction(rpc, txHash);
      const decoded = await decode(transaction, receipt, chainConfig);
      decoded.meta.hash = txHash;
      return decoded;
    } catch (err) {
      console.warn(`[Decoder] EVM RPC failed (${rpc}):`, err.message);
      lastError = err;
      if (err.message.toLowerCase().includes('not found')) {
        throw new Error(
          `Transaction not found on ${chainConfig.name}. ` +
          `If this transaction is on a different network (like Base, Polygon, Arbitrum, or BNB Chain), ` +
          `please select the correct network icon above.`
        );
      }
    }
  }

  throw lastError || new Error('All EVM RPC endpoints failed to fetch.');
}

// --- History Storage & UI ---
function setupHistory() {
  // Load from localStorage
  try {
    const saved = localStorage.getItem('wtf_history');
    if (saved) {
      historyItems = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load history from localStorage:', e);
  }

  // Initial render
  renderHistory();

  // Toggle drawer open
  historyToggleBtn.addEventListener('click', () => {
    historyDrawer.classList.add('open');
  });

  // Toggle drawer close
  historyCloseBtn.addEventListener('click', () => {
    historyDrawer.classList.remove('open');
  });

  // Clear history items
  historyClearBtn.addEventListener('click', () => {
    historyItems = [];
    try {
      localStorage.removeItem('wtf_history');
    } catch (e) {
      console.warn('Failed to clear history from localStorage:', e);
    }
    renderHistory();
  });
}

function saveToHistory(hash, chainId, riskLevel, riskScore) {
  // Check if hash already exists, remove it (to move it to top)
  historyItems = historyItems.filter(item => item.hash !== hash);

  // Add new item to front
  historyItems.unshift({
    hash,
    chainId,
    riskLevel,
    riskScore,
    timestamp: Date.now() / 1000
  });

  // Limit to 10 items
  if (historyItems.length > 10) {
    historyItems = historyItems.slice(0, 10);
  }

  // Save to localStorage
  try {
    localStorage.setItem('wtf_history', JSON.stringify(historyItems));
  } catch (e) {
    console.warn('Failed to save history to localStorage:', e);
  }

  // Render updated list
  renderHistory();
}

function renderHistory() {
  if (historyItems.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No recent translations yet.</p>';
    return;
  }

  const listHtml = historyItems.map(item => {
    const chainConfig = getChain(item.chainId) || { name: item.chainId, color: '#8b5cf6' };
    const truncatedHash = item.hash.substring(0, 8) + '...' + item.hash.substring(item.hash.length - 6);
    const riskLabel = item.riskLevel.toUpperCase();
    
    // Relative time formatting
    const timeDisplay = formatRelativeTime(item.timestamp);

    return `
      <div class="history-item" data-hash="${item.hash}" data-chain="${item.chainId}">
        <div class="history-item__header">
          <span class="history-item__chain" style="color: ${chainConfig.color};">
            🔗 ${chainConfig.name}
          </span>
          <span class="history-item__time">${timeDisplay}</span>
        </div>
        <div class="history-item__hash">${truncatedHash}</div>
        <div class="history-item__risk">
          <span class="history-item__risk-badge history-item__risk-badge--${item.riskLevel}">
            Risk: ${riskLabel} (${item.riskScore})
          </span>
        </div>
      </div>
    `;
  }).join('');

  historyList.innerHTML = listHtml;

  // Add click handlers to items
  const items = historyList.querySelectorAll('.history-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      loadHistoryItem(item.dataset.hash, item.dataset.chain);
    });
  });
}

function loadHistoryItem(hash, chainId) {
  txInput.value = hash;
  
  // Set selected chain
  selectedChain = chainId;
  const buttons = document.querySelectorAll('.chain-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.chain === chainId) {
      btn.classList.add('active');
    }
  });

  // Close drawer
  historyDrawer.classList.remove('open');

  // Trigger search
  handleSearch();
}

function formatRelativeTime(timestamp) {
  const diff = (Date.now() / 1000) - timestamp;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// --- Boot ---
document.addEventListener('DOMContentLoaded', init);
// Also run init immediately in case DOM is already loaded (Vite HMR)
if (document.readyState !== 'loading') {
  init();
}
