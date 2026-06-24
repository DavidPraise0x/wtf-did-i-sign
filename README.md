# 🔍 WTF Did I Sign?

> **Because you should know what you are signing before it is too late.**

**WTF Did I Sign?** is a premium, client-side Web3 dApp designed to translate raw blockchain transaction hashes and signatures into plain, human-readable English. It helps users understand exactly what smart contract interactions, token approvals, transfers, and account closures occurred in a transaction before they execute similar calls.

It features an immersive, game-like cosmic design, interactive backgrounds, real-time risk scoring, and a visual asset flow diagram. **100% free, 100% client-side, with zero server trackers or database cost.**

Live dev server default: `http://localhost:5199`

---

## 🌟 Features

*   **Multi-Chain Auto-Detection**: Paste any transaction hash/signature. The app automatically detects Solana signatures (Base58) vs. EVM hashes (`0x`). For EVM hashes, it races public RPC nodes in parallel to find which chain the transaction occurred on (Ethereum, Base, Polygon, Arbitrum, or BNB Chain) in **<300ms**.
*   **Plain English Translator**: Decodes raw instruction data and contract calldata into human-readable descriptions.
    *   *Solana:* System Program, SPL Token, Associated Token, Memo Program, Jupiter Swaps, and Raydium interactions.
    *   *EVM:* ETH transfers, ERC20 transfers/approvals/allowances, Uniswap V2, and Uniswap V3 (featuring a recursive struct decoder to parse nested multicall tuples without returning `undefined`).
*   **Visual Asset Flow Map**: A responsive, node-based diagram that dynamically maps inflows and outflows between you, smart contracts, and recipients with flowing animated paths.
*   **Security Risk Engine**: Evaluates transaction instructions and flags dangerous patterns:
    *   🔴 **Critical/High**: Unlimited token approvals, authority change permissions, self-destruct opcodes, or suspicious batch approvals.
    *   🟡 **Medium**: Token account closures, large transfers, or interactions with unknown smart contracts.
*   **Interactive Ambient Aura Glow**: Page backdrop colors pulse and shift dynamically using modern `@property` transitions to reflect the transaction risk level (Low = Green, Medium = Gold, High = Coral, Critical = Pulsing Crimson/Violet alert aura).
*   **Laser Diagnostic Scanner**: A neon cyan scanline sweeps down the results section when revealed, simulating a cryptographic diagnostic scan.
*   **Recent Lookups Drawer**: A frosted-glass history drawer that slides in from the right to persist and quick-load your last 10 successful lookups using local storage.
*   **Buttery-Smooth Background Canvas**: A high-performance HTML5 canvas animation running at **60 FPS** featuring starfield parallax drift, cursor sparkle trails, and moving 3D-ish space objects (rockets, astronauts, UFOs) cached onto off-screen canvases to prevent rendering lag.

---

## 🛠️ Technology Stack

| Layer | Choice |
| :--- | :--- |
| **Frontend Framework** | [Vite](https://vitejs.dev/) + Vanilla ES6 Modules & Javascript |
| **Solana Integration** | [@solana/web3.js](https://github.com/solana-labs/solana-web3.js) |
| **EVM Integration** | [ethers.js (v6)](https://docs.ethers.org/v6/) |
| **Styling** | Vanilla CSS (Frosted glassmorphism, HSL tailormade colors) |
| **Selector Directory** | [4byte.directory API](https://www.4byte.directory/) (fallback signature parsing) |
| **RPC Fallbacks** | Multi-RPC redundant arrays per chain (zero cost, zero keys) |

---

## 📂 Project Structure

```text
wtf-did-i-sign/
├── index.html            # Core layout & History drawer structure
├── vite.config.js        # Vite config with buffer polyfills for Web3
├── package.json          # Node dependencies
├── src/
│   ├── main.js           # Entry point, orchestrator
│   ├── style.css         # Complete design system & keyframe animations
│   ├── chains/
│   │   ├── config.js     # Redundant RPCs and Explorer URLs
│   │   ├── detector.js   # Hash format regex validators
│   │   └── tokens.js     # Decimals and token symbol maps
│   ├── solana/
│   │   ├── fetcher.js    # Solana RPC connection
│   │   ├── decoder.js    # Solana program instruction router
│   │   └── programs/     # Decoders (System, Token, Jupiter, Raydium, Memo)
│   ├── evm/
│   │   ├── fetcher.js    # EVM providers (transaction & receipt)
│   │   ├── decoder.js    # EVM ABI parser & signature resolver
│   │   ├── fourByte.js   # 4byte.directory signature API lookup cache
│   │   └── abis/         # Known contract ABI fragments (ERC20, Uniswap)
│   ├── risk/
│   │   └── analyzer.js   # Risk scoring & threat flagging engine
│   └── ui/
│       ├── renderer.js   # DOM builder, Scanner, & Token Flow Map renderer
│       ├── riskMeter.js  # Semicircular SVG risk meter gauge
│       ├── animations.js # Staggered entrances & helpers
│       └── background.js # 60 FPS GPU-accelerated canvas background
```

---

## 🚀 Quick Start (Local Setup)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/DavidPraise0x/wtf-did-i-sign.git
    cd wtf-did-i-sign
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev -- --port 5199
    ```
    Open `http://localhost:5199` in your browser.

4.  **Build for Production**
    ```bash
    npm run build
    ```
    Static files will be generated in the `dist/` directory, ready to deploy to Vercel, Netlify, or GitHub Pages.

---

## 👤 Author

Built by **davidpraise** (2026)
