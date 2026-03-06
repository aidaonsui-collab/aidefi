#!/usr/bin/env node

const { AidefiAggregator } = require('../src/aggregator.cjs');
const { PositionTracker } = require('../src/positions.cjs');
const { AutoRebalancer } = require('../src/rebalancer.cjs');

const args = process.argv.slice(2);
const command = args[0];

const aidefi = new AidefiAggregator('mainnet');
const tracker = new PositionTracker('mainnet');
const rebalancer = new AutoRebalancer('mainnet');

async function main() {
  switch (command) {
    case 'prices':
      const prices = await aidefi.getTokenPrices();
      console.log('📊 Prices:');
      Object.entries(prices).forEach(([asset, price]) => {
        console.log(`  ${asset}: $${price}`);
      });
      break;

    case 'yields':
      const yields = await aidefi.getAllYields();
      console.log('📈 Top Yields:');
      yields.slice(0, 10).forEach(y => {
        console.log(`  ${y.asset} @ ${y.protocol}: ${(y.apy * 100).toFixed(2)}%`);
      });
      break;

    case 'best':
      const best = await aidefi.getBestYield(args[1] || 'SUI');
      console.log(`🏆 Best ${best?.asset}: ${best?.protocol} at ${(best?.apy * 100).toFixed(2)}% APY`);
      break;

    case 'portfolio':
      const portfolio = await tracker.getAllPositions(args[1]);
      console.log('💰 Portfolio:');
      (portfolio?.coins || []).forEach(c => {
        const sym = c.type.split('::').pop();
        console.log(`  ${sym}: ${(BigInt(c.balance) / 1000000000n).toString()}`);
      });
      break;

    case 'rebalance':
      const recs = await rebalancer.getRecommendation(args[1]);
      console.log('⚖️ Rebalance:');
      if (!recs?.length) {
        console.log('  No rebalancing needed!');
      } else {
        recs.forEach(r => {
          console.log(`  ${r.asset}: ${r.from} → ${r.to} (+${(r.apyDiff * 100).toFixed(1)}%)`);
        });
      }
      break;

    default:
      console.log('Commands: prices, yields, best <asset>, portfolio <address>, rebalance <address>');
  }
}

main().catch(console.error);
