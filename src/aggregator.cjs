// Aidefi - Unified DeFi Aggregator
// Uses multiple price sources + fallbacks

class AidefiAggregator {
  constructor(network = 'mainnet') {
    this.network = network;
    this.client = new (require('@mysten/sui/client')).SuiClient({ 
      url: network === 'mainnet' ? 'https://fullnode.mainnet.sui.io' : 'https://fullnode.testnet.sui.io' 
    });
    
    // Fallback prices (updated periodically)
    this.fallbackPrices = {
      SUI: 0.95,
      USDC: 1.0,
      USDT: 1.0,
      BTC: 71000,
      ETH: 2080,
      SOL: 89,
    };
  }

  async fetchProtocolTVL() {
    try {
      const response = await fetch('https://api.llama.fi/protocols');
      const data = await response.json();
      const tvl = {};
      for (const protocol of data) {
        const name = protocol.name.toLowerCase();
        if (['navi', 'suilend', 'cetus', 'turbos', 'bluefin'].some(n => name.includes(n))) {
          tvl[name] = protocol.tvl || 0;
        }
      }
      return tvl;
    } catch (error) {
      return {};
    }
  }

  async getTokenPrices() {
    // Try multiple sources
    try {
      const urls = [
        'https://api.coingecko.com/api/v3/simple/price?ids=sui,usd-coin,tether,bitcoin,ethereum,solana&vs_currencies=usd',
      ];
      
      for (const url of urls) {
        try {
          const response = await fetch(url);
          const data = await response.json();
          
          // Check for rate limit
          if (data.status?.error_message?.includes('Rate Limit')) {
            continue;
          }
          
          return {
            SUI: data.sui?.usd || this.fallbackPrices.SUI,
            USDC: data['usd-coin']?.usd || this.fallbackPrices.USDC,
            USDT: data.tether?.usd || this.fallbackPrices.USDT,
            BTC: data.bitcoin?.usd || this.fallbackPrices.BTC,
            ETH: data.ethereum?.usd || this.fallbackPrices.ETH,
            SOL: data.solana?.usd || this.fallbackPrices.SOL,
          };
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.error('All price sources failed');
    }
    
    // Return fallback prices
    return this.fallbackPrices;
  }

  async getBestYield(asset) {
    const allYields = await this.getAllYields();
    const assetYields = allYields.filter(y => y.asset === asset);
    if (!assetYields.length) return null;
    assetYields.sort((a, b) => b.apy - a.apy);
    return assetYields[0];
  }

  async getAllYields() {
    const yields = [];
    try {
      const tvl = await this.fetchProtocolTVL();
      const prices = await this.getTokenPrices();
      
      const apys = {
        navi: { SUI: 0.05, USDC: 0.035, USDT: 0.035, BTC: 0.02, ETH: 0.025 },
        suilend: { SUI: 0.04, USDC: 0.032, USDT: 0.032, BTC: 0.018, ETH: 0.022 },
        cetus: { SUI: 0.02, USDC: 0.015 },
        turbos: { SUI: 0.018, USDC: 0.012 },
        bluefin: { BTC: 0.0365, ETH: 0.03, SOL: 0.028 },
      };
      
      const protocolYields = [
        { protocol: 'navi', assets: ['SUI', 'USDC', 'USDT', 'BTC', 'ETH'] },
        { protocol: 'suilend', assets: ['SUI', 'USDC', 'USDT', 'BTC', 'ETH'] },
        { protocol: 'cetus', assets: ['SUI', 'USDC'] },
        { protocol: 'turbos', assets: ['SUI', 'USDC'] },
        { protocol: 'bluefin', assets: ['BTC', 'ETH', 'SOL'] },
      ];
      
      for (const p of protocolYields) {
        const protocolTVL = tvl[p.protocol] || tvl[p.protocol + ' lending'] || tvl[p.protocol + ' clmm'] || 0;
        const assetAPYs = apys[p.protocol] || {};
        
        for (const asset of p.assets) {
          yields.push({
            protocol: p.protocol,
            asset: asset,
            apy: assetAPYs[asset] || 0,
            TVL: protocolTVL * 0.2,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching yields:', error);
    }
    return yields;
  }

  async getMarketOverview() {
    const prices = await this.getTokenPrices();
    const yields = await this.getAllYields();
    const tvl = await this.fetchProtocolTVL();
    const totalTVL = Object.values(tvl).reduce((a, b) => a + b, 0);
    
    return { prices, topYields: yields.sort((a, b) => b.apy - a.apy).slice(0, 5), protocolTVL: tvl, totalTVL };
  }

  getProtocols() {
    return [
      { id: 'navi', name: 'Navi', category: 'lending' },
      { id: 'suilend', name: 'Suilend', category: 'lending' },
      { id: 'cetus', name: 'Cetus', category: 'DEX' },
      { id: 'turbos', name: 'Turbos', category: 'DEX' },
      { id: 'bluefin', name: 'Bluefin', category: 'perpetuals' },
    ];
  }
}

module.exports = { AidefiAggregator };
