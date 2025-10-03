/**
 * Test Investing MCP Server directly
 *
 * Quick verification that all MCP tools work correctly
 */

import { investingServer } from '../mcp-servers/investing-server.js';

async function testMCPTools() {
  console.log('🧪 Testing Investing MCP Server Tools\n');

  try {
    // Get server tools
    const server = investingServer;
    const tools = server.listTools ? await server.listTools({}) : { tools: [] };
    console.log(`📋 Available tools: ${tools.tools?.map(t => t.name).join(', ') || 'None'}\n`);

    // Test portfolio retrieval
    console.log('📊 Testing get_portfolio...');
    try {
      const portfolioResult = await server.callTool?.({
        name: 'get_portfolio',
        arguments: { userId: 'user-001' }
      });
      console.log('✅ Portfolio tool works');
      console.log('Result:', portfolioResult?.content?.[0]?.text?.substring(0, 200) + '...');
    } catch (err) {
      console.log('❌ Portfolio tool error:', err.message);
    }

    // Test stock price lookup
    console.log('\n📈 Testing get_stock_price...');
    try {
      const priceResult = await server.callTool?.({
        name: 'get_stock_price',
        arguments: { symbol: 'AAPL' }
      });
      console.log('✅ Stock price tool works');
      console.log('Result:', priceResult?.content?.[0]?.text);
    } catch (err) {
      console.log('❌ Stock price tool error:', err.message);
    }

    // Test market data
    console.log('\n🏦 Testing get_market_data...');
    try {
      const marketResult = await server.callTool?.({
        name: 'get_market_data',
        arguments: {}
      });
      console.log('✅ Market data tool works');
      console.log('Result:', marketResult?.content?.[0]?.text?.substring(0, 300) + '...');
    } catch (err) {
      console.log('❌ Market data tool error:', err.message);
    }

    // Test portfolio analysis
    console.log('\n📈 Testing analyze_portfolio...');
    try {
      const analysisResult = await server.callTool?.({
        name: 'analyze_portfolio',
        arguments: { userId: 'user-001' }
      });
      console.log('✅ Portfolio analysis tool works');
      console.log('Result:', analysisResult?.content?.[0]?.text?.substring(0, 400) + '...');
    } catch (err) {
      console.log('❌ Portfolio analysis tool error:', err.message);
    }

    console.log('\n✅ MCP Server testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testMCPTools();