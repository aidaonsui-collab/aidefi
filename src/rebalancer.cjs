// Aidefi - Auto-Rebalancer
// Automatically moves funds to highest yield

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');

class AutoRebalancer {
  constructor(network = 'mainnet') {
    this.network = network;
    this.client = new SuiClient({ 
      url: network === 'mainnet' ? 'https://fullnode.mainnet.sui.io' : 'https://fullnode.testnet.sui.io' 
    });
    this.minYieldDiff = 0.01; // 1% difference triggers rebalance
  }

  // Check if rebalancing is worth it
  async shouldRebalance(currentProtocol, currentAPY, newProtocol, newAPY) {
    if (!currentAPY || !newAPY) return false;
    return (newAPY - currentAPY) > this.minYieldDiff;
  }

  // Get optimal allocation
  async getOptimalAllocation(assets) {
    // Returns recommended allocation based on yields
    const yields = require('./aggregator.cjs');
    const agg = new yields.AidefiAggregator(this.network);
    const allYields = await agg.getAllYields();
    
    const optimal = {};
    for (const asset of assets) {
      const assetYields = allYields.filter(y => y.asset === asset);
      if (assetYields.length > 0) {
        const best = assetYields.reduce((a, b) => a.apy > b.apy ? a : b);
        optimal[asset] = {
          protocol: best.protocol,
          apy: best.apy,
        };
      }
    }
    return optimal;
  }

  // Calculate rebalance amount
  calculateRebalance(currentAmount, newAPY, oldAPY) {
    const apyDiff = newAPY - oldAPY;
    const monthlyExtra = currentAmount * (apyDiff / 12);
    const yearlyExtra = currentAmount * apyDiff;
    return { monthlyExtra, yearlyExtra };
  }

  // Get rebalance recommendation
  async getRecommendation(walletAddress) {
    const positions = await this.getPositions(walletAddress);
    const optimal = await this.getOptimalAllocation(Object.keys(positions));
    
    const recommendations = [];
    for (const [asset, data] of Object.entries(optimal)) {
      if (positions[asset]) {
        const current = positions[asset];
        if (current.protocol !== data.protocol) {
          recommendations.push({
            asset,
            from: current.protocol,
            to: data.protocol,
            apyDiff: data.apy - current.apy,
            extraYield: this.calculateRebalance(current.amount, data.apy, current.apy),
          });
        }
      }
    }
    
    return recommendations;
  }

  async getPositions(walletAddress) {
    const coins = await this.client.getCoins({ owner: walletAddress });
    const positions = {};
    
    for (const coin of coins.data || []) {
      const symbol = coin.coinType.split('::').pop();
      if (!positions[symbol]) {
        positions[symbol] = { amount: 0, protocol: 'wallet' };
      }
      positions[symbol] = { amount: positions[symbol] ? positions[symbol].amount + Number(coin.balance) : Number(coin.balance), protocol: "wallet" };
    }
    
    return Object.fromEntries(
    Object.entries(positions).map(([k,v]) => [k, { ...v, amount: Number(v.amount) }])
  );
  }
}

module.exports = { AutoRebalancer };
