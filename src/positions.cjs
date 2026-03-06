// Aidefi - Position Tracking
// Query user's on-chain positions across Sui DeFi protocols

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');

// Protocol contract addresses
const PROTOCOLS = {
  NAVI: '0x53ef4b837bea8d553e196a08b80efc0eb10cfc9b8fdb4ee53360e6d6b96c0f3e',
  SUILEND: '0x54a2484b1644d1bc19d7f17f324a591cba8e4b5d7e4d8f4a0f5c4b5d7e4d8f4',
  CETUS: '0xceterumfermaborrationescentrale142ddbeacafafa33f5ceecaf5e94c8b27b5d4606fa0fe',
};

class PositionTracker {
  constructor(network = 'mainnet') {
    this.network = network;
    this.client = new SuiClient({
      url: network === 'mainnet'
        ? 'https://fullnode.mainnet.sui.io'
        : 'https://fullnode.testnet.sui.io'
    });
  }

  // Get all coins for a wallet
  async getCoins(walletAddress) {
    try {
      const coins = await this.client.getCoins({ owner: walletAddress });
      
      // Group by coin type
      const byType = {};
      for (const coin of coins.data) {
        const type = coin.coinType;
        if (!byType[type]) {
          byType[type] = { type, balance: 0, count: 0 };
        }
        byType[type].balance += BigInt(coin.balance);
        byType[type].count++;
      }
      
      return Object.values(byType).map(c => ({
        ...c,
        balance: c.balance.toString()
      }));
    } catch (error) {
      console.error('Get coins error:', error);
      return [];
    }
  }

  // Get NFT positions (Cetus LP positions)
  async getLPPositions(walletAddress) {
    try {
      // Query dynamic fields for positions
      const objects = await this.client.getDynamicFields({
        parentId: walletAddress,
      });
      
      // Filter for LP/nft positions
      const positions = [];
      for (const obj of objects.data || []) {
        if (obj.objectType?.includes('LP') || obj.objectType?.includes('Position')) {
          const details = await this.client.getObject({
            id: obj.objectId,
            options: { showContent: true }
          });
          positions.push({
            id: obj.objectId,
            type: obj.objectType,
            data: details.data?.content?.fields
          });
        }
      }
      
      return positions;
    } catch (error) {
      console.error('LP positions error:', error);
      return [];
    }
  }

  // Get all positions for a wallet
  async getAllPositions(walletAddress) {
    try {
      const [coins, lpPositions] = await Promise.all([
        this.getCoins(walletAddress),
        this.getLPPositions(walletAddress),
      ]);

      // Get SUI balance (native token)
      const suiBalance = await this.client.getBalance({
        owner: walletAddress,
        coinType: '0x2::sui::SUI'
      });

      return {
        address: walletAddress,
        native: {
          SUI: suiBalance.totalBalance
        },
        coins,
        lpPositions,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('All positions error:', error);
      return { error: error.message };
    }
  }

  // Calculate portfolio value in USD
  async getPortfolioValue(walletAddress, prices = {}) {
    const positions = await this.getAllPositions(walletAddress);
    if (positions.error) return positions;
    
    let totalValue = 0;
    const breakdown = [];
    
    // Value native SUI
    if (positions.native?.SUI) {
      const suiValue = Number(positions.native.SUI) / 1e9 * (prices.SUI || 0);
      totalValue += suiValue;
      breakdown.push({ asset: 'SUI', balance: positions.native.SUI, value: suiValue });
    }
    
    // Value other coins
    for (const coin of positions.coins || []) {
      const symbol = coin.type.split('::').pop();
      const price = prices[symbol] || 0;
      // Most Sui coins have 9 decimals
      const value = Number(coin.balance) / 1e9 * price;
      totalValue += value;
      breakdown.push({ asset: symbol, balance: coin.balance, value });
    }
    
    return {
      totalValue,
      breakdown,
      lastUpdated: positions.lastUpdated
    };
  }
}

module.exports = { PositionTracker };
