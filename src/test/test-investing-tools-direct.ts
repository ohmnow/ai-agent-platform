/**
 * Direct test of investing tools (bypassing MCP server wrapper)
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function testPortfolioRetrieval() {
  console.log('📊 Testing portfolio retrieval directly...');

  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: 'user-001' },
      include: { holdings: true }
    });

    console.log(`Found ${portfolios.length} portfolios:`);
    for (const portfolio of portfolios) {
      console.log(`- ${portfolio.name} (${portfolio.accountType}): ${portfolio.holdings.length} holdings`);
      for (const holding of portfolio.holdings) {
        console.log(`  * ${holding.symbol}: ${holding.shares} shares @ $${holding.costBasis}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testStockPriceFetch() {
  console.log('\n📈 Testing stock price fetch...');

  try {
    const symbol = 'AAPL';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    console.log(`Fetching from: ${url}`);

    const response = await fetch(url);
    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      const result = data.chart?.result?.[0];

      if (result) {
        const meta = result.meta;
        console.log(`${symbol} Price: $${meta.regularMarketPrice || meta.previousClose}`);
        console.log(`Change: $${(meta.regularMarketPrice - meta.previousClose).toFixed(2)}`);
        console.log(`Volume: ${meta.regularMarketVolume?.toLocaleString() || 'N/A'}`);
      } else {
        console.log('No data in response');
      }
    } else {
      console.log('Failed to fetch stock data');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testMarketData() {
  console.log('\n🏦 Testing market data fetch...');

  try {
    const indices = ['^GSPC', '^IXIC', '^DJI'];

    for (const index of indices) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${index}`;
      console.log(`Fetching ${index}...`);

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (result) {
          const meta = result.meta;
          const currentPrice = meta.regularMarketPrice || meta.previousClose;
          const change = currentPrice - meta.previousClose;
          console.log(`${index}: ${currentPrice.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)})`);
        }
      } else {
        console.log(`Failed to fetch ${index}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {
  console.log('🧪 Direct Tool Testing\n');

  await testPortfolioRetrieval();
  await testStockPriceFetch();
  await testMarketData();

  await prisma.$disconnect();
  console.log('\n✅ Direct testing completed!');
}

main();