/**
 * Investing MCP Server
 *
 * Provides investment tools for portfolio management and market analysis
 */

import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// ===== PORTFOLIO TOOLS =====

const getPortfolioTool = tool(
  'get_portfolio',
  'Get user portfolio holdings with current values',
  {
    userId: z.string().describe('User ID'),
    portfolioId: z.string().optional().describe('Specific portfolio ID (optional)'),
  },
  async (args) => {
    try {
      const whereClause: any = { userId: args.userId };
      if (args.portfolioId) {
        whereClause.id = args.portfolioId;
      }

      const portfolios = await prisma.portfolio.findMany({
        where: whereClause,
        include: { holdings: true }
      });

      if (portfolios.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No portfolios found. Create your first portfolio with add_holding tool.',
          }],
        };
      }

      let totalValue = 0;
      let formattedOutput = '';

      for (const portfolio of portfolios) {
        formattedOutput += `\n## ${portfolio.name} (${portfolio.accountType})\n`;
        if (portfolio.broker) formattedOutput += `Broker: ${portfolio.broker}\n`;

        let portfolioValue = 0;
        for (const holding of portfolio.holdings) {
          const currentValue = holding.shares * holding.costBasis; // Using cost basis as placeholder
          portfolioValue += currentValue;

          formattedOutput += `- **${holding.symbol}**: ${holding.shares} shares @ $${holding.costBasis.toFixed(2)} = $${currentValue.toFixed(2)}\n`;
          formattedOutput += `  Purchased: ${holding.purchaseDate.toISOString().split('T')[0]}\n`;
        }

        formattedOutput += `**Portfolio Total: $${portfolioValue.toFixed(2)}**\n`;
        totalValue += portfolioValue;
      }

      formattedOutput = `# Portfolio Summary\n**Total Value: $${totalValue.toFixed(2)}**\n${formattedOutput}`;

      return {
        content: [{
          type: 'text',
          text: formattedOutput,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error retrieving portfolio: ${error.message}`,
        }],
      };
    }
  }
);

const addHoldingTool = tool(
  'add_holding',
  'Add a new stock/fund holding to portfolio',
  {
    userId: z.string(),
    symbol: z.string().describe('Stock ticker symbol (e.g., AAPL, VTSAX)'),
    shares: z.number().describe('Number of shares'),
    costBasis: z.number().describe('Purchase price per share'),
    purchaseDate: z.string().describe('Purchase date (YYYY-MM-DD)'),
    portfolioName: z.string().default('Main Portfolio').describe('Portfolio name'),
    accountType: z.string().default('Taxable').describe('Account type (e.g., 401k, Roth IRA, Taxable)'),
    broker: z.string().optional().describe('Broker name (optional)'),
  },
  async (args) => {
    try {
      // Find or create portfolio
      let portfolio = await prisma.portfolio.findFirst({
        where: {
          userId: args.userId,
          name: args.portfolioName,
        }
      });

      if (!portfolio) {
        portfolio = await prisma.portfolio.create({
          data: {
            name: args.portfolioName,
            accountType: args.accountType,
            broker: args.broker,
            userId: args.userId,
          }
        });
      }

      // Add holding
      const holding = await prisma.holding.create({
        data: {
          symbol: args.symbol.toUpperCase(),
          shares: args.shares,
          costBasis: args.costBasis,
          purchaseDate: new Date(args.purchaseDate),
          portfolioId: portfolio.id,
          userId: args.userId,
        }
      });

      const totalValue = args.shares * args.costBasis;

      return {
        content: [{
          type: 'text',
          text: `✅ Successfully added ${args.shares} shares of ${args.symbol} to ${args.portfolioName}
- Purchase Price: $${args.costBasis.toFixed(2)} per share
- Total Value: $${totalValue.toFixed(2)}
- Purchase Date: ${args.purchaseDate}
- Portfolio: ${portfolio.name} (${portfolio.accountType})`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error adding holding: ${error.message}`,
        }],
      };
    }
  }
);

// ===== MARKET DATA TOOLS =====

