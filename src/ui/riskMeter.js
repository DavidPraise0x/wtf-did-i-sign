/**
 * Risk Meter — Animated SVG gauge component
 * Renders a semicircular gauge that fills based on risk score (0-100)
 */

/**
 * Render the risk meter gauge into the container
 * @param {HTMLElement} container - The DOM element to render into
 * @param {number} score - Risk score 0-100
 * @param {string} level - Risk level: 'low'|'medium'|'high'|'critical'
 */
export function renderRiskMeter(container, score, level) {
  const colors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f43f5e',
    critical: '#dc2626',
  };

  const labels = {
    low: 'LOW RISK',
    medium: 'MEDIUM RISK',
    high: 'HIGH RISK',
    critical: 'CRITICAL',
  };

  const color = colors[level] || colors.medium;
  const label = labels[level] || 'UNKNOWN';

  // SVG arc math
  const radius = 80;
  const strokeWidth = 10;
  const cx = 100;
  const cy = 90;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI;
  const circumference = totalArc * radius;
  const fillLength = (score / 100) * circumference;
  const dashOffset = circumference - fillLength;

  // Create arc path (semicircle from left to right)
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;

  container.innerHTML = `
    <div class="risk-meter__gauge">
      <svg viewBox="0 0 200 110" width="200" height="110">
        <!-- Background arc -->
        <path
          d="M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
        />
        <!-- Filled arc -->
        <path
          class="risk-meter__arc"
          d="M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}"
          fill="none"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"
          style="filter: drop-shadow(0 0 8px ${color}80);"
        />
        <!-- Score text -->
        <text x="${cx}" y="${cy - 10}" text-anchor="middle" fill="${color}" font-size="32" font-weight="800" font-family="Inter, sans-serif">
          ${score}
        </text>
        <text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="${color}cc" font-size="10" font-weight="600" font-family="Inter, sans-serif" letter-spacing="0.1em">
          / 100
        </text>
      </svg>
    </div>
    <div class="risk-meter__label risk-meter__label--${level}">${label}</div>
  `;

  // Animate the arc fill after a brief delay
  requestAnimationFrame(() => {
    setTimeout(() => {
      const arc = container.querySelector('.risk-meter__arc');
      if (arc) {
        arc.style.strokeDashoffset = dashOffset;
      }
    }, 100);
  });
}
