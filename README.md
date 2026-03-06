# 🤖 Aidefi - AI Agent DeFi Yield Optimizer

A self-hosted API and dashboard that helps AI agents find and manage the best yields across Sui DeFi protocols.

## Quick Start

### 1. Start the API Server
```bash
cd ~/.openclaw/workspace/aidefi
node server.js
```

### 2. Open Dashboard
```
http://localhost:3003
```

### 3. Use CLI
```bash
cd cli
npm install
node aidefi.js prices
node aidefi.js best SUI
```

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENT FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘

1. DISCOVER
   ┌─────────────┐      ┌──────────────┐
   │ Agent finds │ ───► │ GET /api/   │
   │   Aidefi   │      │ protocols    │
   └─────────────┘      └──────────────┘

2. WALLET
   ┌─────────────┐      ┌──────────────┐
   │ Generate or │ ───► │ Derive from  │
   │ use existing│      │ mnemonic/key │
   └─────────────┘      └──────────────┘

3. FUND
   ┌─────────────┐      ┌──────────────┐
   │ Get SUI     │ ───► │ Buy on       │
   │ (gas + dep) │      │ exchange     │
   └─────────────┘      └──────────────┘

4. CHECK YIELDS
   ┌─────────────┐      ┌──────────────┐
   │ Call API    │ ───► │ Returns all  │
   │ /api/yields │      │ yields       │
   └─────────────┘      └──────────────┘

5. FIND BEST
   ┌─────────────┐      ┌──────────────┐
   │ /best/SUI   │ ───► │ Navi @ 5%    │
   │             │      │ Best rate!   │
   └─────────────┘      └──────────────┘

6. DEPOSIT
   ┌─────────────┐      ┌──────────────┐
   │ Execute     │ ───► │ sui client   │
   │ transaction │      │ call         │
   └─────────────┘      └──────────────┘

7. MONITOR
   ┌─────────────┐      ┌──────────────┐
   │ /rebalance  │ ───► │ Alert: move  │
   │             │      │ to better APY│
   └─────────────┘      └──────────────┘
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prices` | Token prices |
| GET | `/api/yields` | All yields |
| GET | `/api/yields/best/:asset` | Best yield |
| GET | `/api/market` | Market + TVL |
| GET | `/api/portfolio/:address` | Wallet positions |
| GET | `/api/rebalance/:address` | Rebalance tips |
| POST | `/api/swap/quote` | Swap estimate |

---

## 💻 CLI Commands

```bash
# Get prices
node aidefi.js prices

# Get yields
node aidefi.js yields

# Best yield for asset
node aidefi.js best SUI

# Portfolio
node aidefi.js portfolio 0x...

# Rebalance recommendation
node aidefi.js rebalance 0x...
```

---

## 🔧 Supported Protocols

| Protocol | Type | Best Yield |
|----------|------|------------|
| Navi | Lending | 5% APY |
| Suilend | Lending | 4% APY |
| Cetus | DEX | ~2% APY |
| Turbos | DEX | ~1.8% APY |
| Bluefin | Perpetuals | 3.65% APY |

---

## 🌐 Public Access (Tunnel)

When running with cloudflared:
```
https://your-tunnel.trycloudflare.com
```

---

## 🔐 Security

- Never share private keys
- Use testnet for development
- Review transactions before signing
- Keep mnemonic secure

---

## 📊 Current Stats

- Total TVL: ~$387M
- Protocols: 5
- Assets: SUI, USDC, USDT, BTC, ETH, SOL

---

## 🤝 For Developers

To integrate with your agent:

```javascript
// Call from any agent
const response = await fetch('http://localhost:3002/api/yields/best/SUI');
const data = await response.json();
console.log(data.data); // { protocol: "navi", apy: 0.05 }
```

Or use MCP server for tool-based integration.

---

Built by Aida 🤖
