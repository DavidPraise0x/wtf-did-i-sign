/**
 * UI Renderer — Builds all result DOM elements
 */
import { renderRiskMeter } from './riskMeter.js';
import { getRiskIcon, getRiskLabel, analyzeRisk } from '../risk/analyzer.js';
import {
  truncateAddress,
  formatNumber,
  formatTimestamp,
  copyToClipboard,
  getInstructionIcon,
  staggerEntrance,
} from './animations.js';

/**
 * Render the full results UI
 * @param {object} decoded - Decoded transaction data
 * @param {object} risk - Risk analysis result
 * @param {object} chainConfig - Chain configuration
 */
export function renderResults(decoded, risk, chainConfig) {
  const { instructions, balanceChanges, meta } = decoded;

  // Show results section
  const resultsSection = document.getElementById('results-section');
  resultsSection.classList.remove('hidden');

  // Trigger diagnostic laser scanner sweep
  let scanner = resultsSection.querySelector('.scanner-sweep');
  if (!scanner) {
    scanner = document.createElement('div');
    scanner.className = 'scanner-sweep';
    resultsSection.appendChild(scanner);
  }
  scanner.classList.remove('active');
  void scanner.offsetWidth; // Trigger reflow to restart animation
  scanner.classList.add('active');

  // 1. Risk Meter
  renderRiskMeter(document.getElementById('risk-meter'), risk.score, risk.level);

  // 2. Transaction Overview
  renderTxOverview(document.getElementById('tx-overview'), meta, chainConfig);

  // 3. Balance Changes
  renderBalanceChanges(document.getElementById('balance-changes'), balanceChanges, chainConfig);

  // 4. Token Flow Map
  renderTokenFlowMap(resultsSection, balanceChanges, meta, chainConfig);

  // 5. Risk Warnings
  renderRiskWarnings(document.getElementById('risk-warnings'), risk.flags);

  // 6. Instruction Cards
  renderInstructions(document.getElementById('instructions-list'), instructions, chainConfig);

  // Apply staggered animations
  setTimeout(() => {
    staggerEntrance('.instruction-card', 60);
  }, 300);
}

/**
 * Render transaction overview card
 */
function renderTxOverview(container, meta, chainConfig) {
  const statusClass = meta.status === 'success' ? 'success' : 'failed';
  const statusText = meta.status === 'success' ? '✅ Success' : '❌ Failed';

  const fee = meta.fee != null ? `${formatNumber(meta.fee)} ${chainConfig.symbol}` : '—';
  const time = formatTimestamp(meta.blockTime || meta.timestamp);

  // Determine signer display
  let signerDisplay = '—';
  if (meta.signers && meta.signers.length > 0) {
    signerDisplay = truncateAddress(meta.signers[0]);
  } else if (meta.from) {
    signerDisplay = truncateAddress(meta.from);
  }

  const signerFull = (meta.signers && meta.signers[0]) || meta.from || '';
  const explorerUrl = chainConfig.explorer + (meta.signature || meta.hash || '');

  container.innerHTML = `
    <div class="result-card__title">Transaction Overview</div>
    <div class="tx-overview__grid">
      <div class="tx-overview__item">
        <span class="tx-overview__item-label">Chain</span>
        <span class="tx-overview__item-value">
          <span class="tx-overview__chain-badge" style="background: ${chainConfig.color}20; color: ${chainConfig.color};">
            ${chainConfig.name}
          </span>
        </span>
      </div>
      <div class="tx-overview__item">
        <span class="tx-overview__item-label">Status</span>
        <span class="tx-overview__item-value">
          <span class="status-badge status-badge--${statusClass}">${statusText}</span>
        </span>
      </div>
      <div class="tx-overview__item">
        <span class="tx-overview__item-label">Fee</span>
        <span class="tx-overview__item-value">${fee}</span>
      </div>
      <div class="tx-overview__item">
        <span class="tx-overview__item-label">Time</span>
        <span class="tx-overview__item-value">${time}</span>
      </div>
      <div class="tx-overview__item">
        <span class="tx-overview__item-label">From / Signer</span>
        <span class="tx-overview__item-value tx-overview__item-value--mono copyable" data-copy="${signerFull}" title="Click to copy full address">
          ${signerDisplay}
          <span class="copyable__tooltip">Copied!</span>
        </span>
      </div>
      <div class="tx-overview__item">
        <span class="tx-overview__item-label">Block</span>
        <span class="tx-overview__item-value">${meta.slot || meta.blockNumber || '—'}</span>
      </div>
    </div>
    <div style="margin-top: var(--space-md);">
      <a href="${explorerUrl}" target="_blank" rel="noopener" class="explorer-link">
        View on Explorer →
      </a>
    </div>
  `;

  // Add copy click handlers
  container.querySelectorAll('.copyable').forEach(el => {
    el.addEventListener('click', () => {
      copyToClipboard(el.dataset.copy, el);
    });
  });
}

