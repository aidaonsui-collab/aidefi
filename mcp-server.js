// Aidefi MCP Server
// Provides tools for AI agents

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const { AidefiAggregator } = require('./src/aggregator.cjs');
const { PositionTracker } = require('./src/positions.cjs');
const { AutoRebalancer } = require('./src/rebalancer.cjs');

const aidefi = new AidefiAggregator('mainnet');
const tracker = new PositionTracker('mainnet');
const rebalancer = new AutoRebalancer('mainnet');

const server = new Server({
  name: 'aidefi',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Define tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'get_prices',
        description: 'Get current token prices',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_yields',
        description: 'Get yields for all assets',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_best_yield',
        description: 'Get best yield for an asset',
        inputSchema: { 
          type: 'object', 
          properties: { asset: { type: 'string', description: 'Asset symbol (e.g., SUI, USDC)' } },
          required: ['asset']
        },
      },
      {
        name: 'get_portfolio',
        description: 'Get wallet portfolio',
        inputSchema: { 
          type: 'object', 
          properties: { address: { type: 'string', description: 'Sui wallet address' } },
          required: ['address']
        },
      },
      {
        name: 'get_rebalance',
        description: 'Get rebalancing recommendations',
        inputSchema: { 
          type: 'object', 
          properties: { address: { type: 'string', description: 'Sui wallet address' } },
          required: ['address']
        },
      },
      {
        name: 'get_market',
        description: 'Get market overview with TVL',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'get_prices':
        return { content: [{ type: 'text', text: JSON.stringify(await aidefi.getTokenPrices()) }] };
      
      case 'get_yields':
        return { content: [{ type: 'text', text: JSON.stringify(await aidefi.getAllYields()) }] };
      
      case 'get_best_yield':
        return { content: [{ type: 'text', text: JSON.stringify(await aidefi.getBestYield(args.asset)) }] };
      
      case 'get_portfolio':
        return { content: [{ type: 'text', text: JSON.stringify(await tracker.getAllPositions(args.address)) }] };
      
      case 'get_rebalance':
        return { content: [{ type: 'text', text: JSON.stringify(await rebalancer.getRecommendation(args.address)) }] };
      
      case 'get_market':
        return { content: [{ type: 'text', text: JSON.stringify(await aidefi.getMarketOverview()) }] };
      
      default:
        return { content: [{ type: 'text', text: 'Unknown tool' }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: 'text', text: error.message }], isError: true };
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
