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

// Tool: Set budget for a category
const setBudget = tool(
  'set_budget',
  'Set or update a budget for a specific category',
  {
    category: z.string().describe('Budget category (e.g., "Food", "Transportation")'),
    amount: z.number().positive().describe('Budget amount'),
    period: z.enum(['weekly', 'monthly', 'yearly']).default('monthly').describe('Budget period'),
    start_date: z.string().describe('Start date (YYYY-MM-DD)'),
    end_date: z.string().optional().describe('End date (YYYY-MM-DD), if not provided will be calculated based on period'),
  },
  async (args) => {
    const { category, amount, period, start_date, end_date } = args;

    try {
      // Calculate end date if not provided
      let calculatedEndDate = end_date;
      if (!end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(startDate);

        switch (period) {
          case 'weekly':
            endDate.setDate(startDate.getDate() + 7);
            break;
          case 'monthly':
            endDate.setMonth(startDate.getMonth() + 1);
            break;
          case 'yearly':
            endDate.setFullYear(startDate.getFullYear() + 1);
            break;
        }
        calculatedEndDate = endDate.toISOString().split('T')[0];
      }

      const budget = await prisma.budget.upsert({
        where: {
          budgets_user_category_period_idx: {
            userId: 'user-001',
            category,
            period,
          },
        },
        update: {
          amount,
          startDate: start_date,
          endDate: calculatedEndDate,
        },
        create: {
          userId: 'user-001',
          category,
          amount,
          period,
          startDate: start_date,
          endDate: calculatedEndDate,
        },
      });

      return {
        content: [{
          type: 'text',
          text: `Budget set successfully for ${category}: $${amount.toFixed(2)} per ${period} (from ${start_date} to ${calculatedEndDate})`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error setting budget: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }
);

// Tool: Get budgets
const getBudgets = tool(
  'get_budgets',
  'Get all budgets or filter by category and period',
  {
    category: z.string().optional().describe('Filter by category'),
    period: z.enum(['weekly', 'monthly', 'yearly']).optional().describe('Filter by period'),
  },
  async (args) => {
    const where: any = { userId: 'user-001' };

    if (args.category) {
      where.category = args.category;
    }
    if (args.period) {
      where.period = args.period;
    }

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: [{ category: 'asc' }, { period: 'asc' }],
    });

    if (budgets.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No budgets found matching your criteria.',
        }],
      };
    }

    const formatted = budgets
      .map(b => `**${b.category}** (${b.period})\n- Amount: $${b.amount.toFixed(2)}\n- Period: ${b.startDate} to ${b.endDate || 'ongoing'}\n- Created: ${b.createdAt.toISOString().split('T')[0]}`)
      .join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${budgets.length} budget(s):\n\n${formatted}`,
      }],
    };
  }
);

// Tool: Check budget status
const checkBudgetStatus = tool(
  'check_budget_status',
  'Check spending against budgets and identify over/under budget categories',
  {
    month: z.string().optional().describe('Month to analyze (YYYY-MM), defaults to current month'),
    category: z.string().optional().describe('Specific category to check'),
  },
  async (args) => {
    const currentDate = new Date();
    const monthStr = args.month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const startDate = new Date(`${monthStr}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    // Get budgets for the period
    const budgetWhere: any = {
      userId: 'user-001',
      period: 'monthly',
      startDate: { lte: endDate.toISOString().split('T')[0] },
    };

    if (args.category) {
      budgetWhere.category = args.category;
    }

    const budgets = await prisma.budget.findMany({
      where: budgetWhere,
    });

    if (budgets.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No budgets found for the specified period.',
        }],
      };
    }

    // Get spending for the same period
    const transactionWhere: any = {
      userId: 'user-001',
      date: {
        gte: startDate,
        lte: endDate,
      },
      amount: { lt: 0 }, // Only spending (negative amounts)
    };

    if (args.category) {
      transactionWhere.category = args.category;
    }

    const transactions = await prisma.transaction.findMany({
      where: transactionWhere,
    });

    // Calculate spending by category
    const spendingByCategory: Record<string, number> = {};
    transactions.forEach(t => {
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + Math.abs(t.amount);
    });

    // Compare budgets vs spending
    const results = budgets.map(budget => {
      const spent = spendingByCategory[budget.category] || 0;
      const remaining = budget.amount - spent;
      const percentUsed = (spent / budget.amount) * 100;

      let status = 'On Track';
      if (percentUsed >= 100) status = 'Over Budget';
      else if (percentUsed >= 90) status = 'Warning';
      else if (percentUsed >= 75) status = 'High Usage';

      return {
        category: budget.category,
        budget: budget.amount,
        spent,
        remaining,
        percentUsed,
        status,
      };
    });

    const formatted = results
      .map(r => `**${r.category}**\n- Budget: $${r.budget.toFixed(2)}\n- Spent: $${r.spent.toFixed(2)}\n- Remaining: $${r.remaining.toFixed(2)}\n- Used: ${r.percentUsed.toFixed(1)}%\n- Status: ${r.status}`)
      .join('\n\n');

    const overBudget = results.filter(r => r.status === 'Over Budget').length;
    const warnings = results.filter(r => r.status === 'Warning').length;

    let summary = `Budget Status for ${monthStr}:\n`;
    if (overBudget > 0) summary += `⚠️ ${overBudget} categories over budget\n`;
    if (warnings > 0) summary += `⚡ ${warnings} categories near budget limit\n`;
    summary += `📊 Analyzed ${results.length} budget categories\n\n`;

    return {
      content: [{
        type: 'text',
        text: `${summary}${formatted}`,
      }],
    };
  }
);

