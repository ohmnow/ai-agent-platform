/**
 * User Data MCP Server
 *
 * Provides tools for analyzing user data using database queries.
 * Follows Anthropic's guidance: "Code is precise, composable, and reusable"
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { PrismaClient, TaskStatus, TaskPriority } from '../generated/prisma/index.js';

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

// Tool: Manage tasks
const manageTasks = tool(
  'manage_tasks',
  'Create, update, complete, and list tasks with productivity tracking',
  {
    action: z.enum(['create', 'update', 'complete', 'list', 'delete']).describe('Action to perform'),
    id: z.string().optional().describe('Task ID (required for update, complete, delete)'),
    title: z.string().optional().describe('Task title'),
    description: z.string().optional().describe('Task description'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().describe('Task priority'),
    dueDate: z.string().optional().describe('Due date (ISO string)'),
    tags: z.string().optional().describe('Comma-separated tags'),
    estimatedMinutes: z.number().optional().describe('Estimated time in minutes'),
    actualMinutes: z.number().optional().describe('Actual time spent in minutes'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional().describe('Task status'),
    filterStatus: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional().describe('Filter tasks by status'),
    filterPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().describe('Filter tasks by priority'),
  },
  async (args) => {
    const userId = 'user-001';

    if (args.action === 'create') {
      if (!args.title) {
        return { content: [{ type: 'text', text: 'Title is required for creating a task.' }] };
      }

      const task = await prisma.task.create({
        data: {
          title: args.title,
          description: args.description || null,
          priority: args.priority as TaskPriority || TaskPriority.MEDIUM,
          dueDate: args.dueDate ? new Date(args.dueDate) : null,
          tags: args.tags || null,
          estimatedMinutes: args.estimatedMinutes || null,
          userId,
        },
      });

      return {
        content: [{
          type: 'text',
          text: `✅ Task created: "${task.title}" (ID: ${task.id})\nPriority: ${task.priority}\nDue: ${task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'No due date'}`,
        }],
      };
    }

    if (args.action === 'update') {
      if (!args.id) {
        return { content: [{ type: 'text', text: 'Task ID is required for updating.' }] };
      }

      const updateData: any = {};
      if (args.title) updateData.title = args.title;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.priority) updateData.priority = args.priority as TaskPriority;
      if (args.dueDate !== undefined) updateData.dueDate = args.dueDate ? new Date(args.dueDate) : null;
      if (args.tags !== undefined) updateData.tags = args.tags;
      if (args.estimatedMinutes !== undefined) updateData.estimatedMinutes = args.estimatedMinutes;
      if (args.actualMinutes !== undefined) updateData.actualMinutes = args.actualMinutes;
      if (args.status) updateData.status = args.status as TaskStatus;

      try {
        const task = await prisma.task.update({
          where: { id: args.id, userId },
          data: updateData,
        });

        return {
          content: [{
            type: 'text',
            text: `📝 Task updated: "${task.title}"\nStatus: ${task.status}\nPriority: ${task.priority}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: 'Task not found or access denied.' }] };
      }
    }

    if (args.action === 'complete') {
      if (!args.id) {
        return { content: [{ type: 'text', text: 'Task ID is required for completing.' }] };
      }

      try {
        const task = await prisma.task.update({
          where: { id: args.id, userId },
          data: {
            status: TaskStatus.DONE,
            completedAt: new Date(),
            actualMinutes: args.actualMinutes || undefined,
          },
        });

        return {
          content: [{
            type: 'text',
            text: `🎉 Task completed: "${task.title}"\nTime spent: ${task.actualMinutes ? `${task.actualMinutes} minutes` : 'Not tracked'}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: 'Task not found or access denied.' }] };
      }
    }

    if (args.action === 'delete') {
      if (!args.id) {
        return { content: [{ type: 'text', text: 'Task ID is required for deleting.' }] };
      }

      try {
        const task = await prisma.task.delete({
          where: { id: args.id, userId },
        });

        return {
          content: [{
            type: 'text',
            text: `🗑️ Task deleted: "${task.title}"`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: 'Task not found or access denied.' }] };
      }
    }

    if (args.action === 'list') {
      const where: any = { userId };
      if (args.filterStatus) where.status = args.filterStatus as TaskStatus;
      if (args.filterPriority) where.priority = args.filterPriority as TaskPriority;

      const tasks = await prisma.task.findMany({
        where,
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        take: 50,
      });

      if (tasks.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No tasks found matching your criteria.',
          }],
        };
      }

      const formatted = tasks.map(task => {
        const statusIcon = task.status === 'DONE' ? '✅' :
                          task.status === 'IN_PROGRESS' ? '🔄' :
                          task.status === 'CANCELLED' ? '❌' : '📝';

        const priorityIcon = task.priority === 'URGENT' ? '🔴' :
                           task.priority === 'HIGH' ? '🟠' :
                           task.priority === 'MEDIUM' ? '🟡' : '🟢';

        const dueText = task.dueDate ?
          `Due: ${task.dueDate.toISOString().split('T')[0]}` : '';

        return `${statusIcon} ${priorityIcon} **${task.title}** (${task.id})\n${task.description || ''}\n${dueText}\nTags: ${task.tags || 'None'}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${tasks.length} task(s):\n\n${formatted}`,
        }],
      };
    }

    return { content: [{ type: 'text', text: 'Unknown action specified.' }] };
  }
);

// Tool: Manage time blocks for calendar scheduling
const manageTimeBlocks = tool(
  'manage_time_blocks',
  'Create and manage time blocks for productivity and meeting scheduling',
  {
    action: z.enum(['create', 'update', 'list', 'delete']).describe('Action to perform'),
    id: z.string().optional().describe('Time block ID (required for update, delete)'),
    title: z.string().optional().describe('Time block title'),
    start: z.string().optional().describe('Start time (ISO string)'),
    end: z.string().optional().describe('End time (ISO string)'),
    taskId: z.string().optional().describe('Associated task ID'),
    category: z.string().optional().describe('Category (e.g., "Deep Work", "Meetings", "Admin")'),
    description: z.string().optional().describe('Block description'),
    date: z.string().optional().describe('Filter by date (YYYY-MM-DD)'),
  },
  async (args) => {
    const userId = 'user-001';

    if (args.action === 'create') {
      if (!args.title || !args.start || !args.end) {
        return { content: [{ type: 'text', text: 'Title, start time, and end time are required.' }] };
      }

      const timeBlock = await prisma.timeBlock.create({
        data: {
          title: args.title,
          start: new Date(args.start),
          end: new Date(args.end),
          taskId: args.taskId || null,
          category: args.category || 'General',
          description: args.description || null,
          userId,
        },
      });

      return {
        content: [{
          type: 'text',
          text: `📅 Time block created: "${timeBlock.title}"\nWhen: ${timeBlock.start.toISOString()} to ${timeBlock.end.toISOString()}\nCategory: ${timeBlock.category}`,
        }],
      };
    }

    if (args.action === 'list') {
      const where: any = { userId };

      if (args.date) {
        const searchDate = new Date(args.date);
        const nextDay = new Date(searchDate);
        nextDay.setDate(searchDate.getDate() + 1);

        where.start = {
          gte: searchDate,
          lt: nextDay,
        };
      }

      const blocks = await prisma.timeBlock.findMany({
        where,
        orderBy: { start: 'asc' },
        take: 20,
      });

      if (blocks.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No time blocks found.',
          }],
        };
      }

      const formatted = blocks.map(block => {
        const duration = Math.round((block.end.getTime() - block.start.getTime()) / (1000 * 60));
        return `⏰ **${block.title}** (${block.category})\n📅 ${block.start.toISOString()} to ${block.end.toISOString()}\n⏱️ Duration: ${duration} minutes\n${block.description || ''}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${blocks.length} time block(s):\n\n${formatted}`,
        }],
      };
    }

    if (args.action === 'delete') {
      if (!args.id) {
        return { content: [{ type: 'text', text: 'Time block ID is required for deleting.' }] };
      }

      try {
        const block = await prisma.timeBlock.delete({
          where: { id: args.id, userId },
        });

        return {
          content: [{
            type: 'text',
            text: `🗑️ Time block deleted: "${block.title}"`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: 'Time block not found or access denied.' }] };
      }
    }

    return { content: [{ type: 'text', text: 'Unknown action or missing parameters.' }] };
  }
);

// Tool: Track productivity and generate insights
const trackProductivity = tool(
  'track_productivity',
  'Log productivity data and generate insights for better time management',
  {
    action: z.enum(['log', 'insights', 'summary']).describe('Action to perform'),
    date: z.string().optional().describe('Date for logging or analysis (YYYY-MM-DD)'),
    tasksCompleted: z.number().optional().describe('Number of tasks completed'),
    timeSpent: z.number().optional().describe('Total time spent in minutes'),
    focusRating: z.number().min(1).max(5).optional().describe('Focus quality rating (1-5)'),
    notes: z.string().optional().describe('Reflection notes'),
    period: z.enum(['week', 'month']).optional().describe('Period for insights'),
  },
  async (args) => {
    const userId = 'user-001';

    if (args.action === 'log') {
      const logDate = args.date ? new Date(args.date) : new Date();
      logDate.setHours(0, 0, 0, 0);

      // Check if log already exists for this date
      const existingLog = await prisma.productivityLog.findFirst({
        where: {
          userId,
          date: logDate,
        },
      });

      const logData = {
        date: logDate,
        tasksCompleted: args.tasksCompleted || 0,
        timeSpent: args.timeSpent || 0,
        focusRating: args.focusRating || null,
        notes: args.notes || null,
        userId,
      };

      let productivityLog;
      if (existingLog) {
        productivityLog = await prisma.productivityLog.update({
          where: { id: existingLog.id },
          data: logData,
        });
      } else {
        productivityLog = await prisma.productivityLog.create({
          data: logData,
        });
      }

      return {
        content: [{
          type: 'text',
          text: `📊 Productivity logged for ${logDate.toISOString().split('T')[0]}:\n✅ Tasks completed: ${productivityLog.tasksCompleted}\n⏰ Time spent: ${productivityLog.timeSpent} minutes\n🎯 Focus rating: ${productivityLog.focusRating || 'Not rated'}/5`,
        }],
      };
    }

    if (args.action === 'summary') {
      const period = args.period || 'week';
      const now = new Date();
      const startDate = new Date();

      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setDate(now.getDate() - 30);
      }

      const logs = await prisma.productivityLog.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: now,
          },
        },
        orderBy: { date: 'desc' },
      });

      if (logs.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No productivity logs found for the past ${period}.`,
          }],
        };
      }

      const totalTasks = logs.reduce((sum, log) => sum + log.tasksCompleted, 0);
      const totalTime = logs.reduce((sum, log) => sum + log.timeSpent, 0);
      const avgFocus = logs.filter(log => log.focusRating).reduce((sum, log) => sum + (log.focusRating || 0), 0) / logs.filter(log => log.focusRating).length;

      return {
        content: [{
          type: 'text',
          text: `📈 Productivity Summary (Past ${period}):\n📝 Total tasks completed: ${totalTasks}\n⏰ Total time logged: ${Math.round(totalTime / 60)} hours\n🎯 Average focus rating: ${avgFocus ? avgFocus.toFixed(1) : 'Not rated'}/5\n📅 Days logged: ${logs.length}`,
        }],
      };
    }

    if (args.action === 'insights') {
      // Get recent tasks and time data for insights
      const recentTasks = await prisma.task.findMany({
        where: {
          userId,
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { completedAt: 'desc' },
      });

      const completionRate = recentTasks.length > 0 ?
        (recentTasks.filter(t => t.status === 'DONE').length / recentTasks.length * 100) : 0;

      const avgTimeEstimateAccuracy = recentTasks
        .filter(t => t.estimatedMinutes && t.actualMinutes)
        .map(t => Math.abs((t.estimatedMinutes! - t.actualMinutes!) / t.estimatedMinutes!) * 100);

      const estimateAccuracy = avgTimeEstimateAccuracy.length > 0 ?
        avgTimeEstimateAccuracy.reduce((a, b) => a + b, 0) / avgTimeEstimateAccuracy.length : 0;

      return {
        content: [{
          type: 'text',
          text: `💡 Productivity Insights:\n✅ Task completion rate: ${completionRate.toFixed(1)}%\n⏱️ Time estimation accuracy: ${estimateAccuracy > 0 ? `${(100 - estimateAccuracy).toFixed(1)}%` : 'Insufficient data'}\n📈 Total completed tasks (30d): ${recentTasks.filter(t => t.status === 'DONE').length}\n\n💭 Recommendations:\n${completionRate < 70 ? '• Consider breaking down large tasks into smaller ones\n' : ''}${estimateAccuracy > 30 ? '• Work on improving time estimates by tracking actual time\n' : ''}• Log daily productivity for better insights`,
        }],
      };
    }

    return { content: [{ type: 'text', text: 'Unknown action specified.' }] };
  }
);

export const userDataServer = createSdkMcpServer({
  name: 'user-data',
  version: '2.0.0',
  tools: [analyzeTransactions, searchNotes, getCalendarEvents, manageTasks, manageTimeBlocks, trackProductivity],
});
