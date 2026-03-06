// Aidefi - Swap Quote Estimator

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');

class SwapExecutor {
  constructor(network = 'mainnet') {
    this.network = network;
    this.client = null;
  }

  async init() {
    if (this.client) return;
    const url = this.network === 'mainnet' 
      ? 'https://fullnode.mainnet.sui.io' 
      : 'https://fullnode.testnet.sui.io';
    this.client = new SuiClient({ url });
  }

  // Get swap quote (estimate based on prices)
  async getQuote(fromCoin, toCoin, amount, slippage = 0.5) {
    try {
      await this.init();
      
      // Get prices
      const prices = {
        SUI: 0.96,
        USDC: 1.0,
        USDT: 1.0,
        BTC: 71000,
        ETH: 2080,
        SOL: 89,
      };
      
      const fromPrice = prices[fromCoin.toUpperCase()] || 1;
      const toPrice = prices[toCoin.toUpperCase()] || 1;
      
      // Calculate output
      const rate = toPrice / fromPrice;
      const output = amount * rate;
      const minOutput = output * (1 - slippage / 100);

      return {
        from: fromCoin,
        to: toCoin,
        amount,
        estimatedOutput: output,
        minOutput,
        priceImpact: slippage,
        rate,
        network: this.network,
      };
    } catch (error) {
      console.error('Quote error:', error);
      return { error: error.message };
    }
  }

  async executeSwap(privateKey, fromCoin, toCoin, amount, slippage = 0.5) {
    return {
      error: 'Execute swap requires signing - use CLI or wallet',
      note: 'Use: sui client call --function swap ...'
    };
  }

  async getSupportedPairs() {
    return [
      { from: 'SUI', to: 'USDC', protocol: 'Cetus' },
      { from: 'SUI', to: 'USDT', protocol: 'Cetus' },
      { from: 'USDC', to: 'USDT', protocol: 'Cetus' },
    ];
  }
}

module.exports = { SwapExecutor };