/**
 * Render balance changes summary
 */
function renderBalanceChanges(container, changes, chainConfig) {
  if (!changes || changes.length === 0) {
    container.innerHTML = `
      <div class="result-card__title">Balance Changes</div>
      <p style="color: var(--text-tertiary); font-size: 0.85rem;">No balance changes detected</p>
    `;
    return;
  }

  // Filter to only show the signer's balance changes (first few significant ones)
  const significantChanges = changes
    .filter(c => Math.abs(c.change) > 0.00001)
    .slice(0, 10);

  if (significantChanges.length === 0) {
    container.innerHTML = `
      <div class="result-card__title">Balance Changes</div>
      <p style="color: var(--text-tertiary); font-size: 0.85rem;">Negligible balance changes</p>
    `;
    return;
  }

  const changesHtml = significantChanges.map(c => {
    const isPositive = c.change > 0;
    const sign = isPositive ? '+' : '';
    const cls = isPositive ? 'positive' : 'negative';
    const symbol = c.symbol || c.token || chainConfig.symbol;
    return `<span class="balance-change balance-change--${cls}">${sign}${formatNumber(c.change)} ${symbol}</span>`;
  }).join('');

  container.innerHTML = `
    <div class="result-card__title">Balance Changes</div>
    <div class="balance-changes__list">${changesHtml}</div>
  `;
}

/**
 * Render risk warning cards
 */
function renderRiskWarnings(container, flags) {
  if (!flags || flags.length === 0) {
    container.innerHTML = '';
    return;
  }

  const warningsHtml = flags.map((flag, i) => `
    <div class="risk-warning risk-warning--${flag.severity}" style="animation-delay: ${200 + i * 60}ms;">
      <span class="risk-warning__icon">${getRiskIcon(flag.severity)}</span>
      <div class="risk-warning__content">
        <div class="risk-warning__title">${flag.label}</div>
        <div class="risk-warning__desc">${flag.description}</div>
      </div>
    </div>
  `).join('');

  container.innerHTML = warningsHtml;
}

/**
 * Render individual instruction cards
 */
