/**
 * Risk Analysis Engine
 * Chain-agnostic — works with standardized DecodedInstruction format from any chain
 *
 * Risk scoring:
 *   0-20: LOW (safe, normal activity)
 *  21-50: MEDIUM (some caution advised)
 *  51-80: HIGH (dangerous patterns detected)
 *  81-100: CRITICAL (very likely malicious)
 */

/**
 * Analyze decoded instructions for risk patterns
 * @param {Array} instructions - Decoded instructions from any chain decoder
 * @returns {{ score: number, level: string, flags: Array }}
 */
export function analyzeRisk(instructions) {
  const flags = [];

  // Collect all risk flags from individual instructions
  instructions.forEach((ix, index) => {
    if (ix.riskFlags && ix.riskFlags.length > 0) {
      ix.riskFlags.forEach(flag => {
        flags.push({
          ...flag,
          instructionIndex: index,
          programName: ix.programName,
        });
      });
    }
  });

  // Additional cross-instruction analysis
  const crossFlags = analyzeCrossInstructionPatterns(instructions);
  flags.push(...crossFlags);

  // Calculate score
  const score = calculateScore(flags);
  const level = getLevel(score);

  return { score, level, flags };
}

/**
 * Look for suspicious patterns across multiple instructions
 */
function analyzeCrossInstructionPatterns(instructions) {
  const flags = [];

  // Count approvals in a single transaction
  const approvalCount = instructions.filter(ix =>
    ix.type === 'approve' || ix.type === 'approveChecked'
  ).length;

  if (approvalCount >= 2) {
    flags.push({
      severity: 'high',
      label: 'Multiple Approvals',
      description: `This transaction contains ${approvalCount} token approvals. Batch approvals are a common pattern in phishing attacks.`,
    });
  }

  // Count unknown program interactions
  const unknownCount = instructions.filter(ix =>
    ix.type === 'unknown' || ix.programName === 'Unknown Program'
  ).length;

  if (unknownCount >= 3) {
    flags.push({
      severity: 'medium',
      label: 'Many Unknown Programs',
      description: `This transaction interacts with ${unknownCount} unrecognized programs/contracts. Exercise caution.`,
    });
  }

  // Check for approval + transfer combo (potential drain pattern)
  const hasApproval = instructions.some(ix => ix.type === 'approve' || ix.type === 'approveChecked');
  const hasTransferFrom = instructions.some(ix => ix.type === 'transferFrom');
  if (hasApproval && hasTransferFrom) {
    flags.push({
      severity: 'high',
      label: 'Approve + TransferFrom Combo',
      description: 'This transaction approves token spending AND immediately transfers tokens. This is a common drain pattern.',
    });
  }

  return flags;
}

/**
 * Calculate overall risk score from flags
 */
function calculateScore(flags) {
  if (flags.length === 0) return 0;

  const severityWeights = {
    low: 8,
    medium: 20,
    high: 40,
    critical: 70,
  };

  let totalWeight = 0;
  flags.forEach(flag => {
    totalWeight += severityWeights[flag.severity] || 10;
  });

  // Cap at 100
  return Math.min(100, totalWeight);
}

/**
 * Get risk level label from score
 */
function getLevel(score) {
  if (score <= 20) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

/**
 * Get human-readable risk level text
 */
export function getRiskLabel(level) {
  const labels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };
  return labels[level] || 'Unknown';
}

/**
 * Get risk icon
 */
export function getRiskIcon(severity) {
  const icons = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🔴',
    critical: '🚨',
  };
  return icons[severity] || '❓';
}
