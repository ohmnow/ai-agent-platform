/**
 * Database Testing Script
 * Verifies the database schema and queries work correctly
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 Testing database functionality...\n');

  try {
    // Test user query with relations
    console.log('👤 Testing user query with relations...');
    const user = await prisma.user.findFirst({
      include: {
        transactions: { take: 2 },
        portfolios: { include: { holdings: { take: 2 } } },
        agentWorkspaces: { take: 3 },
        conversations: { take: 1, include: { messages: { take: 2 } } },
        notes: { take: 2 },
        tasks: { take: 2 }
      }
    });

    if (user) {
      console.log(`✅ Found user: ${user.email}`);
      console.log(`   - ${user.transactions.length} transactions`);
      console.log(`   - ${user.portfolios.length} portfolios`);
      console.log(`   - ${user.agentWorkspaces.length} agent workspaces`);
      console.log(`   - ${user.notes.length} notes`);
      console.log(`   - ${user.tasks.length} tasks`);

      if (user.portfolios[0]?.holdings) {
        console.log(`   - ${user.portfolios[0].holdings.length} holdings in first portfolio`);
      }
    }

    // Test financial queries
    console.log('\n💰 Testing financial queries...');
    const totalSpent = await prisma.transaction.aggregate({
      where: {
        userId: user?.id,
        amount: { lt: 0 } // Negative amounts are expenses
      },
      _sum: { amount: true }
    });
    console.log(`✅ Total expenses: $${Math.abs(totalSpent._sum.amount || 0).toFixed(2)}`);

    const budgets = await prisma.budget.findMany({
      where: { userId: user?.id },
      select: { category: true, amount: true, spent: true }
    });
    console.log(`✅ Found ${budgets.length} budgets`);

    // Test agent workspaces
    console.log('\n🤖 Testing agent workspaces...');
    const workspaces = await prisma.agentWorkspace.findMany({
      where: { userId: user?.id },
      select: { agentId: true, agentName: true }
    });
    console.log(`✅ Agent workspaces: ${workspaces.map(w => w.agentId).join(', ')}`);

    // Test portfolio performance
    console.log('\n📈 Testing portfolio queries...');
    const holdings = await prisma.holding.findMany({
      where: { portfolio: { userId: user?.id } },
      select: { symbol: true, shares: true, costBasis: true }
    });
    console.log(`✅ Holdings: ${holdings.map(h => `${h.symbol} (${h.shares} shares)`).join(', ')}`);

    // Test scheduled tasks
    console.log('\n⏰ Testing scheduled tasks...');
    const scheduledTasks = await prisma.scheduledTask.findMany({
      where: { userId: user?.id },
      select: { agentId: true, taskType: true, schedule: true }
    });
    console.log(`✅ Scheduled tasks: ${scheduledTasks.length} tasks configured`);

    console.log('\n✅ All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabase().catch(console.error);