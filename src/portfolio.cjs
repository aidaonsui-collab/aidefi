// Aidefi - Portfolio View + Alerting
// Combine positions with yields for portfolio overview

const { PositionTracker } = require('./positions.cjs');
const { AidefiAggregator } = require('./aggregator.cjs');

class PortfolioManager {
  constructor(network = 'mainnet') {
    this.network = network;
    this.tracker = new PositionTracker(network);
    this.aggregator = new AidefiAggregator(network);
    this.alerts = [];
  }

  // Get full portfolio view
  async getPortfolio(walletAddress) {
    try {
      // Get positions and prices in parallel
      const [positions, prices, yields] = await Promise.all([
        this.tracker.getAllPositions(walletAddress),
        this.aggregator.getTokenPrices(),
        this.aggregator.getAllYields(),
      ]);

      // Calculate value
      let totalValue = 0;
      const assets = [];

      // Native SUI
      if (positions.native?.SUI) {
        const suiValue = Number(positions.native.SUI) / 1e9 * (prices.SUI || 0);
        totalValue += suiValue;
        
        // Find yield for SUI
        const suiYield = yields.find(y => y.protocol === 'navi' && y.asset === 'SUI');
        
        assets.push({
          symbol: 'SUI',
          balance: positions.native.SUI,
          value: suiValue,
          apy: suiYield?.apy || 0,
          yieldValue: suiValue * (suiYield?.apy || 0),
        });
      }

      // Other coins
      for (const coin of positions.coins || []) {
        const symbol = coin.type.split('::').pop().split('::').pop();
        const value = Number(coin.balance) / 1e9 * (prices[symbol] || 0);
        totalValue += value;
        
        const yield_ = yields.find(y => y.asset === symbol);
        
        assets.push({
          symbol,
          balance: coin.balance,
          value,
          apy: yield_?.apy || 0,
          yieldValue: value * (yield_?.apy || 0),
        });
      }

      // Sort by value
      assets.sort((a, b) => b.value - a.value);

      return {
        address: walletAddress,
        totalValue,
        assets,
        estimatedYield: assets.reduce((sum, a) => sum + a.yieldValue, 0),
        prices,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Portfolio error:', error);
      return { error: error.message };
    }
  }

  // Set up yield alert
  setAlert(asset, targetAPY, callback) {
    const alert = {
      id: Date.now(),
      asset,
      targetAPY,
      callback,
      created: new Date().toISOString(),
    };
    this.alerts.push(alert);
    return alert;
  }

  // Check alerts
  async checkAlerts() {
    try {
      const yields = await this.aggregator.getAllYields();
      const triggered = [];

      for (const alert of this.alerts) {
        const yield_ = yields.find(y => y.asset === alert.asset);
        if (yield_ && yield_.apy >= alert.targetAPY) {
          triggered.push({ alert, yield: yield_ });
          alert.callback(yield_);
        }
      }

      return triggered;
    } catch (error) {
      console.error('Check alerts error:', error);
      return [];
    }
  }

  // Get alert list
  getAlerts() {
    return this.alerts;
  }

  // Remove alert
  removeAlert(alertId) {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    return { removed: alertId };
  }
}

module.exports = { PortfolioManager };
