// Aidefi REST API Server - Complete Edition

const express = require('express');
const cors = require('cors');
const { AidefiAggregator } = require('./src/aggregator.cjs');
const { PositionTracker } = require('./src/positions.cjs');
const { PortfolioManager } = require('./src/portfolio.cjs');
const { HistoryTracker } = require('./src/history.cjs');
const { SwapExecutor } = require('./src/swap.cjs');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Initialize modules
const aggregator = new AidefiAggregator('mainnet');
const tracker = new PositionTracker('mainnet');
const portfolio = new PortfolioManager('mainnet');
const swapExecutor = new SwapExecutor('mainnet');
const history = new HistoryTracker('mainnet');
history.load();

// ===================
// CORE ENDPOINTS
// ===================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===================
// YIELDS & MARKET
// ===================

// Get all yields
app.get('/api/yields', async (req, res) => {
  try {
    const yields = await aggregator.getAllYields();
    // Record for history
    history.recordYields(yields);
    res.json({ success: true, data: yields });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get best yield for asset
app.get('/api/yields/best/:asset', async (req, res) => {
  try {
    const { asset } = req.params;
    const yield_ = await aggregator.getBestYield(asset.toUpperCase());
    res.json({ success: true, data: yield_ });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get market overview
app.get('/api/market', async (req, res) => {
  try {
    const market = await aggregator.getMarketOverview();
    history.recordPrices(market.prices);
    res.json({ success: true, data: market });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================
// PRICES
// ===================

// Get token prices
app.get('/api/prices', async (req, res) => {
  try {
    const prices = await aggregator.getTokenPrices();
    res.json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================
// POSITIONS & PORTFOLIO
// ===================

// Get wallet positions
app.get('/api/positions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const positions = await tracker.getAllPositions(address);
    res.json({ success: true, data: positions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get portfolio with yields
app.get('/api/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const portfolio_ = await portfolio.getPortfolio(address);
    res.json({ success: true, data: portfolio_ });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get portfolio value in USD
app.get('/api/portfolio/:address/value', async (req, res) => {
  try {
    const { address } = req.params;
    const prices = await aggregator.getTokenPrices();
    const value = await tracker.getPortfolioValue(address, prices);
    res.json({ success: true, data: value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================
// SWAP
// ===================

// Get swap quote
app.post('/api/swap/quote', async (req, res) => {
  try {
    const { from, to, amount, slippage } = req.body;
    const quote = await swapExecutor.getQuote(from.toUpperCase(), to.toUpperCase(), amount, slippage || 0.5);
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute swap (requires private key in body - for testing only)
app.post('/api/swap/execute', async (req, res) => {
  try {
    const { privateKey, from, to, amount, slippage } = req.body;
    if (!privateKey) {
      return res.status(400).json({ success: false, error: 'Private key required' });
    }
    const result = await swapExecutor.executeSwap(privateKey, from.toUpperCase(), to.toUpperCase(), amount, slippage || 0.5);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get supported swap pairs
app.get('/api/swap/pairs', async (req, res) => {
  try {
    const pairs = await swapExecutor.getSupportedPairs();
    res.json({ success: true, data: pairs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================
// ALERTS
// ===================

// Set yield alert
app.post('/api/alerts', async (req, res) => {
  try {
    const { asset, targetAPY } = req.body;
    const alert = portfolio.setAlert(asset.toUpperCase(), targetAPY, (yield_) => {
      console.log(`ALERT: ${asset} yield now ${yield_.apy * 100}%`);
    });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get alerts
app.get('/api/alerts', (req, res) => {
  res.json({ success: true, data: portfolio.getAlerts() });
});

// Delete alert
app.delete('/api/alerts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = portfolio.removeAlert(parseInt(id));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check alerts
app.post('/api/alerts/check', async (req, res) => {
  try {
    const triggered = await portfolio.checkAlerts();
    res.json({ success: true, data: triggered });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================
// HISTORY
// ===================

// Get yield history
app.get('/api/history/yields/:asset', (req, res) => {
  try {
    const { asset } = req.params;
    const { days } = req.query;
    const data = history.getYieldHistory(asset.toUpperCase(), parseInt(days) || 7);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get yield change
app.get('/api/history/change/:asset', (req, res) => {
  try {
    const { asset } = req.params;
    const { days } = req.query;
    const data = history.getYieldChange(asset.toUpperCase(), parseInt(days) || 7);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get yield stats
app.get('/api/history/stats/:asset', (req, res) => {
  try {
    const { asset } = req.params;
    const { days } = req.query;
    const data = history.getYieldStats(asset.toUpperCase(), parseInt(days) || 30);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================
// PROTOCOLS
// ===================

// Get supported protocols
app.get('/api/protocols', (req, res) => {
  res.json({ success: true, data: aggregator.getProtocols() });
});

// ===================
// SERVER
// ===================

app.listen(PORT, () => {
  console.log(`🤖 Aidefi API running on http://localhost:${PORT}`);
  console.log('\n=== ENDPOINTS ===');
  console.log('GET  /health                    - Health check');
  console.log('GET  /api/prices                - Token prices');
  console.log('GET  /api/yields                - All yields');
  console.log('GET  /api/yields/best/:asset    - Best yield');
  console.log('GET  /api/market                - Market overview + TVL');
  console.log('GET  /api/positions/:address   - Wallet positions');
  console.log('GET  /api/portfolio/:address   - Portfolio with yields');
  console.log('GET  /api/portfolio/:address/value - Portfolio value');
  console.log('POST /api/swap/quote            - Get swap quote');
  console.log('POST /api/swap/execute          - Execute swap (needs key)');
  console.log('GET  /api/swap/pairs            - Supported pairs');
  console.log('POST /api/alerts                - Set yield alert');
  console.log('GET  /api/alerts                - List alerts');
  console.log('POST /api/alerts/check          - Check alerts');
  console.log('GET  /api/history/yields/:asset - Yield history');
  console.log('GET  /api/history/change/:asset - Yield change');
  console.log('GET  /api/history/stats/:asset  - Yield stats');
  console.log('GET  /api/protocols             - Protocols');
});
