/**
 * Enhanced Database Seeding Script
 * Seeds multi-user data for all agent types
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive data...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.task.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.note.deleteMany();
  await prisma.emailMetadata.deleteMany();
  await prisma.shoppingItem.deleteMany();
  await prisma.scheduledTask.deleteMany();
  await prisma.agentWorkspace.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  console.log('👤 Creating demo user...');
  const user = await prisma.user.create({
    data: {
      email: 'demo@agentcomm.ai',
      name: 'Demo User',
      goals: JSON.stringify([
        'Save $10,000 for emergency fund',
        'Increase investment portfolio by 15%',
        'Improve email productivity',
        'Learn about AI and ML'
      ]),
      interests: JSON.stringify([
        'technology',
        'investing',
        'personal finance',
        'productivity'
      ]),
      riskTolerance: 'moderate',
      enabledAgents: JSON.stringify([
        'finance',
        'investing',
        'email',
        'research',
        'shopping',
        'tasks'
      ])
    }
  });

  console.log(`✅ User created: ${user.email}`);

  // Create agent workspaces
  console.log('\n🤖 Creating agent workspaces...');
  const agents = [
    { id: 'finance', name: 'Personal Finance Agent' },
    { id: 'investing', name: 'Investing Agent' },
    { id: 'email', name: 'Email Agent' },
    { id: 'research', name: 'Research Agent' },
    { id: 'shopping', name: 'Shopping Agent' },
    { id: 'tasks', name: 'Task & Calendar Agent' }
  ];

  for (const agent of agents) {
    await prisma.agentWorkspace.create({
      data: {
        userId: user.id,
        agentId: agent.id,
        agentName: agent.name,
        config: JSON.stringify({ enabled: true }),
        memory: JSON.stringify({})
      }
    });
  }
  console.log(`✅ Created ${agents.length} agent workspaces`);

  // Seed financial transactions
  console.log('\n💰 Seeding financial transactions...');
  const categories = [
    { name: 'Food', budget: 500 },
    { name: 'Transportation', budget: 300 },
    { name: 'Utilities', budget: 200 },
    { name: 'Entertainment', budget: 150 },
    { name: 'Healthcare', budget: 100 },
    { name: 'Shopping', budget: 200 }
  ];

  const transactions = [
    { date: new Date('2025-10-01'), amount: -45.23, desc: 'Whole Foods', category: 'Food' },
    { date: new Date('2025-10-01'), amount: -12.50, desc: 'Uber', category: 'Transportation' },
    { date: new Date('2025-10-02'), amount: -67.89, desc: 'Safeway', category: 'Food' },
    { date: new Date('2025-10-02'), amount: -8.99, desc: 'Netflix', category: 'Entertainment' },
    { date: new Date('2025-10-03'), amount: -120.00, desc: 'Electric Bill', category: 'Utilities' },
    { date: new Date('2025-10-03'), amount: -35.67, desc: 'Trader Joes', category: 'Food' },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        date: tx.date,
        amount: tx.amount,
        description: tx.desc,
        category: tx.category,
        merchant: tx.desc.split(' ')[0]
      }
    });
  }
  console.log(`✅ Created ${transactions.length} transactions`);

  // Create budgets
  console.log('\n📊 Creating budgets...');
  for (const cat of categories) {
    await prisma.budget.create({
      data: {
        userId: user.id,
        category: cat.name,
        amount: cat.budget,
        period: 'monthly',
        startDate: new Date('2025-10-01'),
        spent: 0,
        remaining: cat.budget
      }
    });
  }
  console.log(`✅ Created ${categories.length} budgets`);

  // Seed investment portfolio
  console.log('\n📈 Creating investment portfolio...');
  const portfolio = await prisma.portfolio.create({
    data: {
      userId: user.id,
      name: 'Main Brokerage',
      accountType: 'brokerage'
    }
  });

  const holdings = [
    { symbol: 'AAPL', shares: 10, costBasis: 150.00, date: new Date('2024-06-15') },
    { symbol: 'MSFT', shares: 15, costBasis: 350.00, date: new Date('2024-05-20') },
    { symbol: 'NVDA', shares: 5, costBasis: 450.00, date: new Date('2024-08-10') },
    { symbol: 'VOO', shares: 20, costBasis: 400.00, date: new Date('2024-01-05') }
  ];

  for (const holding of holdings) {
    await prisma.holding.create({
      data: {
        portfolioId: portfolio.id,
        symbol: holding.symbol,
        shares: holding.shares,
        costBasis: holding.costBasis,
        purchaseDate: holding.date
      }
    });
  }
  console.log(`✅ Created portfolio with ${holdings.length} holdings`);

  // Seed notes
  console.log('\n📝 Creating notes...');
  const notes = [
    { title: 'Investment Strategy', content: 'Focus on index funds and blue chip stocks. Rebalance quarterly.', tags: 'investing,strategy' },
    { title: 'Meeting Notes - Q4 Planning', content: 'Discussed goals for Q4. Focus on product launch and marketing.', tags: 'work,planning' },
    { title: 'Book Recommendations', content: 'The Intelligent Investor, A Random Walk Down Wall Street', tags: 'books,investing' }
  ];

  for (const note of notes) {
    await prisma.note.create({
      data: {
        userId: user.id,
        title: note.title,
        content: note.content,
        tags: note.tags
      }
    });
  }
  console.log(`✅ Created ${notes.length} notes`);

  // Seed calendar events
  console.log('\n📅 Creating calendar events...');
  const events = [
    { title: 'Team Standup', start: new Date('2025-10-03T09:00:00'), end: new Date('2025-10-03T09:30:00') },
    { title: 'Portfolio Review', start: new Date('2025-10-05T14:00:00'), end: new Date('2025-10-05T15:00:00') },
    { title: 'Dentist Appointment', start: new Date('2025-10-10T10:00:00'), end: new Date('2025-10-10T11:00:00') }
  ];

  for (const event of events) {
    await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: event.title,
        start: event.start,
        end: event.end,
        source: 'manual'
      }
    });
  }
  console.log(`✅ Created ${events.length} calendar events`);

  // Seed tasks
  console.log('\n✅ Creating tasks...');
  const tasks = [
    { title: 'Review investment portfolio', priority: 'high', dueDate: new Date('2025-10-05'), status: 'pending' },
    { title: 'Pay credit card bill', priority: 'high', dueDate: new Date('2025-10-15'), status: 'pending' },
    { title: 'Research new CRM tools', priority: 'medium', dueDate: new Date('2025-10-20'), status: 'pending' },
    { title: 'Update resume', priority: 'low', dueDate: null, status: 'pending' }
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        userId: user.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        status: task.status
      }
    });
  }
  console.log(`✅ Created ${tasks.length} tasks`);

  // Seed shopping wishlist
  console.log('\n🛒 Creating shopping wishlist...');
  const wishlist = [
    { name: 'Sony WH-1000XM5 Headphones', url: 'https://www.amazon.com/dp/B09XS7JWHH', currentPrice: 399.99, targetPrice: 329.99 },
    { name: 'Standing Desk', url: 'https://www.amazon.com/dp/B08BJBL3QG', currentPrice: 299.99, targetPrice: 249.99 }
  ];

  for (const item of wishlist) {
    await prisma.shoppingItem.create({
      data: {
        userId: user.id,
        name: item.name,
        url: item.url,
        currentPrice: item.currentPrice,
        targetPrice: item.targetPrice
      }
    });
  }
  console.log(`✅ Created ${wishlist.length} shopping items`);

  // Seed scheduled tasks
  console.log('\n⏰ Creating scheduled tasks...');
  const scheduled = [
    { agentId: 'investing', taskType: 'market_summary', schedule: '0 8 * * *' },
    { agentId: 'finance', taskType: 'balance_summary', schedule: '0 8 * * *' },
    { agentId: 'email', taskType: 'inbox_summary', schedule: '0 9 * * *' }
  ];

  for (const task of scheduled) {
    await prisma.scheduledTask.create({
      data: {
        userId: user.id,
        agentId: task.agentId,
        taskType: task.taskType,
        schedule: task.schedule,
        enabled: true
      }
    });
  }
  console.log(`✅ Created ${scheduled.length} scheduled tasks`);

  console.log('\n✨ Database seeding complete!\n');
  console.log('Demo User:', user.email);
  console.log('Password: (authentication not yet implemented)\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