// Tool: Analyze spending patterns
const analyzeSpendingPatterns = tool(
  'analyze_spending_patterns',
  'Analyze spending patterns to identify trends, recurring expenses, and anomalies',
  {
    months: z.number().min(1).max(12).default(3).describe('Number of months to analyze'),
    category: z.string().optional().describe('Focus on specific category'),
  },
  async (args) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - args.months);

    const where: any = {
      userId: 'user-001',
      date: { gte: startDate, lte: endDate },
      amount: { lt: 0 }, // Only spending
    };

    if (args.category) {
      where.category = args.category;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    if (transactions.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No spending data found for the specified period.',
        }],
      };
    }

    // Group by month and category
    const monthlySpending: Record<string, Record<string, number>> = {};
    const recurringExpenses: Record<string, { count: number; avgAmount: number; amounts: number[] }> = {};

    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      const amount = Math.abs(t.amount);

      // Monthly spending by category
      if (!monthlySpending[monthKey]) monthlySpending[monthKey] = {};
      monthlySpending[monthKey][t.category] = (monthlySpending[monthKey][t.category] || 0) + amount;

      // Recurring expense detection (same description)
      const key = `${t.category}:${t.description.toLowerCase()}`;
      if (!recurringExpenses[key]) {
        recurringExpenses[key] = { count: 0, avgAmount: 0, amounts: [] };
      }
      recurringExpenses[key].count += 1;
      recurringExpenses[key].amounts.push(amount);
    });

    // Calculate averages for recurring expenses
    Object.values(recurringExpenses).forEach(expense => {
      expense.avgAmount = expense.amounts.reduce((sum, amt) => sum + amt, 0) / expense.amounts.length;
    });

    // Find truly recurring expenses (appeared in multiple months)
    const recurring = Object.entries(recurringExpenses)
      .filter(([_, data]) => data.count >= 2)
      .sort((a, b) => b[1].avgAmount - a[1].avgAmount)
      .slice(0, 10);

    // Calculate monthly trends
    const monthlyTotals = Object.entries(monthlySpending).map(([month, categories]) => {
      const total = Object.values(categories).reduce((sum, amt) => sum + amt, 0);
      return { month, total };
    });

    // Identify spending spikes (>50% above average)
    const avgMonthlySpending = monthlyTotals.reduce((sum, m) => sum + m.total, 0) / monthlyTotals.length;
    const spikes = monthlyTotals.filter(m => m.total > avgMonthlySpending * 1.5);

    // Build analysis report
    let report = `**Spending Pattern Analysis (${args.months} months)**\n\n`;

    // Monthly trend
    report += `📈 **Monthly Spending Trend**\n`;
    monthlyTotals.forEach(m => {
      const indicator = m.total > avgMonthlySpending * 1.2 ? '📈' : m.total < avgMonthlySpending * 0.8 ? '📉' : '➡️';
      report += `${indicator} ${m.month}: $${m.total.toFixed(2)}\n`;
    });
    report += `Average: $${avgMonthlySpending.toFixed(2)}/month\n\n`;

    // Spending spikes
    if (spikes.length > 0) {
      report += `⚡ **Spending Spikes Detected**\n`;
      spikes.forEach(spike => {
        const increase = ((spike.total - avgMonthlySpending) / avgMonthlySpending * 100).toFixed(1);
        report += `- ${spike.month}: $${spike.total.toFixed(2)} (+${increase}%)\n`;
      });
      report += '\n';
    }

    // Recurring expenses
    if (recurring.length > 0) {
      report += `🔄 **Top Recurring Expenses**\n`;
      recurring.forEach(([key, data]) => {
        const [category, description] = key.split(':');
        report += `- ${category}: ${description} (${data.count}x, avg: $${data.avgAmount.toFixed(2)})\n`;
      });
      report += '\n';
    }

    // Category breakdown for current month
    const currentMonth = monthlyTotals[monthlyTotals.length - 1];
    if (currentMonth) {
      const currentCategories = monthlySpending[currentMonth.month];
      const sortedCategories = Object.entries(currentCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      report += `📊 **Top Categories This Month (${currentMonth.month})**\n`;
      sortedCategories.forEach(([cat, amt]) => {
        const pct = ((amt / currentMonth.total) * 100).toFixed(1);
        report += `- ${cat}: $${amt.toFixed(2)} (${pct}%)\n`;
      });
    }

    return {
      content: [{
        type: 'text',
        text: report,
      }],
    };
  }
);

