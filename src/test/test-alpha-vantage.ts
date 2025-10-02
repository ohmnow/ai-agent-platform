/**
 * Test Alpha Vantage MCP Server
 *
 * Simple test to verify the Alpha Vantage server tools work correctly.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { alphaVantageServer } from '../mcp-servers/alpha-vantage-server.js';

async function testAlphaVantage() {
  console.log('=== Testing Alpha Vantage MCP Server ===\n');

  try {
    // Test 1: Get stock price
    console.log('Test 1: Getting stock price for AAPL...\n');
    const result1 = query({
      prompt: 'Get the current stock price for Apple (AAPL)',
      options: {
        mcpServers: [alphaVantageServer],
        allowedTools: ['get_stock_price'],
      }
    });

    for await (const message of result1) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      } else if (message.type === 'tool_use') {
        console.log(`[Tool: ${message.name}]`);
      }
    }

    console.log('\n---\n');

    // Test 2: Get company overview
    console.log('Test 2: Getting company overview for Microsoft...\n');
    const result2 = query({
      prompt: 'Get the company overview for Microsoft (MSFT)',
      options: {
        mcpServers: [alphaVantageServer],
        allowedTools: ['get_company_overview'],
      }
    });

    for await (const message of result2) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      } else if (message.type === 'tool_use') {
        console.log(`[Tool: ${message.name}]`);
      }
    }

    console.log('\n---\n');

    // Test 3: Get market indices
    console.log('Test 3: Getting market indices...\n');
    const result3 = query({
      prompt: 'Show me the current market indices',
      options: {
        mcpServers: [alphaVantageServer],
        allowedTools: ['get_market_data'],
      }
    });

    for await (const message of result3) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      } else if (message.type === 'tool_use') {
        console.log(`[Tool: ${message.name}]`);
      }
    }

    console.log('\n✓ Alpha Vantage tests completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAlphaVantage();
}

export { testAlphaVantage };
