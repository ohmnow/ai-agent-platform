import { PrismaClient } from '../generated/prisma/index.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function seedTransactions() {
  console.log('📊 Seeding transactions...');

  const csvPath = join(__dirname, '../data/transactions/2025-10.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  // Parse CSV manually (simple approach)
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });

    await prisma.transaction.create({
      data: {
        date: new Date(row.date),
        amount: parseFloat(row.amount),
        description: row.description,
        category: row.category,
        userId: 'user-001',
      },
    });
  }

  console.log(`✅ Created ${lines.length - 1} transactions`);
}

async function seedNotes() {
  console.log('📝 Seeding notes...');

  const notePath = join(__dirname, '../data/notes/meeting-notes-2025-10-01.md');
  const noteContent = readFileSync(notePath, 'utf-8');

  await prisma.note.create({
    data: {
      title: 'Q1 Strategy Meeting',
      content: noteContent,
      date: new Date('2025-10-01'),
      tags: 'meeting,strategy,q1',
      userId: 'user-001',
    },
  });

  console.log('✅ Created 1 note');
}

async function seedCalendarEvents() {
  console.log('📅 Seeding calendar events...');

  const calendarPath = join(__dirname, '../data/calendar/events.json');
  const calendarContent = readFileSync(calendarPath, 'utf-8');
  const events = JSON.parse(calendarContent);

  for (const event of events) {
    await prisma.calendarEvent.create({
      data: {
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        location: event.location || null,
        attendees: JSON.stringify(event.attendees || []),
        userId: 'user-001',
      },
    });
  }

  console.log(`✅ Created ${events.length} calendar events`);
}

async function seedInvestingData() {
  console.log('💰 Seeding investing data...');

  // Create sample portfolios
  const mainPortfolio = await prisma.portfolio.create({
    data: {
      name: 'Main Portfolio',
      accountType: 'Taxable',
      broker: 'Fidelity',
      userId: 'user-001',
    },
  });

  const retirementPortfolio = await prisma.portfolio.create({
    data: {
      name: '401(k)',
      accountType: '401k',
      broker: 'Vanguard',
      userId: 'user-001',
    },
  });

  // Add sample holdings to main portfolio
  const mainHoldings = [
    { symbol: 'AAPL', shares: 25, costBasis: 150.00, purchaseDate: '2024-06-15' },
    { symbol: 'MSFT', shares: 15, costBasis: 310.00, purchaseDate: '2024-07-20' },
    { symbol: 'GOOGL', shares: 8, costBasis: 140.00, purchaseDate: '2024-08-10' },
    { symbol: 'TSLA', shares: 12, costBasis: 220.00, purchaseDate: '2024-09-05' },
    { symbol: 'NVDA', shares: 10, costBasis: 95.00, purchaseDate: '2024-05-10' },
  ];

  for (const holding of mainHoldings) {
    await prisma.holding.create({
      data: {
        symbol: holding.symbol,
        shares: holding.shares,
        costBasis: holding.costBasis,
        purchaseDate: new Date(holding.purchaseDate),
        portfolioId: mainPortfolio.id,
        userId: 'user-001',
      },
    });
  }

  // Add sample holdings to retirement portfolio
  const retirementHoldings = [
    { symbol: 'VTSAX', shares: 100, costBasis: 85.00, purchaseDate: '2024-01-15' },
    { symbol: 'VTIAX', shares: 50, costBasis: 18.50, purchaseDate: '2024-01-15' },
    { symbol: 'VBTLX', shares: 25, costBasis: 11.20, purchaseDate: '2024-02-01' },
  ];

  for (const holding of retirementHoldings) {
    await prisma.holding.create({
      data: {
        symbol: holding.symbol,
        shares: holding.shares,
        costBasis: holding.costBasis,
        purchaseDate: new Date(holding.purchaseDate),
        portfolioId: retirementPortfolio.id,
        userId: 'user-001',
      },
    });
  }

  // Add sample market indices (these will be updated with real data when the agent runs)
  const marketIndices = [
    { symbol: '^GSPC', name: 'S&P 500', value: 5800.0, change: 15.2, changePercent: 0.26 },
    { symbol: '^IXIC', name: 'NASDAQ Composite', value: 18200.0, change: -25.5, changePercent: -0.14 },
    { symbol: '^DJI', name: 'Dow Jones Industrial Average', value: 42000.0, change: 100.3, changePercent: 0.24 },
  ];

  for (const index of marketIndices) {
    await prisma.marketIndex.create({
      data: {
        symbol: index.symbol,
        name: index.name,
        value: index.value,
        change: index.change,
        changePercent: index.changePercent,
      },
    });
  }

  console.log(`✅ Created 2 portfolios with ${mainHoldings.length + retirementHoldings.length} holdings`);
  console.log(`✅ Created ${marketIndices.length} market indices`);
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    await seedTransactions();
    await seedNotes();
    await seedCalendarEvents();
    await seedInvestingData();

    console.log('\n✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
