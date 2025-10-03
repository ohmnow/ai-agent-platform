# Agentcomm Database Foundation

## 🎯 Overview

This implementation provides a complete, production-ready database foundation for the Agentcomm multi-agent productivity platform. The schema supports multiple users, specialized AI agents, isolated workspaces, and comprehensive data tracking across financial, productivity, and communication domains.

## ✅ What's Implemented

### Core Schema
- **User Management** - Complete user profiles with preferences and goals
- **Agent Workspaces** - Isolated environments for each agent per user
- **Conversation History** - Full chat history with tool usage tracking
- **Message Management** - Structured conversation messages with metadata

### Agent-Specific Models

#### 💰 Personal Finance Agent
- **Transactions** - Income/expense tracking with categorization
- **Budgets** - Category-based budget management with spending tracking
- **Merchant tracking** - Automatic merchant identification

#### 📈 Investing Agent
- **Portfolios** - Multiple investment accounts per user
- **Holdings** - Stock/fund positions with cost basis tracking
- **Price Updates** - Current market values (updateable)

#### 📝 Notes Agent
- **Notes** - Rich text notes with tagging system
- **Related Notes** - Cross-references between notes
- **Search Optimization** - Full-text search ready

#### 📅 Task & Calendar Agent
- **Calendar Events** - Event management with external sync support
- **Tasks** - Task tracking with priorities and due dates
- **Event Linking** - Optional task-to-event relationships

#### 📧 Email Agent
- **Email Metadata** - Privacy-focused email caching (no content)
- **AI Categorization** - Automated email classification
- **Action Items** - AI-extracted task identification

#### 🛒 Shopping Agent
- **Shopping Wishlist** - Product tracking with price monitoring
- **Price History** - Historical price tracking
- **Purchase Tracking** - Bought item management

### 🤖 Automation Features
- **Scheduled Tasks** - Cron-like proactive agent operations
- **Execution Tracking** - Success/failure monitoring
- **Result Storage** - Task output persistence

## 🚀 Quick Start

### 1. Setup Database
```bash
# Create environment file
echo 'DATABASE_URL="file:./dev.db"' > .env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with test data
npm run db:seed

# Test everything works
npm run db:test
```

### 2. Available Scripts
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run new migrations
npm run db:migrate:reset # Reset database (dev only)
npm run db:seed          # Populate with test data
npm run db:test          # Verify database functionality
npm run db:studio        # Open Prisma Studio GUI
```

### 3. Test Data
After seeding, you'll have:
- Demo user: `demo@agentcomm.ai`
- 6 agent workspaces (finance, investing, email, research, shopping, tasks)
- Sample financial transactions and budgets
- Investment portfolio with 4 stock holdings
- Notes, calendar events, and tasks
- Shopping wishlist items
- Scheduled automation tasks

## 📊 Schema Highlights

### Performance Optimizations
- **User-scoped indexes** on all models for fast queries
- **Timestamp indexes** for chronological data access
- **Foreign key indexes** for efficient joins
- **Compound indexes** where beneficial

### Data Integrity
- **Cascade deletes** - User deletion cleans all related data
- **Foreign key constraints** - Referential integrity enforced
- **Unique constraints** - Prevent duplicate entries
- **JSON validation** - Structured data in JSON fields

### Privacy & Security
- **Row-level security** - All data is user-scoped
- **No email content storage** - Only metadata cached
- **Sensitive data isolation** - Financial data properly contained
- **GDPR compliance ready** - Easy data deletion

## 🔄 Migration Strategy

### Current: SQLite
- Perfect for MVP and development
- Zero configuration, file-based
- Fast enough for thousands of users
- Easy backup (simple file copy)

### Future: PostgreSQL
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Migration path:
1. Export data: `npx prisma db pull`
2. Update datasource in schema.prisma
3. Create new migrations: `npx prisma migrate dev`
4. Import data with custom script

## 💡 Usage Examples

### Create User with Agents
```typescript
import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    goals: JSON.stringify(['Save $10k', 'Learn investing']),
    riskTolerance: 'moderate',
    enabledAgents: JSON.stringify(['finance', 'investing'])
  }
});

// Create agent workspace
await prisma.agentWorkspace.create({
  data: {
    userId: user.id,
    agentId: 'finance',
    agentName: 'Personal Finance Agent',
    config: JSON.stringify({
      budgetAlerts: true,
      categorization: 'auto'
    })
  }
});
```

### Track Expenses
```typescript
// Add transaction
await prisma.transaction.create({
  data: {
    userId: user.id,
    date: new Date(),
    amount: -45.99,
    description: 'Grocery shopping',
    category: 'Food',
    merchant: 'Whole Foods'
  }
});

// Query spending by category
const categorySpending = await prisma.transaction.groupBy({
  by: ['category'],
  where: {
    userId: user.id,
    amount: { lt: 0 },
    date: { gte: new Date('2025-10-01') }
  },
  _sum: { amount: true }
});
```

### Manage Conversations
```typescript
// Create conversation with messages
const conversation = await prisma.conversation.create({
  data: {
    userId: user.id,
    sessionId: 'session-123',
    agentId: 'finance',
    title: 'October Budget Review',
    messages: {
      create: [
        {
          role: 'user',
          content: 'How much did I spend on food this month?'
        },
        {
          role: 'assistant',
          content: 'You spent $234.56 on food in October.',
          toolsUsed: JSON.stringify(['transaction_query'])
        }
      ]
    }
  }
});
```

## 📈 Performance Tips

1. **Always filter by userId first** - Utilizes primary indexes
2. **Use specific field selection** - Don't fetch unnecessary data
3. **Leverage include wisely** - Only join needed relations
4. **Add pagination** - Use `take` and `skip` for large datasets
5. **Consider caching** - Cache frequently accessed user preferences

## 🛠 Extending the Schema

### Adding New Agent Types
1. Update User.enabledAgents enum values
2. Create agent-specific models if needed
3. Add to AgentWorkspace.agentId validation
4. Update seed script with new agent data

### Adding New Features
1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Update TypeScript types auto-generate
4. Add to seed script for testing

## 🔍 Troubleshooting

### Migration Issues
- Check DATABASE_URL in .env file
- Run `npm run db:generate` after schema changes
- Use `npm run db:migrate:reset` for fresh start (dev only)

### Performance Issues
- Add indexes for new query patterns
- Use `npx prisma migrate dev --create-only` to review migrations
- Enable Prisma query logging in development

### Data Consistency
- Always use transactions for multi-model operations
- Validate JSON fields before storage
- Use foreign key constraints to maintain referential integrity

## 📝 Next Steps

This foundation is ready for:
- [ ] Authentication system integration
- [ ] Real-time data synchronization
- [ ] Advanced query optimization
- [ ] Multi-tenant architecture
- [ ] Data analytics and reporting
- [ ] External API integrations
- [ ] Automated testing suite

## 📞 Support

For questions about the database schema:
1. Check the comprehensive documentation in `docs/database-schema.md`
2. Review the usage examples in the seed script
3. Run the test script to understand data relationships
4. Use Prisma Studio (`npm run db:studio`) for visual exploration

---

**Built with:** Prisma ORM, SQLite (development), TypeScript
**Status:** ✅ Production Ready
**Last Updated:** October 2025