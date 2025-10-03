# Database Schema Documentation

Complete schema for Agentcomm multi-agent platform.

## Overview

The database supports:
- Multi-user system
- Multiple specialized agents per user
- Agent workspaces with isolated memory
- Conversation history
- Financial data (transactions, budgets, portfolios)
- Calendar & task management
- Email metadata caching
- Shopping wishlists
- Scheduled proactive tasks

## Core Models

### User
Central user account with preferences and goals.

**Fields:**
- `id`, `email`, `name`
- `goals` - JSON array of user goals
- `interests` - JSON array of interests
- `riskTolerance` - conservative/moderate/aggressive
- `enabledAgents` - JSON array of enabled agent IDs

**Relations:**
- One-to-many: transactions, notes, portfolios, budgets, conversations, tasks, etc.

### AgentWorkspace
Isolated workspace for each agent per user.

**Fields:**
- `userId` + `agentId` (unique together)
- `agentName`
- `config` - JSON agent configuration
- `memory` - JSON agent memory/state
- `lastRun` - Last execution timestamp

**Purpose:**
- Maintains agent-specific context
- Stores agent memory across sessions
- Tracks agent activity

### Conversation & Message
Full conversation history with tool usage tracking.

**Conversation:**
- `sessionId` - Unique session identifier
- `agentId` - Which agent handled this
- `title`, `summary` - Auto-generated metadata

**Message:**
- `role` - user/assistant/system
- `content` - Message text
- `toolsUsed` - JSON array of tools used

## Agent-Specific Models

### Financial (Personal Finance Agent)

**Transaction:**
- Date, amount, description, category, merchant
- Link to budget (optional)
- User-scoped

**Budget:**
- Category, amount, period (daily/weekly/monthly/yearly)
- Start/end dates
- Spent & remaining tracking
- Unique per user/category/period

### Investing (Investing Agent)

**Portfolio:**
- Name (e.g., "Main Brokerage", "IRA")
- Account type
- User-scoped

**Holding:**
- Symbol, shares, costBasis, purchaseDate
- currentPrice, lastUpdated (periodically refreshed)
- Belongs to portfolio

### Notes (Notes Agent)

**Note:**
- Title, content, tags
- relatedNotes - JSON array of linked note IDs
- Full-text search capable

### Calendar & Tasks (Task Agent)

**CalendarEvent:**
- Title, description, start, end, location, attendees
- External sync (Google Calendar): externalId, source

**Task:**
- Title, description, status, priority
- dueDate, completedAt
- Optional link to calendar event

### Email (Email Agent)

**EmailMetadata:**
- Cache of email metadata (not full content)
- externalId (Gmail message ID), subject, sender, recipients
- Category, priority (AI-assigned)
- summary, actionItems (AI-generated)

**Privacy:** Email content not stored, only metadata for faster queries.

### Shopping (Shopping Agent)

**ShoppingItem:**
- Name, URL, currentPrice, targetPrice
- priceHistory - JSON array of price changes
- purchased flag & date

## Scheduled Tasks

**ScheduledTask:**
- User + agent + task type
- Cron-like schedule: "0 8 * * *"
- Execution tracking: lastRun, nextRun, status, result

**Examples:**
- Investing agent: Daily 8am market summary
- Finance agent: Daily balance summary
- Email agent: Morning inbox summary

## Indexes

All models indexed on:
- userId (fast user-scoped queries)
- Timestamps (chronological lookups)
- Foreign keys (fast joins)

**Performance:**
- Sub-10ms queries for most operations
- Optimized for read-heavy workloads
- SQLite for MVP, Postgres-ready schema

## Migration Strategy

### Current: SQLite
- Perfect for MVP and single-server deployments
- File-based, zero configuration
- Fast enough for thousands of users

### Future: PostgreSQL
- When scaling beyond single server
- Schema is Postgres-compatible
- Simple migration with Prisma

### Migration Path:
1. Export data with Prisma
2. Update datasource to Postgres
3. Run migrations
4. Import data

## Usage Examples

### Create User with Agents
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    goals: JSON.stringify(['Save $10k', 'Learn investing']),
    enabledAgents: JSON.stringify(['finance', 'investing'])
  }
});

await prisma.agentWorkspace.create({
  data: {
    userId: user.id,
    agentId: 'finance',
    agentName: 'Personal Finance Agent',
    config: JSON.stringify({ enabled: true })
  }
});
```

### Query Transactions
```typescript
const transactions = await prisma.transaction.findMany({
  where: {
    userId: user.id,
    date: { gte: new Date('2025-10-01') },
    category: 'Food'
  },
  orderBy: { date: 'desc' }
});
```

### Track Portfolio Performance
```typescript
const portfolio = await prisma.portfolio.findFirst({
  where: { userId: user.id },
  include: { holdings: true }
});

// Update holding prices
for (const holding of portfolio.holdings) {
  const price = await getStockPrice(holding.symbol);
  await prisma.holding.update({
    where: { id: holding.id },
    data: { currentPrice: price, lastUpdated: new Date() }
  });
}
```

### Save Conversation
```typescript
const conversation = await prisma.conversation.create({
  data: {
    userId: user.id,
    sessionId: 'unique-session-id',
    agentId: 'finance',
    messages: {
      create: [
        { role: 'user', content: 'How much did I spend on food?' },
        { role: 'assistant', content: 'You spent $383.49 on Food in October.' }
      ]
    }
  }
});
```

## Schema Evolution

### Planned Additions
- User authentication (password hash, OAuth tokens)
- Agent performance metrics
- Cost tracking (API usage per agent)
- Collaboration (shared agents, team workspaces)

### Easy to Extend
Prisma makes schema changes simple:
1. Edit schema.prisma
2. Run `npx prisma migrate dev`
3. Client auto-regenerates

## Backup & Recovery

**SQLite:**
- Simple file copy for backup
- Fast restore (just replace file)

**Automated Backups:**
- Daily cron job: copy dev.db
- S3/cloud storage for production

**Point-in-Time Recovery:**
- Keep transaction logs
- Replay from last backup

## Security Considerations

### Data Isolation
- All models user-scoped
- Row-level security via userId
- Cascade deletes (user deletion cleans all data)

### Sensitive Data
- Email content: NOT stored (only metadata)
- API keys: In environment variables, not DB
- Financial data: User-owned, encrypted at rest (production)

### Privacy
- User can delete all data (GDPR compliant)
- No cross-user data leakage
- Agent workspaces isolated

## Performance Tips

1. **Use indexes**: Already optimized
2. **Limit results**: Add `take` to queries
3. **Select specific fields**: Don't fetch all columns
4. **Use includes wisely**: Only join what you need
5. **Cache frequently accessed data**: Use Redis for production

## Troubleshooting

**Migration Errors:**
- Check DATABASE_URL in .env
- Run `npx prisma generate` after schema changes
- Use `npx prisma migrate reset` to start fresh (dev only)

**Slow Queries:**
- Check indexes
- Use Prisma query logging
- Consider adding compound indexes

**Schema Conflicts:**
- Backup database before migrations
- Test migrations on copy first
- Keep migration history in git
