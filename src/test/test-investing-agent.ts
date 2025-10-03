/**
 * Test Investing Agent
 *
 * Verifies that the investing agent works correctly with real market data and portfolio operations
 */

import { MasterOrchestrator } from '../agents/master-orchestrator.js';

async function testInvestingAgent() {
  console.log('🧪 Testing Investing Agent\n');

  const orchestrator = new MasterOrchestrator('test-session');

  try {
    // Test 1: Get portfolio summary
    console.log('📊 Test 1: Portfolio Summary');
    const portfolioResult = await orchestrator.processQuery('Show me my investment portfolio');
    console.log('Result:', portfolioResult.messages[portfolioResult.messages.length - 1]?.content || 'No response');
    console.log('\n---\n');

    // Test 2: Get stock price
    console.log('📈 Test 2: Stock Price Lookup');
    const priceResult = await orchestrator.processQuery('What is the current price of Apple stock (AAPL)?');
    console.log('Result:', priceResult.messages[priceResult.messages.length - 1]?.content || 'No response');
    console.log('\n---\n');

    // Test 3: Market overview
    console.log('🏦 Test 3: Market Overview');
    const marketResult = await orchestrator.processQuery('How are the markets doing today?');
    console.log('Result:', marketResult.messages[marketResult.messages.length - 1]?.content || 'No response');
    console.log('\n---\n');

    // Test 4: Portfolio analysis
    console.log('📈 Test 4: Portfolio Analysis');
    const analysisResult = await orchestrator.processQuery('Analyze my portfolio performance and show me gains/losses');
    console.log('Result:', analysisResult.messages[analysisResult.messages.length - 1]?.content || 'No response');
    console.log('\n---\n');

    // Test 5: Stock analysis
    console.log('🔍 Test 5: Stock Analysis');
    const stockAnalysisResult = await orchestrator.processQuery('Can you analyze Tesla stock (TSLA) for me?');
    console.log('Result:', stockAnalysisResult.messages[stockAnalysisResult.messages.length - 1]?.content || 'No response');
    console.log('\n---\n');

    // Test 6: Tax loss harvesting
    console.log('💰 Test 6: Tax Loss Harvesting');
    const taxResult = await orchestrator.processQuery('Do I have any tax loss harvesting opportunities?');
    console.log('Result:', taxResult.messages[taxResult.messages.length - 1]?.content || 'No response');

    console.log('\n✅ All investing agent tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testInvestingAgent();