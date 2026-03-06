// Aidefi - Unified DeFi Agent API
// Main exports

// Protocol integrations
{ NaviIntegration } from './protocols/navi.js';
{ CetusIntegration } from './protocols/cetus.js';
{ SuilendIntegration } from './protocols/suilend.js';
{ TurbosIntegration } from './protocols/turbos.js';
{ BluefinIntegration } from './protocols/bluefin.js';

// Aggregator
{ AidefiAggregator } from './aggregator.js';

// Types
type { UnifiedYield, UnifiedSwap, UnifiedPosition } from './aggregator.js';

// ============================================================================
// Main Agent API
// ============================================================================

class AidefiAgent {
  private client: SuiClient;
  private walletAddress: string;

  constructor(network: 'mainnet' | 'testnet' = 'testnet', walletAddress?: string) {
    this.client = new SuiClient({ url: getFullnodeUrl(network) });
    this.walletAddress = walletAddress || '';
  }

  setWallet(address: string) {
    this.walletAddress = address;
  }

  // --------------------------------------------------------------------------
  // YIELDS - Get best yields across all lending protocols
  // --------------------------------------------------------------------------

  /**
   * Get yields from all lending protocols
   */
  async getYields(assets: string[] = ['SUI', 'USDC', 'USDT']): Promise<YieldInfo[]> {
    const yields: YieldInfo[] = [];

    // TODO: Integrate each protocol's SDK
    // const naviYields = await this.getNaviYields(assets);
    // const suilendYields = await this.getSuilendYields(assets);

    // Placeholder data for now
    yields.push(
      { protocol: 'navi', asset: 'SUI', apy: 0.05, TVL: 50000000 },
      { protocol: 'suilend', asset: 'SUI', apy: 0.04, TVL: 30000000 },
      { protocol: 'navi', asset: 'USDC', apy: 0.03, TVL: 100000000 },
      { protocol: 'suilend', asset: 'USDC', apy: 0.025, TVL: 80000000 },
    );

    return yields.sort((a, b) => b.apy - a.apy);
  }

  /**
   * Find best yield for a specific asset
   */
  async findBestYield(asset: string): Promise<YieldInfo | null> {
    const yields = await this.getYields([asset]);
    return yields.length > 0 ? yields[0] : null;
  }

  // --------------------------------------------------------------------------
  // SWAPS - Get best swap routes across DEXs
  // --------------------------------------------------------------------------

  /**
   * Get swap routes from all DEXs
   */
  async getSwapRoutes(
    fromToken: string,
    toToken: string,
    amount: number
  ): Promise<SwapRoute[]> {
    const routes: SwapRoute[] = [];

    // TODO: Integrate each DEX SDK
    // const cetusRoute = await this.getCetusRoute(fromToken, toToken, amount);
    // const turbosRoute = await this.getTurbosRoute(fromToken, toToken, amount);

    // Placeholder
    routes.push(
      {
        protocol: 'cetus',
        fromToken,
        toToken,
        amountIn: amount,
        amountOut: amount * 0.95, // Simplified
        priceImpact: 0.01,
        gasEstimate: 0.01,
      },
      {
        protocol: 'turbos',
        fromToken,
        toToken,
        amountIn: amount,
        amountOut: amount * 0.94,
        priceImpact: 0.02,
        gasEstimate: 0.015,
      }
    );

    return routes.sort((a, b) => b.amountOut - a.amountOut);
  }

  /**
   * Find best swap route
   */
  async findBestSwap(
    fromToken: string,
    toToken: string,
    amount: number
  ): Promise<SwapRoute | null> {
    const routes = await this.getSwapRoutes(fromToken, toToken, amount);
    return routes.length > 0 ? routes[0] : null;
  }

  // --------------------------------------------------------------------------
  // LENDING - Supply/Borrow
  // --------------------------------------------------------------------------

  /**
   * Get lending positions for wallet
   */
  async getLendingPositions(): Promise<LendingPosition[]> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not set');
    }

    // TODO: Query actual positions from each protocol
    return [];
  }

  /**
   * Supply asset to lending protocol
   */
  async supply(
    protocol: Protocol,
    asset: string,
    amount: number
  ): Promise<Transaction> {
    const tx = new Transaction();

    switch (protocol) {
      case PROTOCOLS.NAVI:
        // TODO: Navi supply logic
        break;
      case PROTOCOLS.SUILEND:
        // TODO: Suilend supply logic
        break;
      default:
        throw new Error(`Unsupported lending protocol: ${protocol}`);
    }

    return tx;
  }

  /**
   * Borrow asset from lending protocol
   */
  async borrow(
    protocol: Protocol,
    asset: string,
    amount: number
  ): Promise<Transaction> {
    const tx = new Transaction();

    switch (protocol) {
      case PROTOCOLS.NAVI:
        // TODO: Navi borrow logic
        break;
      case PROTOCOLS.SUILEND:
        // TODO: Suilend borrow logic
        break;
      default:
        throw new Error(`Unsupported lending protocol: ${protocol}`);
    }

    return tx;
  }

  // --------------------------------------------------------------------------
  // MARKETS - Get market data
  // --------------------------------------------------------------------------

  /**
   * Get prices from all sources
   */
  async getMarketPrices(assets: string[]): Promise<Market[]> {
    // TODO: Query actual prices
    return [];
  }
}

// ============================================================================
// Factory
// ============================================================================

function createAidefiAgent(network: 'mainnet' | 'testnet' = 'testnet'): AidefiAgent {
  return new AidefiAgent(network);
}

default AidefiAgent;
