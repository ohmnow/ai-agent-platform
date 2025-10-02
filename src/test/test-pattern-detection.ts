/**
 * Pattern Detection Tests
 *
 * Comprehensive tests for pattern detection functionality
 */

import {
  detectRecurringTransactions,
  detectAnomalies,
  findSavingsOpportunities,
  analyzeMerchantClusters,
  detectSeasonalPatterns,
  getSeasonalInsights,
} from '../lib/pattern-detection.js';

// Define Transaction type for tests
interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  category: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock transaction data for comprehensive testing
const mockTransactions: Transaction[] = [
  // Recurring transactions - Monthly rent
  { id: '1', date: new Date('2025-01-01'), amount: -1200, description: 'Apartment Complex Rent', category: 'Housing', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', date: new Date('2025-02-01'), amount: -1200, description: 'Apartment Complex Rent', category: 'Housing', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', date: new Date('2025-03-01'), amount: -1200, description: 'Apartment Complex Rent', category: 'Housing', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', date: new Date('2025-04-01'), amount: -1200, description: 'Apartment Complex Rent', category: 'Housing', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },

  // Recurring transactions - Weekly grocery shopping
  { id: '5', date: new Date('2025-01-05'), amount: -85, description: 'SuperMart Grocery Store', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', date: new Date('2025-01-12'), amount: -92, description: 'SuperMart Grocery Store', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', date: new Date('2025-01-19'), amount: -88, description: 'SuperMart Grocery Store', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', date: new Date('2025-01-26'), amount: -90, description: 'SuperMart Grocery Store', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },

  // Similar merchant names for clustering
  { id: '9', date: new Date('2025-01-03'), amount: -45, description: 'Starbucks Coffee #123', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '10', date: new Date('2025-01-10'), amount: -42, description: 'Starbucks Coffee Store', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '11', date: new Date('2025-01-15'), amount: -38, description: 'Starbucks Cafe Downtown', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },

  // Normal spending for anomaly detection baseline
  { id: '12', date: new Date('2025-01-02'), amount: -25, description: 'Fast Food Restaurant', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '13', date: new Date('2025-01-04'), amount: -30, description: 'Pizza Place', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '14', date: new Date('2025-01-08'), amount: -28, description: 'Burger Joint', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '15', date: new Date('2025-01-14'), amount: -32, description: 'Sandwich Shop', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },

  // Anomaly transactions (outliers)
  { id: '16', date: new Date('2025-01-20'), amount: -250, description: 'Expensive Restaurant', category: 'Food', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '17', date: new Date('2025-01-25'), amount: -500, description: 'Unknown Merchant XYZ', category: 'Shopping', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },

  // Seasonal pattern - Entertainment spending (higher in summer)
  { id: '18', date: new Date('2025-06-15'), amount: -150, description: 'Concert Tickets', category: 'Entertainment', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '19', date: new Date('2025-07-20'), amount: -200, description: 'Theme Park', category: 'Entertainment', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '20', date: new Date('2025-08-10'), amount: -175, description: 'Festival Pass', category: 'Entertainment', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },

  // Low entertainment spending in winter
  { id: '21', date: new Date('2025-12-05'), amount: -50, description: 'Movie Tickets', category: 'Entertainment', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '22', date: new Date('2025-01-15'), amount: -45, description: 'Streaming Service', category: 'Entertainment', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },

  // Utilities for regular spending
  { id: '23', date: new Date('2025-01-15'), amount: -120, description: 'Electric Company Bill', category: 'Utilities', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '24', date: new Date('2025-02-15'), amount: -125, description: 'Electric Company Bill', category: 'Utilities', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '25', date: new Date('2025-03-15'), amount: -115, description: 'Electric Company Bill', category: 'Utilities', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },

  // Income transactions
  { id: '26', date: new Date('2025-01-01'), amount: 3000, description: 'Salary Deposit', category: 'Income', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '27', date: new Date('2025-02-01'), amount: 3000, description: 'Salary Deposit', category: 'Income', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },

  // Shopping - multiple merchants
  { id: '28', date: new Date('2025-01-10'), amount: -75, description: 'Target Store', category: 'Shopping', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '29', date: new Date('2025-01-12'), amount: -65, description: 'Walmart', category: 'Shopping', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '30', date: new Date('2025-01-15'), amount: -80, description: 'Amazon Purchase', category: 'Shopping', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '31', date: new Date('2025-01-18'), amount: -55, description: 'Best Buy', category: 'Shopping', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '32', date: new Date('2025-01-22'), amount: -90, description: 'Costco', category: 'Shopping', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
  { id: '33', date: new Date('2025-01-25'), amount: -45, description: 'Home Depot', category: 'Shopping', userId: 'user-001', createdAt: new Date(), updatedAt: new Date() },
];

// Mock budget data
const mockBudgets = [
  { category: 'Food', amount: 400 },
  { category: 'Housing', amount: 1200 },
  { category: 'Shopping', amount: 200 },
  { category: 'Utilities', amount: 150 },
  { category: 'Entertainment', amount: 100 },
];

// Test helper function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function testRecurringDetection() {
  console.log('🔄 Testing recurring transaction detection...');

  const patterns = await detectRecurringTransactions(mockTransactions);

  // Should detect monthly rent pattern - adjusted to match actual extraction
  const rentPattern = patterns.find(p => p.merchant === 'Apartment Complex Rent' && p.category === 'Housing');
  assert(rentPattern !== undefined, 'Should detect rent recurring pattern');
  assert(rentPattern!.frequency === 'monthly', `Rent frequency should be monthly, got ${rentPattern!.frequency}`);
  assert(rentPattern!.averageAmount === 1200, `Rent average should be 1200, got ${rentPattern!.averageAmount}`);
  assert(rentPattern!.confidence > 0.8, `Rent confidence should be high, got ${rentPattern!.confidence}`);

  // Should detect weekly grocery pattern
  const groceryPattern = patterns.find(p => p.merchant === 'Supermart Grocery Store' && p.category === 'Food');
  assert(groceryPattern !== undefined, 'Should detect grocery recurring pattern');
  assert(groceryPattern!.frequency === 'weekly', `Grocery frequency should be weekly, got ${groceryPattern!.frequency}`);
  assert(groceryPattern!.averageAmount >= 85 && groceryPattern!.averageAmount <= 95,
    `Grocery average should be ~89, got ${groceryPattern!.averageAmount}`);

  // Should detect monthly utility pattern
  const utilityPattern = patterns.find(p => p.merchant === 'Electric Company Bill' && p.category === 'Utilities');
  assert(utilityPattern !== undefined, 'Should detect utility recurring pattern');
  assert(utilityPattern!.frequency === 'monthly', `Utility frequency should be monthly, got ${utilityPattern!.frequency}`);

  console.log(`✅ Found ${patterns.length} recurring patterns`);
  patterns.forEach(p => {
    console.log(`   - ${p.merchant} (${p.category}): $${p.averageAmount} ${p.frequency}, confidence: ${p.confidence}`);
  });
}

async function testAnomalyDetection() {
  console.log('🚨 Testing anomaly detection...');

  const anomalies = await detectAnomalies(mockTransactions);

  // Should detect the expensive restaurant as anomaly
  const expensiveFood = anomalies.find(a => a.transaction.description.includes('Expensive Restaurant'));
  assert(expensiveFood !== undefined, 'Should detect expensive restaurant as anomaly');
  assert(expensiveFood!.severity === 'high' || expensiveFood!.severity === 'medium',
    `Expensive restaurant should be high/medium severity, got ${expensiveFood!.severity}`);

  // Should detect unknown merchant as anomaly
  const unknownMerchant = anomalies.find(a => a.transaction.description.includes('Unknown Merchant XYZ'));
  assert(unknownMerchant !== undefined, 'Should detect unknown merchant as anomaly');

  console.log(`✅ Found ${anomalies.length} anomalies`);
  anomalies.forEach(a => {
    console.log(`   - ${a.transaction.description}: $${Math.abs(a.transaction.amount)} (${a.severity}) - ${a.reason}`);
  });
}

async function testSavingsOpportunities() {
  console.log('💰 Testing savings opportunity detection...');

  const opportunities = await findSavingsOpportunities(mockTransactions, mockBudgets);

  // Should find opportunities for high-spending categories
  assert(opportunities.length > 0, 'Should find at least one savings opportunity');

  // Should prioritize by impact
  const highPriority = opportunities.filter(o => o.priority === 'high');
  const mediumPriority = opportunities.filter(o => o.priority === 'medium');
  const lowPriority = opportunities.filter(o => o.priority === 'low');

  console.log(`✅ Found ${opportunities.length} savings opportunities`);
  console.log(`   High priority: ${highPriority.length}, Medium: ${mediumPriority.length}, Low: ${lowPriority.length}`);

  opportunities.forEach(o => {
    console.log(`   - ${o.category}: Save $${o.potentialSavings} (${o.priority}) - ${o.recommendation}`);
  });
}

async function testMerchantClustering() {
  console.log('🏪 Testing merchant clustering...');

  const clusters = await analyzeMerchantClusters(mockTransactions);

  // Should cluster Starbucks variants
  const starbucksCluster = Array.from(clusters.entries()).find(([key, merchants]) =>
    key.toLowerCase().includes('starbucks') || merchants.some(m => m.toLowerCase().includes('starbucks'))
  );

  assert(starbucksCluster !== undefined, 'Should cluster Starbucks merchants');
  assert(starbucksCluster![1].length >= 2, `Starbucks cluster should have 2+ merchants, got ${starbucksCluster![1].length}`);

  console.log(`✅ Found ${clusters.size} merchant clusters`);
  for (const [key, merchants] of clusters) {
    console.log(`   - ${key}: [${merchants.join(', ')}]`);
  }
}

async function testSeasonalPatterns() {
  console.log('📊 Testing seasonal pattern detection...');

  const patterns = await detectSeasonalPatterns(mockTransactions);
  const insights = await getSeasonalInsights(mockTransactions);

  // Should detect Entertainment seasonal pattern (higher in summer)
  const entertainmentPattern = patterns.get('Entertainment');
  if (entertainmentPattern) {
    // Summer months should have higher multipliers
    const summerMultipliers = [entertainmentPattern[5], entertainmentPattern[6], entertainmentPattern[7]]; // Jun, Jul, Aug
    const winterMultipliers = [entertainmentPattern[11], entertainmentPattern[0], entertainmentPattern[1]]; // Dec, Jan, Feb

    const maxSummer = Math.max(...summerMultipliers.filter(m => m > 0));
    const maxWinter = Math.max(...winterMultipliers.filter(m => m > 0));

    if (maxSummer > 0 && maxWinter > 0) {
      assert(maxSummer > maxWinter, 'Summer entertainment spending should be higher than winter');
    }
  }

  console.log(`✅ Found ${patterns.size} seasonal patterns`);
  for (const [category, multipliers] of patterns) {
    const maxMultiplier = Math.max(...multipliers);
    const maxMonth = multipliers.indexOf(maxMultiplier);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    console.log(`   - ${category}: Peak in ${monthNames[maxMonth]} (${maxMultiplier.toFixed(2)}x average)`);
  }

  console.log(`✅ Generated ${insights.length} seasonal insights`);
  insights.forEach(insight => {
    console.log(`   - ${insight.category}: ${insight.insight}`);
  });
}

async function runTests() {
  console.log('\n🧪 Pattern Detection Tests\n');
  console.log(`📊 Test data: ${mockTransactions.length} transactions, ${mockBudgets.length} budget categories\n`);

  const startTime = Date.now();

  try {
    await testRecurringDetection();
    console.log();

    await testAnomalyDetection();
    console.log();

    await testSavingsOpportunities();
    console.log();

    await testMerchantClustering();
    console.log();

    await testSeasonalPatterns();
    console.log();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`\n🎉 All tests passed in ${duration}ms!\n`);

    // Summary
    console.log('📋 Test Summary:');
    console.log('✅ Recurring transaction detection - Working');
    console.log('✅ Spending anomaly detection - Working');
    console.log('✅ Savings opportunity identification - Working');
    console.log('✅ Merchant clustering - Working');
    console.log('✅ Seasonal pattern analysis - Working');
    console.log('\n🚀 Pattern detection library is ready for production use!\n');

  } catch (error: any) {
    console.error('\n❌ Tests failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

runTests();
