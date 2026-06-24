/**
 * token.js - SPL Token Program decoder
 *
 * Program ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
 * Handles the SPL Token instructions including transfers, approvals,
 * burns, mints, authority changes, and account management.
 */

export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

// Any approval amount larger than Number.MAX_SAFE_INTEGER is treated as "unlimited"
const UNLIMITED_THRESHOLD = Number.MAX_SAFE_INTEGER; // 2^53 - 1

/**
 * Decode a parsed SPL Token instruction.
 *
 * @param {object} instruction - The parsed instruction from getParsedTransaction
 * @returns {{ type: string, description: string, details: object, riskFlags: Array }}
 */
export function decodeTokenInstruction(instruction) {
  const parsed = instruction?.parsed;
  const type = parsed?.type ?? 'unknown';
  const info = parsed?.info ?? {};

  switch (type) {
    case 'transfer':
      return decodeTransfer(info);
    case 'transferChecked':
      return decodeTransferChecked(info);
    case 'approve':
      return decodeApprove(info);
    case 'approveChecked':
      return decodeApproveChecked(info);
    case 'revoke':
      return decodeRevoke(info);
    case 'burn':
      return decodeBurn(info);
    case 'burnChecked':
      return decodeBurnChecked(info);
    case 'mintTo':
      return decodeMintTo(info);
    case 'mintToChecked':
      return decodeMintToChecked(info);
    case 'closeAccount':
      return decodeCloseAccount(info);
    case 'setAuthority':
      return decodeSetAuthority(info);
    case 'initializeAccount':
    case 'initializeAccount2':
    case 'initializeAccount3':
      return decodeInitializeAccount(info, type);
    case 'initializeMint':
    case 'initializeMint2':
      return decodeInitializeMint(info, type);
    default:
      return {
        type,
        description: `SPL Token instruction: ${type}`,
        details: info,
        riskFlags: [],
      };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a raw token amount using the provided decimals.
 * Falls back to raw amount string when decimals are unavailable.
 */
function formatAmount(rawAmount, decimals) {
  const raw = typeof rawAmount === 'string' ? rawAmount : String(rawAmount ?? '0');
  if (decimals == null) return raw;
  const d = Number(decimals);
  if (d === 0) return raw;
  const padded = raw.padStart(d + 1, '0');
  const intPart = padded.slice(0, -d) || '0';
  const fracPart = padded.slice(-d).replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

function isUnlimited(amount) {
  const n = Number(amount);
  return !Number.isNaN(n) && n > UNLIMITED_THRESHOLD;
}

// ── Instruction decoders ─────────────────────────────────────────────────────

function decodeTransfer(info) {
  const amount = info.amount ?? '0';
  const source = info.source ?? 'unknown';
  const destination = info.destination ?? 'unknown';

  return {
    type: 'transfer',
    description: `Transferred ${amount} tokens from ${source} to ${destination}`,
    details: { source, destination, amount },
    riskFlags: [],
  };
}

function decodeTransferChecked(info) {
  const amount = info.tokenAmount?.amount ?? info.amount ?? '0';
  const decimals = info.tokenAmount?.decimals ?? info.decimals;
  const uiAmount = info.tokenAmount?.uiAmountString ?? formatAmount(amount, decimals);
  const source = info.source ?? 'unknown';
  const destination = info.destination ?? 'unknown';
  const mint = info.mint ?? 'unknown';

  return {
    type: 'transferChecked',
    description: `Transferred ${uiAmount} tokens (mint: ${mint}) from ${source} to ${destination}`,
    details: { source, destination, mint, amount, decimals, uiAmount },
    riskFlags: [],
  };
}

function decodeApprove(info) {
  const amount = info.amount ?? '0';
  const source = info.source ?? 'unknown';
  const delegate = info.delegate ?? 'unknown';

  const riskFlags = [];
  if (isUnlimited(amount)) {
    riskFlags.push({
      severity: 'high',
      label: 'Unlimited token approval',
      description: `Approved delegate ${delegate} to spend an effectively unlimited amount of tokens.`,
    });
  }

  return {
    type: 'approve',
    description: `Approved ${delegate} to spend ${amount} tokens from ${source}`,
    details: { source, delegate, amount },
    riskFlags,
  };
}

function decodeApproveChecked(info) {
  const amount = info.tokenAmount?.amount ?? info.amount ?? '0';
  const decimals = info.tokenAmount?.decimals ?? info.decimals;
  const uiAmount = info.tokenAmount?.uiAmountString ?? formatAmount(amount, decimals);
  const source = info.source ?? 'unknown';
  const delegate = info.delegate ?? 'unknown';
  const mint = info.mint ?? 'unknown';

  const riskFlags = [];
  if (isUnlimited(amount)) {
    riskFlags.push({
      severity: 'high',
      label: 'Unlimited token approval',
      description: `Approved delegate ${delegate} to spend an effectively unlimited amount of ${mint} tokens.`,
    });
  }

  return {
    type: 'approveChecked',
    description: `Approved ${delegate} to spend ${uiAmount} tokens (mint: ${mint}) from ${source}`,
    details: { source, delegate, mint, amount, decimals, uiAmount },
    riskFlags,
  };
}

function decodeRevoke(info) {
  const source = info.source ?? 'unknown';

  return {
    type: 'revoke',
    description: `Revoked delegate authority on account ${source}`,
    details: { source },
    riskFlags: [],
  };
}

function decodeBurn(info) {
  const amount = info.amount ?? '0';
  const account = info.account ?? 'unknown';

  return {
    type: 'burn',
    description: `Burned ${amount} tokens from ${account}`,
    details: { account, amount },
    riskFlags: [],
  };
}

function decodeBurnChecked(info) {
  const amount = info.tokenAmount?.amount ?? info.amount ?? '0';
  const decimals = info.tokenAmount?.decimals ?? info.decimals;
  const uiAmount = info.tokenAmount?.uiAmountString ?? formatAmount(amount, decimals);
  const mint = info.mint ?? 'unknown';
  const account = info.account ?? 'unknown';

  return {
    type: 'burnChecked',
    description: `Burned ${uiAmount} tokens (mint: ${mint}) from ${account}`,
    details: { account, mint, amount, decimals, uiAmount },
    riskFlags: [],
  };
}

function decodeMintTo(info) {
  const amount = info.amount ?? '0';
  const account = info.account ?? 'unknown';
  const mint = info.mint ?? 'unknown';

  return {
    type: 'mintTo',
    description: `Minted ${amount} tokens of ${mint} to ${account}`,
    details: { mint, account, amount },
    riskFlags: [],
  };
}

function decodeMintToChecked(info) {
  const amount = info.tokenAmount?.amount ?? info.amount ?? '0';
  const decimals = info.tokenAmount?.decimals ?? info.decimals;
  const uiAmount = info.tokenAmount?.uiAmountString ?? formatAmount(amount, decimals);
  const mint = info.mint ?? 'unknown';
  const account = info.account ?? 'unknown';

  return {
    type: 'mintToChecked',
    description: `Minted ${uiAmount} tokens (mint: ${mint}) to ${account}`,
    details: { mint, account, amount, decimals, uiAmount },
    riskFlags: [],
  };
}

function decodeCloseAccount(info) {
  const account = info.account ?? 'unknown';
  const destination = info.destination ?? 'unknown';

  return {
    type: 'closeAccount',
    description: `Closed token account ${account}, rent returned to ${destination}`,
    details: { account, destination },
    riskFlags: [
      {
        severity: 'medium',
        label: 'Token account closure',
        description: `Token account ${account} was closed. Any remaining token balance would be lost.`,
      },
    ],
  };
}

function decodeSetAuthority(info) {
  const account = info.account ?? info.mint ?? 'unknown';
  const authorityType = info.authorityType ?? 'unknown';
  const newAuthority = info.newAuthority ?? 'revoked';

  return {
    type: 'setAuthority',
    description: `Changed ${authorityType} authority on ${account} to ${newAuthority}`,
    details: { account, authorityType, newAuthority },
    riskFlags: [
      {
        severity: 'high',
        label: 'Authority change',
        description: `The ${authorityType} authority on ${account} was changed to ${newAuthority}. This can permanently alter who controls the account/mint.`,
      },
    ],
  };
}

function decodeInitializeAccount(info, type) {
  const account = info.account ?? 'unknown';
  const mint = info.mint ?? 'unknown';
  const owner = info.owner ?? 'unknown';

  return {
    type,
    description: `Initialized token account ${account} for mint ${mint} (owner: ${owner})`,
    details: { account, mint, owner },
    riskFlags: [],
  };
}

function decodeInitializeMint(info, type) {
  const mint = info.mint ?? 'unknown';
  const decimals = info.decimals ?? 0;
  const mintAuthority = info.mintAuthority ?? 'unknown';
  const freezeAuthority = info.freezeAuthority ?? null;

  return {
    type,
    description: `Initialized mint ${mint} with ${decimals} decimals (mint authority: ${mintAuthority})`,
    details: { mint, decimals, mintAuthority, freezeAuthority },
    riskFlags: [],
  };
}