function renderInstructions(container, instructions, chainConfig) {
  if (!instructions || instructions.length === 0) {
    container.innerHTML = `
      <div class="result-card" style="text-align: center; color: var(--text-tertiary);">
        No instructions decoded
      </div>
    `;
    return;
  }

  const cardsHtml = instructions.map((ix, i) => {
    const icon = getInstructionIcon(ix.type);
    const hasRisk = ix.riskFlags && ix.riskFlags.length > 0;
    const highestRisk = hasRisk
      ? ix.riskFlags.reduce((a, b) => {
          const order = { critical: 4, high: 3, medium: 2, low: 1 };
          return (order[a.severity] || 0) >= (order[b.severity] || 0) ? a : b;
        })
      : null;

    const riskClass = highestRisk ? `instruction-card--risk-${highestRisk.severity}` : '';

    // Build details rows
    let detailsHtml = '';
    if (ix.details && Object.keys(ix.details).length > 0) {
      const rows = Object.entries(ix.details)
        .filter(([_, v]) => v != null && v !== '')
        .map(([key, value]) => {
          const displayValue = typeof value === 'string' && value.length > 44
            ? truncateAddress(value, 8, 6)
            : value;
          return `
            <div class="instruction-card__detail">
              <span class="instruction-card__detail-label">${formatDetailKey(key)}</span>
              <span class="instruction-card__detail-value">${displayValue}</span>
            </div>
          `;
        }).join('');

      detailsHtml = `<div class="instruction-card__details">${rows}</div>`;
    }

    // Risk badge
    let riskBadgeHtml = '';
    if (hasRisk) {
      riskBadgeHtml = ix.riskFlags.map(f => `
        <span class="instruction-card__risk-badge instruction-card__risk-badge--${f.severity}">
          ${getRiskIcon(f.severity)} ${f.label}
        </span>
      `).join('');
    }

    return `
      <div class="instruction-card ${riskClass}" style="animation-delay: ${300 + i * 60}ms;">
        <div class="instruction-card__icon">${icon}</div>
        <div class="instruction-card__content">
          <div class="instruction-card__program">${ix.programName || 'Unknown'}</div>
          <div class="instruction-card__description">${ix.description}</div>
          ${detailsHtml}
          ${riskBadgeHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = cardsHtml;
}

/**
 * Format a camelCase detail key into readable label
 */
function formatDetailKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

/**
 * Clear all results
 */
export function clearResults() {
  document.getElementById('results-section').classList.add('hidden');
  document.getElementById('risk-meter').innerHTML = '';
  document.getElementById('tx-overview').innerHTML = '';
  document.getElementById('balance-changes').innerHTML = '';
  document.getElementById('risk-warnings').innerHTML = '';
  document.getElementById('instructions-list').innerHTML = '';
  
  const flowCard = document.getElementById('token-flow-card');
  if (flowCard) {
    flowCard.innerHTML = '';
    flowCard.classList.add('hidden');
  }
}

/**
 * Render visual token flow map diagram
 */
function renderTokenFlowMap(resultsSection, changes, meta, chainConfig) {
  let flowCard = document.getElementById('token-flow-card');
  if (!flowCard) {
    flowCard = document.createElement('div');
    flowCard.id = 'token-flow-card';
    flowCard.className = 'result-card token-flow-card';
    
    // Insert it right after the balance-changes card
    const balanceChangesEl = document.getElementById('balance-changes');
    balanceChangesEl.parentNode.insertBefore(flowCard, balanceChangesEl.nextSibling);
  }

  if (!changes || changes.length === 0) {
    flowCard.classList.add('hidden');
    return;
  }

  // Filter significant changes
  const sigChanges = changes.filter(c => Math.abs(c.change) > 0.00001);
  if (sigChanges.length === 0) {
    flowCard.classList.add('hidden');
    return;
  }

  flowCard.classList.remove('hidden');

  const signer = (meta.signers && meta.signers[0]) || meta.from || 'You';
  const target = meta.to || 'Contract';
  
  const signerDisplay = truncateAddress(signer, 6, 4);
  const targetDisplay = truncateAddress(target, 6, 4);

  const flowStepsHtml = sigChanges.map(c => {
    const isOutflow = c.change < 0;
    const absAmount = formatNumber(Math.abs(c.change));
    const symbol = c.symbol || c.token || chainConfig.symbol;
    
    const amountClass = isOutflow ? 'flow-amount--negative' : 'flow-amount--positive';
    const lineClass = isOutflow ? 'flow-line--negative' : '';
    const amountPrefix = isOutflow ? '-' : '+';

    const sourceNode = isOutflow 
      ? `<div class="flow-node"><span class="flow-node__title">Sender</span><span class="flow-node__value flow-node__value--mono copyable" data-copy="${signer}" title="Copy full address">${signerDisplay}<span class="copyable__tooltip">Copied!</span></span></div>`
      : `<div class="flow-node"><span class="flow-node__title">Source</span><span class="flow-node__value flow-node__value--mono copyable" data-copy="${target}" title="Copy full address">${targetDisplay}<span class="copyable__tooltip">Copied!</span></span></div>`;

    const destNode = isOutflow
      ? `<div class="flow-node"><span class="flow-node__title">Recipient</span><span class="flow-node__value flow-node__value--mono copyable" data-copy="${target}" title="Copy full address">${targetDisplay}<span class="copyable__tooltip">Copied!</span></span></div>`
      : `<div class="flow-node"><span class="flow-node__title">Receiver</span><span class="flow-node__value flow-node__value--mono copyable" data-copy="${signer}" title="Copy full address">${signerDisplay}<span class="copyable__tooltip">Copied!</span></span></div>`;

    return `
      <div class="flow-step">
        ${sourceNode}
        <div class="flow-arrow-container">
          <span class="flow-amount ${amountClass}">${amountPrefix}${absAmount} ${symbol}</span>
          <div class="flow-line ${lineClass}"></div>
        </div>
        ${destNode}
      </div>
    `;
  }).join('');

  flowCard.innerHTML = `
    <div class="result-card__title">Visual Asset Flow Map</div>
    <div class="token-flow-map">
      ${flowStepsHtml}
    </div>
  `;

  // Attach copy handlers
  flowCard.querySelectorAll('.copyable').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(el.dataset.copy, el);
    });
  });
}

/**
 * Show loading state
 */
export function showLoading() {
  clearResults();
  document.getElementById('loading-state').classList.remove('hidden');
  document.getElementById('error-state').classList.add('hidden');
}

/**
 * Hide loading state
 */
export function hideLoading() {
  document.getElementById('loading-state').classList.add('hidden');
}

/**
 * Show error state
 */
export function showError(message) {
  hideLoading();
  clearResults();
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

/**
 * Hide error state
 */
export function hideError() {
  document.getElementById('error-state').classList.add('hidden');
}
