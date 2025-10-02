# Alpha Vantage MCP Server

An MCP (Model Context Protocol) server that integrates with the Alpha Vantage API to provide real-time stock market data and company fundamentals.

## Features

### 🔧 Available Tools

1. **get_stock_price** - Get current stock price and trading data
   - Real-time stock quotes
   - Price changes and percentage changes
   - Trading volume
   - Previous close price

2. **get_company_overview** - Get detailed company fundamentals
   - Company information (sector, industry, country)
   - Financial metrics (PE ratio, EPS, market cap)
   - Performance indicators (profit margin, ROE, revenue)
   - 52-week high/low prices

3. **get_market_data** - Get major market indices
   - S&P 500 (via SPY ETF)
   - NASDAQ-100 (via QQQ ETF)
   - Dow Jones Industrial Average (via DIA ETF)

## Setup

### 1. Get an API Key

1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Request a free API key (no credit card required)
3. Free tier includes 5 API calls per minute

### 2. Configure Environment

Add your API key to `.env` file:

```bash
ALPHA_VANTAGE_API_KEY=your-api-key-here
```

If the API key is not set, the server will use the "demo" key which has limited functionality.

### 3. Install Dependencies

```bash
npm install
```

## Usage

### Using the MCP Server

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';
import { alphaVantageServer } from './mcp-servers/alpha-vantage-server.js';

const result = query({
  prompt: 'What is the current stock price of Apple?',
  options: {
    mcpServers: [alphaVantageServer],
    allowedTools: ['get_stock_price', 'get_company_overview', 'get_market_data'],
  }
});

for await (const message of result) {
  if (message.type === 'assistant' && message.text) {
    console.log(message.text);
  }
}
```

### Testing

Run the test suite:

```bash
npm run test:alpha-vantage
```

## Caching

To respect the API rate limits (5 calls/minute on free tier), all responses are cached for **5 minutes**. This means:

- Repeated requests for the same stock within 5 minutes will return cached data
- No additional API calls are made for cached data
- Cache automatically expires after 5 minutes

## Example Queries

### Stock Price

```
"What is the current price of Tesla stock?"
"Get me the stock quote for AAPL"
"Show me Microsoft's current stock price"
```

### Company Overview

```
"Tell me about Amazon's company fundamentals"
"What is the PE ratio and market cap for Google?"
"Get company overview for TSLA"
```

### Market Indices

```
"Show me the current market indices"
"What are the S&P 500, NASDAQ, and Dow Jones at right now?"
"How are the major indices performing today?"
```

## Rate Limits

**Free Tier:** 5 API calls per minute

The server implements intelligent caching to minimize API calls:
- Each unique request is cached for 5 minutes
- Cached responses are clearly marked with "(cached)"
- You can make unlimited requests to cached data

## Error Handling

The server handles various error scenarios:

- **Invalid stock symbol:** Returns a helpful error message
- **API rate limit exceeded:** Cached data is served when available
- **Network errors:** Gracefully handled with error messages
- **Missing data:** Returns "N/A" for unavailable fields

## Technical Details

### Dependencies

- `alphavantage` - Official Alpha Vantage API wrapper
- `@anthropic-ai/claude-agent-sdk` - Claude Agent SDK
- `zod` - Schema validation

### Architecture

- **In-memory caching** with TTL (Time To Live) support
- **Type-safe** TypeScript implementation
- **Error-resilient** with comprehensive error handling
- **Rate-limit friendly** with automatic caching

## Limitations

- Free tier limited to 5 API calls per minute
- Market indices use ETF proxies (SPY, QQQ, DIA) instead of direct index values
- Historical data requires separate API calls (not implemented)
- Real-time data may have slight delays (depends on Alpha Vantage)

## Future Enhancements

Potential additions:
- Historical price data
- Technical indicators (moving averages, RSI, etc.)
- Crypto currency support
- Forex exchange rates
- Earnings calendar
- News sentiment analysis

## Resources

- [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/)
- [Alpha Vantage Support](https://www.alphavantage.co/support/)
- [API Key Request](https://www.alphavantage.co/support/#api-key)