const getStockPriceTool = tool(
  'get_stock_price',
  'Get current stock price and basic quote data',
  {
    symbol: z.string().describe('Stock ticker symbol (e.g., AAPL, TSLA)'),
    updateCache: z.boolean().default(true).describe('Update cached price data'),
  },
  async (args) => {
    try {
      const symbol = args.symbol.toUpperCase();

      // Check for cached data (if less than 15 minutes old, use cache)
      const cachedQuote = await prisma.stockQuote.findUnique({
        where: { symbol }
      });

      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      if (cachedQuote && cachedQuote.updatedAt > fifteenMinutesAgo && !args.updateCache) {
        return formatStockQuote(cachedQuote);
      }

      // Fetch fresh data from Yahoo Finance API (free, no API key required)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch stock data for ${symbol}`);
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];

      if (!result) {
        throw new Error(`No data found for symbol ${symbol}`);
      }

      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice || meta.previousClose;
      const previousClose = meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      // Update or create cached quote
      const quote = await prisma.stockQuote.upsert({
        where: { symbol },
        update: {
          price: currentPrice,
          change,
          changePercent,
          volume: meta.regularMarketVolume,
          marketCap: meta.marketCap,
          high52Week: meta.fiftyTwoWeekHigh,
          low52Week: meta.fiftyTwoWeekLow,
          updatedAt: new Date(),
        },
        create: {
          symbol,
          price: currentPrice,
          change,
          changePercent,
          volume: meta.regularMarketVolume,
          marketCap: meta.marketCap,
          high52Week: meta.fiftyTwoWeekHigh,
          low52Week: meta.fiftyTwoWeekLow,
        }
      });

      return formatStockQuote(quote);
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching stock price for ${args.symbol}: ${error.message}`,
        }],
      };
    }
  }
);

// Helper function to format stock quote
function formatStockQuote(quote: any) {
  const changeDirection = quote.change >= 0 ? '📈' : '📉';
  const changeColor = quote.change >= 0 ? '+' : '';

  return {
    content: [{
      type: 'text',
      text: `**${quote.symbol}** ${changeDirection}
Current Price: **$${quote.price.toFixed(2)}**
Change: ${changeColor}$${quote.change.toFixed(2)} (${changeColor}${quote.changePercent.toFixed(2)}%)
${quote.volume ? `Volume: ${quote.volume.toLocaleString()}` : ''}
${quote.marketCap ? `Market Cap: $${(quote.marketCap / 1e9).toFixed(1)}B` : ''}
${quote.high52Week ? `52W High: $${quote.high52Week.toFixed(2)}` : ''}
${quote.low52Week ? `52W Low: $${quote.low52Week.toFixed(2)}` : ''}
Updated: ${quote.updatedAt.toLocaleString()}`,
    }],
  };
}

const getMarketDataTool = tool(
  'get_market_data',
  'Get market indices and overall market condition',
  {
    indices: z.array(z.string()).default(['^GSPC', '^IXIC', '^DJI']).describe('Market indices to fetch'),
  },
  async (args) => {
    try {
      const results = [];

      for (const index of args.indices) {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${index}`;
          const response = await fetch(url);

          if (!response.ok) continue;

          const data = await response.json();
          const result = data.chart?.result?.[0];
          if (!result) continue;

          const meta = result.meta;
          const currentPrice = meta.regularMarketPrice || meta.previousClose;
          const previousClose = meta.previousClose;
          const change = currentPrice - previousClose;
          const changePercent = (change / previousClose) * 100;

          // Update cached data
          await prisma.marketIndex.upsert({
            where: { symbol: index },
            update: {
              value: currentPrice,
              change,
              changePercent,
              updatedAt: new Date(),
            },
            create: {
              symbol: index,
              name: getIndexName(index),
              value: currentPrice,
              change,
              changePercent,
            }
          });

          results.push({
            symbol: index,
            name: getIndexName(index),
            value: currentPrice,
            change,
            changePercent
          });
        } catch (err) {
          console.error(`Error fetching ${index}:`, err);
        }
      }

      if (results.length === 0) {
        throw new Error('Failed to fetch any market data');
      }

      let output = '# Market Overview\n\n';
      for (const index of results) {
        const direction = index.change >= 0 ? '📈' : '📉';
        const changeSign = index.change >= 0 ? '+' : '';

        output += `**${index.name}** ${direction}\n`;
        output += `${index.value.toFixed(2)} (${changeSign}${index.change.toFixed(2)}, ${changeSign}${index.changePercent.toFixed(2)}%)\n\n`;
      }

      // Simple market sentiment analysis
      const avgChange = results.reduce((sum, idx) => sum + idx.changePercent, 0) / results.length;
      let sentiment = '🟡 Neutral';
      if (avgChange > 1) sentiment = '🟢 Bullish';
      else if (avgChange < -1) sentiment = '🔴 Bearish';

      output += `**Market Sentiment:** ${sentiment} (avg: ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(2)}%)`;

      return {
        content: [{
          type: 'text',
          text: output,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching market data: ${error.message}`,
        }],
      };
    }
  }
);

// Helper function to get index names
function getIndexName(symbol: string): string {
  const names: Record<string, string> = {
    '^GSPC': 'S&P 500',
    '^IXIC': 'NASDAQ Composite',
    '^DJI': 'Dow Jones Industrial Average',
    '^VIX': 'VIX Volatility Index',
  };
  return names[symbol] || symbol;
}

const analyzeStockTool = tool(
  'analyze_stock',
  'Get detailed stock analysis including fundamentals and company information',
  {
    symbol: z.string().describe('Stock ticker symbol'),
  },
  async (args) => {
    try {
      const symbol = args.symbol.toUpperCase();

      // Get current price data first
      const priceResponse = await getStockPriceTool.handler({ symbol, updateCache: true });

      // Fetch additional company data from Yahoo Finance
      const summaryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryProfile,financialData,defaultKeyStatistics,summaryDetail`;

      const response = await fetch(summaryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis data for ${symbol}`);
      }

      const data = await response.json();
      const quoteSummary = data.quoteSummary?.result?.[0];

      if (!quoteSummary) {
        return {
          content: [{
            type: 'text',
            text: `Limited analysis data available for ${symbol}. Here's the price data:\n\n${priceResponse.content[0].text}`,
          }],
        };
      }

      let analysis = `# ${symbol} Stock Analysis\n\n`;

      // Price information
      analysis += `${priceResponse.content[0].text}\n\n`;

      // Company Profile
      const profile = quoteSummary.summaryProfile;
      if (profile) {
        analysis += `## Company Profile\n`;
        analysis += `**Sector:** ${profile.sector || 'N/A'}\n`;
        analysis += `**Industry:** ${profile.industry || 'N/A'}\n`;
        analysis += `**Employees:** ${profile.fullTimeEmployees?.toLocaleString() || 'N/A'}\n`;
        if (profile.longBusinessSummary) {
          analysis += `**Business:** ${profile.longBusinessSummary.substring(0, 300)}...\n`;
        }
        analysis += `\n`;
      }

      // Key Statistics
      const keyStats = quoteSummary.defaultKeyStatistics;
      const financialData = quoteSummary.financialData;
      if (keyStats || financialData) {
        analysis += `## Key Statistics\n`;

        if (keyStats?.trailingPE?.raw) {
          analysis += `**P/E Ratio:** ${keyStats.trailingPE.raw.toFixed(2)}\n`;
        }
        if (keyStats?.priceToBook?.raw) {
          analysis += `**Price-to-Book:** ${keyStats.priceToBook.raw.toFixed(2)}\n`;
        }
        if (financialData?.totalRevenue?.raw) {
          analysis += `**Revenue:** $${(financialData.totalRevenue.raw / 1e9).toFixed(2)}B\n`;
        }
        if (financialData?.revenueGrowth?.raw) {
          analysis += `**Revenue Growth:** ${(financialData.revenueGrowth.raw * 100).toFixed(1)}%\n`;
        }
        if (keyStats?.dividendYield?.raw) {
          analysis += `**Dividend Yield:** ${(keyStats.dividendYield.raw * 100).toFixed(2)}%\n`;
        }
        analysis += `\n`;
      }

      // Financial Health
      if (financialData) {
        analysis += `## Financial Health\n`;

        if (financialData.totalCash?.raw && financialData.totalDebt?.raw) {
          const netCash = financialData.totalCash.raw - financialData.totalDebt.raw;
          analysis += `**Net Cash Position:** $${(netCash / 1e9).toFixed(2)}B\n`;
        }

        if (financialData.returnOnEquity?.raw) {
          analysis += `**Return on Equity:** ${(financialData.returnOnEquity.raw * 100).toFixed(1)}%\n`;
        }

        if (financialData.profitMargins?.raw) {
          analysis += `**Profit Margin:** ${(financialData.profitMargins.raw * 100).toFixed(1)}%\n`;
        }
        analysis += `\n`;
      }

      // Summary Detail
      const summaryDetail = quoteSummary.summaryDetail;
      if (summaryDetail) {
        analysis += `## Valuation Metrics\n`;

        if (summaryDetail.marketCap?.raw) {
          analysis += `**Market Cap:** $${(summaryDetail.marketCap.raw / 1e9).toFixed(2)}B\n`;
        }

        if (summaryDetail.beta?.raw) {
          const betaDesc = summaryDetail.beta.raw > 1 ? '(more volatile than market)' : '(less volatile than market)';
          analysis += `**Beta:** ${summaryDetail.beta.raw.toFixed(2)} ${betaDesc}\n`;
        }
      }

      return {
        content: [{
          type: 'text',
          text: analysis,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error analyzing ${args.symbol}: ${error.message}`,
        }],
      };
    }
  }
);

// ===== DIVIDEND & TAX TOOLS =====

const analyzePortfolioTool = tool(
  'analyze_portfolio',
  'Analyze portfolio performance, allocation, and returns',
  {
    userId: z.string().describe('User ID'),
    portfolioId: z.string().optional().describe('Specific portfolio ID (optional)'),
  },
  async (args) => {
    try {
      const whereClause: any = { userId: args.userId };
      if (args.portfolioId) {
        whereClause.id = args.portfolioId;
      }

      const portfolios = await prisma.portfolio.findMany({
        where: whereClause,
        include: { holdings: true }
      });

      if (portfolios.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No portfolios found for analysis.',
          }],
        };
      }

      let analysis = '# Portfolio Analysis\n\n';
      let totalValue = 0;
      let totalCostBasis = 0;
      const sectorAllocation: Record<string, number> = {};

      // Analyze each portfolio
      for (const portfolio of portfolios) {
        analysis += `## ${portfolio.name} (${portfolio.accountType})\n`;

        let portfolioValue = 0;
        let portfolioCost = 0;

        for (const holding of portfolio.holdings) {
          const costBasis = holding.shares * holding.costBasis;
          let currentValue = costBasis; // Default to cost basis

          // Try to get current price
          try {
            const quote = await prisma.stockQuote.findUnique({
              where: { symbol: holding.symbol }
            });

            if (quote) {
              currentValue = holding.shares * quote.price;
            }
          } catch (err) {
            // Use cost basis as fallback
          }

          portfolioValue += currentValue;
          portfolioCost += costBasis;

          const gain = currentValue - costBasis;
          const gainPercent = (gain / costBasis) * 100;
          const gainEmoji = gain >= 0 ? '🟢' : '🔴';

          analysis += `- **${holding.symbol}**: ${holding.shares} shares\n`;
          analysis += `  Cost: $${costBasis.toFixed(2)} → Current: $${currentValue.toFixed(2)} ${gainEmoji}\n`;
          analysis += `  Gain/Loss: ${gain >= 0 ? '+' : ''}$${gain.toFixed(2)} (${gain >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%)\n`;
        }

        const portfolioGain = portfolioValue - portfolioCost;
        const portfolioGainPercent = (portfolioGain / portfolioCost) * 100;

        analysis += `\n**Portfolio Performance:**\n`;
        analysis += `- Cost Basis: $${portfolioCost.toFixed(2)}\n`;
        analysis += `- Current Value: $${portfolioValue.toFixed(2)}\n`;
        analysis += `- Total Gain/Loss: ${portfolioGain >= 0 ? '+' : ''}$${portfolioGain.toFixed(2)} (${portfolioGain >= 0 ? '+' : ''}${portfolioGainPercent.toFixed(1)}%)\n\n`;

        totalValue += portfolioValue;
        totalCostBasis += portfolioCost;
      }

      // Overall summary
      const totalGain = totalValue - totalCostBasis;
      const totalGainPercent = (totalGain / totalCostBasis) * 100;

      analysis += `## Overall Summary\n`;
      analysis += `- Total Portfolio Value: **$${totalValue.toFixed(2)}**\n`;
      analysis += `- Total Cost Basis: $${totalCostBasis.toFixed(2)}\n`;
      analysis += `- Total Gain/Loss: ${totalGain >= 0 ? '+' : ''}$${totalGain.toFixed(2)} (${totalGain >= 0 ? '+' : ''}${totalGainPercent.toFixed(1)}%)\n`;

      return {
        content: [{
          type: 'text',
          text: analysis,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error analyzing portfolio: ${error.message}`,
        }],
      };
    }
  }
);

const findTaxLossHarvestTool = tool(
  'find_tax_loss_harvest',
  'Identify tax loss harvesting opportunities in portfolio',
  {
    userId: z.string(),
    minLossPercent: z.number().default(5).describe('Minimum loss percentage to flag'),
  },
  async (args) => {
    try {
      const portfolios = await prisma.portfolio.findMany({
        where: { userId: args.userId },
        include: { holdings: true }
      });

      if (portfolios.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No portfolios found for tax loss analysis.',
          }],
        };
      }

      const opportunities = [];

      for (const portfolio of portfolios) {
        for (const holding of portfolio.holdings) {
          try {
            const quote = await prisma.stockQuote.findUnique({
              where: { symbol: holding.symbol }
            });

            if (quote) {
              const currentValue = holding.shares * quote.price;
              const costBasis = holding.shares * holding.costBasis;
              const loss = costBasis - currentValue;
              const lossPercent = (loss / costBasis) * 100;

              if (loss > 0 && lossPercent >= args.minLossPercent) {
                opportunities.push({
                  symbol: holding.symbol,
                  shares: holding.shares,
                  costBasis: holding.costBasis,
                  currentPrice: quote.price,
                  loss: loss,
                  lossPercent: lossPercent,
                  portfolioName: portfolio.name
                });
              }
            }
          } catch (err) {
            // Skip this holding if we can't get current price
          }
        }
      }

      if (opportunities.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No tax loss harvesting opportunities found with losses >= ${args.minLossPercent}%.`,
          }],
        };
      }

      // Sort by loss amount (highest first)
      opportunities.sort((a, b) => b.loss - a.loss);

      let output = '# Tax Loss Harvesting Opportunities\n\n';
      let totalPotentialLoss = 0;

      for (const opp of opportunities) {
        output += `**${opp.symbol}** (${opp.portfolioName})\n`;
        output += `- ${opp.shares} shares @ $${opp.costBasis.toFixed(2)} → $${opp.currentPrice.toFixed(2)}\n`;
        output += `- Unrealized Loss: **$${opp.loss.toFixed(2)}** (${opp.lossPercent.toFixed(1)}%)\n`;
        output += `- Potential Tax Benefit: ~$${(opp.loss * 0.22).toFixed(2)} (assuming 22% tax rate)\n\n`;

        totalPotentialLoss += opp.loss;
      }

      output += `**Total Potential Harvest:** $${totalPotentialLoss.toFixed(2)}\n`;
      output += `**Estimated Tax Savings:** ~$${(totalPotentialLoss * 0.22).toFixed(2)}\n\n`;
      output += `⚠️ **Important:** Consider wash sale rules (30-day rule) and consult a tax advisor.`;

      return {
        content: [{
          type: 'text',
          text: output,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error finding tax loss opportunities: ${error.message}`,
        }],
      };
    }
  }
);

// ===== CREATE MCP SERVER =====

export const investingServer = createSdkMcpServer({
  name: 'investing',
  description: 'Portfolio management and market analysis tools',
  tools: [
    getPortfolioTool,
    addHoldingTool,
    getStockPriceTool,
    getMarketDataTool,
    analyzeStockTool,
    analyzePortfolioTool,
    findTaxLossHarvestTool,
  ],
});

// Uses Yahoo Finance API (free, no API key required)
// For production use, consider:
// 1. Alpha Vantage: https://www.alphavantage.co/support/#api-key
// 2. IEX Cloud: https://iexcloud.io/
// 3. Polygon.io: https://polygon.io/
