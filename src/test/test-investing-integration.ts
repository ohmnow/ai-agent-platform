/**
 * Integration test for the complete investing agent workflow
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { investingAgentConfig } from '../agents/investing-agent.js';
import { investingServer } from '../mcp-servers/investing-server.js';

async function testInvestingAgentIntegration() {
  console.log('🧪 Testing Investing Agent Integration\n');

  // Test the investing agent with MCP server
  async function* generateInput(prompt: string) {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: prompt
      }
    };
  }

  try {
    console.log('📊 Test 1: Portfolio Summary');
    const portfolioQuery = query({
      prompt: generateInput('Show me my portfolio holdings with current values'),
      options: {
        systemPrompt: investingAgentConfig.prompt,
        mcpServers: {
          'investing': investingServer
        },
        allowedTools: investingAgentConfig.tools,
        model: 'claude-3-5-haiku-20241022',
      }
    });

    const portfolioMessages = [];
    for await (const message of portfolioQuery) {
      portfolioMessages.push(message);
      if (message.type === 'text' && message.role === 'assistant') {
        console.log('Portfolio Response:', message.content.substring(0, 300) + '...\n');
        break;
      }
    }

    console.log('📈 Test 2: Stock Price Check');
    const priceQuery = query({
      prompt: generateInput('Get the current price and analysis for Apple (AAPL)'),
      options: {
        systemPrompt: investingAgentConfig.prompt,
        mcpServers: {
          'investing': investingServer
        },
        allowedTools: investingAgentConfig.tools,
        model: 'claude-3-5-haiku-20241022',
      }
    });

    const priceMessages = [];
    for await (const message of priceQuery) {
      priceMessages.push(message);
      if (message.type === 'text' && message.role === 'assistant') {
        console.log('Price Response:', message.content.substring(0, 300) + '...\n');
        break;
      }
    }

    console.log('🏦 Test 3: Market Overview');
    const marketQuery = query({
      prompt: generateInput('How are the markets performing today?'),
      options: {
        systemPrompt: investingAgentConfig.prompt,
        mcpServers: {
          'investing': investingServer
        },
        allowedTools: investingAgentConfig.tools,
        model: 'claude-3-5-haiku-20241022',
      }
    });

    const marketMessages = [];
    for await (const message of marketQuery) {
      marketMessages.push(message);
      if (message.type === 'text' && message.role === 'assistant') {
        console.log('Market Response:', message.content.substring(0, 300) + '...\n');
        break;
      }
    }

    console.log('✅ Integration tests completed successfully!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run the test
testInvestingAgentIntegration();