/**
 * Alpha Vantage MCP Server
 *
 * Integrates with Alpha Vantage API for stock market data.
 * Rate limit: 5 API calls per minute (free tier).
 *
 * Features:
 * - Real-time stock quotes with caching (5-minute TTL)
 * - Company fundamentals (PE ratio, EPS, market cap)
 * - Major market indices (S&P500, NASDAQ, Dow Jones)
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as alphaVantage from 'alphavantage';

// Initialize Alpha Vantage client with API key from environment
const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
const alphaClient = (alphaVantage as any)({ key: apiKey });

// Simple in-memory cache with TTL support
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get cached data or return null if expired/not found
 */
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Store data in cache with current timestamp
 */
function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

const getStockPrice = tool('get_stock_price', 'Get current stock price', {
  symbol: z.string().describe('Stock symbol (e.g., AAPL, MSFT)'),
}, async (args) => {
  try {
    const symbol = args.symbol.toUpperCase();
    const cacheKey = `stock_price_${symbol}`;

    // Check cache first to respect rate limits
    const cached = getCached(cacheKey);
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: `Stock Quote for ${symbol} (cached):\n${cached}`,
        }],
      };
    }

    // Fetch from Alpha Vantage
    const response = await alphaClient.data.quote(symbol);
    const quote = response['Global Quote'];

    if (!quote || !quote['05. price']) {
      return {
        content: [{
          type: 'text',
          text: `Error: Could not find stock data for symbol ${symbol}. Please verify the symbol is correct.`,
        }],
      };
    }

    // Format the data
    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = quote['10. change percent'].replace('%', '');
    const volume = parseInt(quote['06. volume']);
    const previousClose = parseFloat(quote['08. previous close']);
    const tradingDay = quote['07. latest trading day'];

    const formattedData = `**${symbol}** - ${tradingDay}
💰 Price: $${price.toFixed(2)}
📈 Change: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent}%)
📊 Volume: ${volume.toLocaleString()}
🔄 Previous Close: $${previousClose.toFixed(2)}`;

    // Cache the result
    setCache(cacheKey, formattedData);

    return {
      content: [{
        type: 'text',
        text: `Stock Quote for ${symbol}:\n${formattedData}`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching stock price: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
    };
  }
});

const getCompanyOverview = tool('get_company_overview', 'Get company fundamentals', {
  symbol: z.string().describe('Stock symbol (e.g., AAPL, MSFT)'),
}, async (args) => {
  try {
    const symbol = args.symbol.toUpperCase();
    const cacheKey = `company_overview_${symbol}`;

    // Check cache first to respect rate limits
    const cached = getCached(cacheKey);
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: `Company Overview for ${symbol} (cached):\n${cached}`,
        }],
      };
    }

    // Fetch company overview from Alpha Vantage
    const overview: any = await alphaClient.fundamental.company_overview(symbol);

    if (!overview || !overview.Symbol) {
      return {
        content: [{
          type: 'text',
          text: `Error: Could not find company data for symbol ${symbol}. Please verify the symbol is correct.`,
        }],
      };
    }

    // Format the data
    const formattedData = `**${overview.Name}** (${overview.Symbol})
🏢 Sector: ${overview.Sector || 'N/A'}
🏭 Industry: ${overview.Industry || 'N/A'}
📍 Country: ${overview.Country || 'N/A'}

**Fundamentals:**
💵 Market Cap: $${overview.MarketCapitalization ? (parseInt(overview.MarketCapitalization) / 1000000000).toFixed(2) + 'B' : 'N/A'}
📊 P/E Ratio: ${overview.PERatio || 'N/A'}
💰 EPS: $${overview.EPS || 'N/A'}
📈 PEG Ratio: ${overview.PEGRatio || 'N/A'}
💸 Dividend Yield: ${overview.DividendYield ? (parseFloat(overview.DividendYield) * 100).toFixed(2) + '%' : 'N/A'}
📉 Beta: ${overview.Beta || 'N/A'}
🎯 52 Week High: $${overview['52WeekHigh'] || 'N/A'}
🎯 52 Week Low: $${overview['52WeekLow'] || 'N/A'}

**Performance:**
📊 Profit Margin: ${overview.ProfitMargin ? (parseFloat(overview.ProfitMargin) * 100).toFixed(2) + '%' : 'N/A'}
📈 ROE: ${overview.ReturnOnEquityTTM ? (parseFloat(overview.ReturnOnEquityTTM) * 100).toFixed(2) + '%' : 'N/A'}
💹 Revenue (TTM): $${overview.RevenueTTM ? (parseInt(overview.RevenueTTM) / 1000000000).toFixed(2) + 'B' : 'N/A'}`;

    // Cache the result
    setCache(cacheKey, formattedData);

    return {
      content: [{
        type: 'text',
        text: `Company Overview for ${symbol}:\n${formattedData}`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching company overview: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
    };
  }
});

const getMarketData = tool('get_market_data', 'Get major market indices (S&P500, NASDAQ, Dow Jones)', {}, async () => {
  try {
    const cacheKey = 'market_indices';

    // Check cache first to respect rate limits
    const cached = getCached(cacheKey);
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: `Market Indices (cached):\n${cached}`,
        }],
      };
    }

    // Fetch data for major market indices using ETF proxies
    // SPY = S&P 500, QQQ = NASDAQ-100, DIA = Dow Jones Industrial Average
    const indices = [
      { symbol: 'SPY', name: 'S&P 500' },
      { symbol: 'QQQ', name: 'NASDAQ-100' },
      { symbol: 'DIA', name: 'Dow Jones Industrial Avg' },
    ];

    const results = await Promise.all(
      indices.map(async (index) => {
        try {
          const response = await alphaClient.data.quote(index.symbol);
          const quote = response['Global Quote'];

          if (!quote || !quote['05. price']) {
            return `${index.name}: Data unavailable`;
          }

          const price = parseFloat(quote['05. price']);
          const change = parseFloat(quote['09. change']);
          const changePercent = quote['10. change percent'].replace('%', '');

          return `📊 **${index.name}** (${index.symbol}): $${price.toFixed(2)} | ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent}%)`;
        } catch (err) {
          return `${index.name}: Error fetching data`;
        }
      })
    );

    const formattedData = results.join('\n');

    // Cache the result
    setCache(cacheKey, formattedData);

    return {
      content: [{
        type: 'text',
        text: `Market Indices:\n\n${formattedData}\n\n*Note: Using ETF proxies for index tracking*`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching market data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
    };
  }
});

export const alphaVantageServer = createSdkMcpServer({
  name: 'alpha-vantage',
  version: '1.0.0',
  tools: [getStockPrice, getCompanyOverview, getMarketData],
});
