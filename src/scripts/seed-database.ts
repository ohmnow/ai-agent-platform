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

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    await seedTransactions();
    await seedNotes();
    await seedCalendarEvents();

    console.log('\n✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
