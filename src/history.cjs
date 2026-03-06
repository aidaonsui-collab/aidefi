// Aidefi - Historical Data
// Track yields and prices over time

const fs = require('fs');
const path = require('path');

class HistoryTracker {
  constructor(network = 'mainnet') {
    this.network = network;
    this.dataDir = path.join(__dirname, '..', 'data');
    this.ensureDataDir();
    
    this.cache = {
      yields: [],
      prices: {},
      lastFetch: null,
    };
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Record current yields
  async recordYields(yields) {
    const record = {
      timestamp: new Date().toISOString(),
      yields: yields.map(y => ({
        protocol: y.protocol,
        asset: y.asset,
        apy: y.apy,
        TVL: y.TVL,
      })),
    };
    
    this.cache.yields.push(record);
    this.cache.lastFetch = Date.now();
    
    // Save to file
    const file = path.join(this.dataDir, 'yields.json');
    fs.writeFileSync(file, JSON.stringify(this.cache.yields.slice(-1000), null, 2));
    
    return record;
  }

  // Record prices
  async recordPrices(prices) {
    const record = {
      timestamp: new Date().toISOString(),
      prices,
    };
    
    this.cache.prices = record;
    
    const file = path.join(this.dataDir, 'prices.json');
    fs.writeFileSync(file, JSON.stringify(record, null, 2));
    
    return record;
  }

  // Get yield history
  getYieldHistory(asset, days = 7) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.cache.yields
      .filter(r => new Date(r.timestamp).getTime() > cutoff)
      .map(r => {
        const y = r.yields.find(y => y.asset === asset);
        return y ? { ...y, timestamp: r.timestamp } : null;
      })
      .filter(Boolean);
  }

  // Get price history
  getPriceHistory(asset, days = 7) {
    try {
      const file = path.join(this.dataDir, 'prices.json');
      if (!fs.existsSync(file)) return [];
      
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return data;
    } catch {
      return [];
    }
  }

  // Calculate yield change
  getYieldChange(asset, days = 7) {
    const history = this.getYieldHistory(asset, days);
    if (history.length < 2) return null;
    
    const first = history[0].apy;
    const last = history[history.length - 1].apy;
    const change = last - first;
    const pctChange = first > 0 ? (change / first) * 100 : 0;
    
    return {
      asset,
      currentAPY: last,
      previousAPY: first,
      change,
      percentChange: pctChange,
      period: days,
    };
  }

  // Get yield stats
  getYieldStats(asset, days = 30) {
    const history = this.getYieldHistory(asset, days);
    if (!history.length) return null;
    
    const apys = history.map(h => h.apy);
    const sum = apys.reduce((a, b) => a + b, 0);
    const avg = sum / apys.length;
    const max = Math.max(...apys);
    const min = Math.min(...apys);
    
    return {
      asset,
      average: avg,
      max,
      min,
      samples: apys.length,
      period: days,
    };
  }

  // Load historical data from files
  load() {
    try {
      const yieldsFile = path.join(this.dataDir, 'yields.json');
      if (fs.existsSync(yieldsFile)) {
        this.cache.yields = JSON.parse(fs.readFileSync(yieldsFile, 'utf8'));
      }
      
      const pricesFile = path.join(this.dataDir, 'prices.json');
      if (fs.existsSync(pricesFile)) {
        this.cache.prices = JSON.parse(fs.readFileSync(pricesFile, 'utf8'));
      }
    } catch (error) {
      console.error('Load history error:', error);
    }
  }
}

module.exports = { HistoryTracker };