// Tool: Budget forecasting and recommendations
const getBudgetRecommendations = tool(
  'get_budget_recommendations',
  'Get budget recommendations based on spending patterns and goals',
  {
    months_history: z.number().min(1).max(12).default(6).describe('Months of history to analyze'),
    savings_goal: z.number().optional().describe('Monthly savings goal in dollars'),
  },
  async (args) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - args.months_history);

    // Get spending history
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: 'user-001',
        date: { gte: startDate, lte: endDate },
        amount: { lt: 0 },
      },
    });

    if (transactions.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'Insufficient spending data for recommendations.',
        }],
      };
    }

    // Calculate monthly averages by category
    const monthlySpending: Record<string, Record<string, number[]>> = {};

    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      const amount = Math.abs(t.amount);

      if (!monthlySpending[monthKey]) monthlySpending[monthKey] = {};
      if (!monthlySpending[monthKey][t.category]) monthlySpending[monthKey][t.category] = [];
      monthlySpending[monthKey][t.category].push(amount);
    });

    // Calculate category monthly totals first
    const categoryMonthlyTotals: Record<string, number[]> = {};

    Object.values(monthlySpending).forEach(monthData => {
      Object.entries(monthData).forEach(([category, amounts]) => {
        const total = amounts.reduce((sum, amt) => sum + amt, 0);
        if (!categoryMonthlyTotals[category]) categoryMonthlyTotals[category] = [];
        categoryMonthlyTotals[category].push(total);
      });
    });

    // Calculate category averages and variability
    const categoryAverages: Record<string, number> = {};
    const categoryVariability: Record<string, number> = {};

    Object.entries(categoryMonthlyTotals).forEach(([category, monthlyTotals]) => {
      const avg = monthlyTotals.reduce((sum, amt) => sum + amt, 0) / monthlyTotals.length;
      categoryAverages[category] = avg;

      // Calculate coefficient of variation (std dev / mean)
      const variance = monthlyTotals.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / monthlyTotals.length;
      const stdDev = Math.sqrt(variance);
      categoryVariability[category] = stdDev / avg;
    });

    // Get current budgets
    const existingBudgets = await prisma.budget.findMany({
      where: { userId: 'user-001', period: 'monthly' },
    });

    const budgetMap = new Map(existingBudgets.map(b => [b.category, b.amount]));

    // Generate recommendations
    let report = `**Budget Recommendations**\n\n`;

    const totalAverageSpending = Object.values(categoryAverages).reduce((sum, amt) => sum + amt, 0);
    report += `📊 **Current Average Monthly Spending: $${totalAverageSpending.toFixed(2)}**\n\n`;

    // Category-specific recommendations
    const sortedCategories = Object.entries(categoryAverages)
      .sort((a, b) => b[1] - a[1]);

    report += `💡 **Category Budget Recommendations**\n`;
    sortedCategories.forEach(([category, avgSpending]) => {
      const variability = categoryVariability[category];
      const currentBudget = budgetMap.get(category);

      // Recommend budget with 10-15% buffer for variable categories
      const bufferMultiplier = variability > 0.3 ? 1.15 : 1.10;
      const recommendedBudget = avgSpending * bufferMultiplier;

      let status = '';
      if (currentBudget) {
        if (currentBudget < avgSpending * 0.9) status = ' ⚠️ Current budget too low';
        else if (currentBudget > recommendedBudget * 1.2) status = ' 📈 Room to reduce budget';
        else status = ' ✅ Budget looks good';
      } else {
        status = ' 🆕 No budget set';
      }

      const variabilityText = variability > 0.3 ? ' (High variability)' : variability > 0.15 ? ' (Moderate variability)' : ' (Stable)';

      report += `- **${category}**: $${recommendedBudget.toFixed(2)}${variabilityText}${status}\n`;
      if (currentBudget) {
        report += `  Current: $${currentBudget.toFixed(2)}, Avg Spending: $${avgSpending.toFixed(2)}\n`;
      }
    });

    // Savings recommendations
    if (args.savings_goal) {
      report += `\n🎯 **Savings Goal Analysis**\n`;
      const targetSpending = totalAverageSpending - args.savings_goal;

      if (targetSpending <= 0) {
        report += `⚠️ Savings goal of $${args.savings_goal} exceeds current spending. Consider increasing income or reducing the goal.\n`;
      } else {
        const reductionNeeded = (args.savings_goal / totalAverageSpending) * 100;
        report += `Target spending: $${targetSpending.toFixed(2)} (${reductionNeeded.toFixed(1)}% reduction)\n\n`;

        // Find categories with highest potential for reduction
        const savingsOpportunities = sortedCategories
          .filter(([_, amount]) => amount > 50) // Focus on categories >$50
          .map(([category, amount]) => ({
            category,
            amount,
            potential: Math.min(amount * 0.2, args.savings_goal / 3), // Max 20% or 1/3 of savings goal
          }))
          .sort((a, b) => b.potential - a.potential)
          .slice(0, 5);

        report += `**Savings Opportunities:**\n`;
        let totalPotential = 0;
        savingsOpportunities.forEach(opp => {
          totalPotential += opp.potential;
          const reduction = (opp.potential / opp.amount * 100).toFixed(1);
          report += `- ${opp.category}: Save $${opp.potential.toFixed(2)} (${reduction}% reduction)\n`;
        });

        if (totalPotential >= args.savings_goal) {
          report += `\n✅ Potential savings: $${totalPotential.toFixed(2)} (meets goal!)\n`;
        } else {
          report += `\n📊 Potential savings: $${totalPotential.toFixed(2)} (${(args.savings_goal - totalPotential).toFixed(2)} short of goal)\n`;
        }
      }
    }

    return {
      content: [{
        type: 'text',
        text: report,
      }],
    };
  }
);

export const userDataServer = createSdkMcpServer({
  name: 'user-data',
  version: '2.0.0',
  tools: [
    analyzeTransactions,
    searchNotes,
    getCalendarEvents,
    manageTasks,
    manageTimeBlocks,
    trackProductivity,
    setBudget,
    getBudgets,
    checkBudgetStatus,
    analyzeSpendingPatterns,
    getBudgetRecommendations,
  ],
});
