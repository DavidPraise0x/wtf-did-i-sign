/**
 * Animation utilities for staggered card entrances
 */

/**
 * Apply staggered entrance animation to a list of elements
 * @param {string} selector - CSS selector for elements to animate
 * @param {number} delayBetween - ms between each element animation (default: 80)
 */
export function staggerEntrance(selector, delayBetween = 80) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el, i) => {
    el.style.animationDelay = `${i * delayBetween}ms`;
  });
}

/**
 * Truncate an address for display
 * @param {string} address - Full address
 * @param {number} startChars - Characters to show at start (default: 6)
 * @param {number} endChars - Characters to show at end (default: 4)
 * @returns {string} Truncated address
 */
export function truncateAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '—';
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a number with commas and decimal places
 */
export function formatNumber(num, decimals = 4) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const fixed = Number(num).toFixed(decimals);
  // Remove trailing zeros after decimal
  const cleaned = fixed.replace(/\.?0+$/, '');
  // Add commas for thousands
  const parts = cleaned.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Format a timestamp to relative time
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '—';

  const date = new Date(timestamp * 1000);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Copy text to clipboard with visual feedback
 */
export async function copyToClipboard(text, element) {
  try {
    await navigator.clipboard.writeText(text);
    element.classList.add('copyable--copied');
    setTimeout(() => element.classList.remove('copyable--copied'), 1500);
  } catch (err) {
    console.warn('Failed to copy:', err);
  }
}

/**
 * Get icon for instruction type
 */
export function getInstructionIcon(type) {
  const icons = {
    transfer: '💸',
    transferChecked: '💸',
    approve: '🔓',
    approveChecked: '🔓',
    revoke: '🔒',
    burn: '🔥',
    burnChecked: '🔥',
    mintTo: '🪙',
    mintToChecked: '🪙',
    closeAccount: '❌',
    setAuthority: '🔑',
    createAccount: '➕',
    createAssociatedTokenAccount: '📦',
    swap: '🔄',
    addLiquidity: '💧',
    removeLiquidity: '💧',
    memo: '📝',
    unknown: '❓',
    nativeTransfer: '💰',
  };
  return icons[type] || '📋';
}
