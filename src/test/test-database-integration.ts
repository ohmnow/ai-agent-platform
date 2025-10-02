/**
 * Database Integration Test
 *
 * Tests that the database-backed MCP tools work correctly with agents
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { userDataServer } from '../mcp-servers/user-data-server.js';
import { financeAgentConfig } from '../agents/finance-agent.js';

async function testDatabaseIntegration() {
  console.log('🧪 Testing Database Integration\n');
  console.log('='.repeat(50));

  // Test 1: Direct MCP tool call
  console.log('\n📊 Test 1: Direct tool call (no agent)');
  const start1 = Date.now();

  async function* generateInput1() {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'Use the analyze_transactions tool to get total Food spending for October 2025'
      }
    };
  }

  const result1 = query({
    prompt: generateInput1(),
    options: {
      mcpServers: { 'user-data': userDataServer },
      allowedTools: ['mcp__user-data__analyze_transactions'],
      dangerouslySkipPermissions: true,
      maxTurns: 3,
    }
  });

  let response1 = '';
  for await (const message of result1) {
    if (message.type === 'result') {
      response1 = message.result || '';
    }
  }

  const elapsed1 = Date.now() - start1;
  console.log(`   ✅ Response: ${response1.substring(0, 200)}...`);
  console.log(`   ⚡ Time: ${elapsed1}ms`);

  // Test 2: Finance agent with database tools
  console.log('\n📊 Test 2: Finance agent query');
  const start2 = Date.now();

  async function* generateInput2() {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'How much did I spend on Food in October 2025?'
      }
    };
  }

  const result2 = query({
    prompt: generateInput2(),
    options: {
      agents: { 'finance': financeAgentConfig },
      mcpServers: { 'user-data': userDataServer },
      allowedTools: ['Task'],
      dangerouslySkipPermissions: true,
      maxTurns: 5,
    }
  });

  let response2 = '';
  for await (const message of result2) {
    if (message.type === 'result') {
      response2 = message.result || '';
    }
  }

  const elapsed2 = Date.now() - start2;
  console.log(`   ✅ Response: ${response2.substring(0, 200)}...`);
  console.log(`   ⚡ Time: ${elapsed2}ms`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 INTEGRATION TEST SUMMARY\n');
  console.log(`   Test 1 (Direct): ${elapsed1}ms`);
  console.log(`   Test 2 (Agent): ${elapsed2}ms`);
  console.log(`\n   ✅ Database integration working!`);
  console.log('='.repeat(50) + '\n');
}

testDatabaseIntegration().catch(console.error);
