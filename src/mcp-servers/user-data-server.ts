/**
 * User Data MCP Server
 *
 * Provides tools for analyzing user data using database queries.
 * Follows Anthropic's guidance: "Code is precise, composable, and reusable"
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// Tool: Analyze transactions directly from database
const analyzeTransactions = tool(
  'analyze_transactions',
  'Analyze transaction data directly from the database (fast, <10ms)',
  {
    month: z.string().optional().describe('Month to filter (e.g., "2025-10")'),
    category: z.string().optional().describe('Category to filter (e.g., "Food")'),
    analysis_type: z.enum(['summary', 'by_category', 'total', 'list']).describe('Type of analysis to perform'),
  },
  async (args) => {
    const startDate = args.month ? new Date(`${args.month}-01`) : undefined;
    const endDate = args.month ? new Date(new Date(startDate!).setMonth(startDate!.getMonth() + 1)) : undefined;

    const where: any = { userId: 'user-001' };
    if (startDate && endDate) {
      where.date = { gte: startDate, lt: endDate };
    }
    if (args.category) {
      where.category = args.category;
    }

    if (args.analysis_type === 'summary') {
      const transactions = await prisma.transaction.findMany({ where });
      const totalSpent = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const avgTransaction = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;

      return {
        content: [{
          type: 'text',
          text: `Transaction Summary:\n- Total Spent: $${totalSpent.toFixed(2)}\n- Total Income: $${totalIncome.toFixed(2)}\n- Transaction Count: ${transactions.length}\n- Average: $${avgTransaction.toFixed(2)}`,
        }],
      };
    }

    if (args.analysis_type === 'by_category') {
      const transactions = await prisma.transaction.findMany({ where });
      const byCategory: Record<string, number> = {};
      transactions.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
      });

      const formatted = Object.entries(byCategory)
        .map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`)
        .join('\n');

      return {
        content: [{
          type: 'text',
          text: `Spending by Category:\n${formatted}`,
        }],
      };
    }

    if (args.analysis_type === 'total') {
      const transactions = await prisma.transaction.findMany({ where });
      const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        content: [{
          type: 'text',
          text: `Total: $${total.toFixed(2)} across ${transactions.length} transactions`,
        }],
      };
    }

    if (args.analysis_type === 'list') {
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 20,
      });

      const formatted = transactions
        .map(t => `${t.date.toISOString().split('T')[0]} | ${t.category} | ${t.description} | $${Math.abs(t.amount).toFixed(2)}`)
        .join('\n');

      return {
        content: [{
          type: 'text',
          text: `Recent Transactions:\n${formatted}`,
        }],
      };
    }

    return { content: [{ type: 'text', text: 'Unknown analysis type' }] };
  }
);

// Tool: Search notes from database
const searchNotes = tool(
  'search_notes',
  'Search notes by keyword or date from the database',
  {
    query: z.string().optional().describe('Search keyword'),
    date: z.string().optional().describe('Filter by date (YYYY-MM-DD)'),
  },
  async (args) => {
    const where: any = { userId: 'user-001' };

    if (args.query) {
      where.OR = [
        { title: { contains: args.query } },
        { content: { contains: args.query } },
        { tags: { contains: args.query } },
      ];
    }

    if (args.date) {
      const searchDate = new Date(args.date);
      where.date = {
        gte: searchDate,
        lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 10,
    });

    if (notes.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No notes found matching your search.',
        }],
      };
    }

    const formatted = notes
      .map(n => `**${n.title}** (${n.date.toISOString().split('T')[0]})\nTags: ${n.tags}\n\n${n.content.substring(0, 200)}${n.content.length > 200 ? '...' : ''}`)
      .join('\n\n---\n\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${notes.length} note(s):\n\n${formatted}`,
      }],
    };
  }
);

// Tool: Get calendar events from database
const getCalendarEvents = tool(
  'get_calendar_events',
  'Get upcoming calendar events from the database',
  {
    start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    end_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
  },
  async (args) => {
    const where: any = { userId: 'user-001' };

    if (args.start_date || args.end_date) {
      where.start = {};
      if (args.start_date) where.start.gte = new Date(args.start_date);
      if (args.end_date) where.start.lte = new Date(args.end_date);
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { start: 'asc' },
      take: 20,
    });

    if (events.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No calendar events found.',
        }],
      };
    }

    const formatted = events
      .map(e => {
        const attendees = JSON.parse(e.attendees);
        return `**${e.title}**\n- When: ${e.start.toISOString()} to ${e.end.toISOString()}\n- Location: ${e.location || 'N/A'}\n- Attendees: ${attendees.join(', ')}`;
      })
      .join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${events.length} event(s):\n\n${formatted}`,
      }],
    };
  }
);

export const userDataServer = createSdkMcpServer({
  name: 'user-data',
  version: '2.0.0',
  tools: [analyzeTransactions, searchNotes, getCalendarEvents],
});
