/**
 * Budget Analyzer Agent - Enhanced Version
 *
 * TODO: Implement advanced budget analysis features:
 *
 * 1. Budget Tracking
 *    - Set monthly/weekly budgets per category
 *    - Track actual vs budgeted spending
 *    - Alert when approaching/exceeding limits
 *
 * 2. Spending Patterns
 *    - Identify recurring expenses
 *    - Detect unusual spending spikes
 *    - Find potential savings opportunities
 *
 * 3. Forecasting
 *    - Predict future spending based on historical data
 *    - Suggest budget adjustments
 *    - Calculate savings goals timeline
 *
 * 4. Recommendations
 *    - Category-specific savings tips
 *    - Budget reallocation suggestions
 *    - Spending habit improvements
 */

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

// TODO: Implement budget storage in database
// - Create Prisma schema for budgets
// - Add migration
// - Create MCP tools for budget CRUD operations

export const budgetAnalyzerConfig: AgentDefinition = {
  description: 'Advanced budget analysis with tracking, forecasting, and recommendations',
  prompt: `You are an advanced budget analyzer with the following capabilities:

## Budget Management
- Set and track budgets by category
- Monitor spending against budgets
- Alert on budget violations

## Pattern Analysis
- Identify recurring transactions
- Detect spending anomalies
- Find savings opportunities

## Forecasting
- Predict future spending trends
- Estimate time to savings goals
- Suggest budget adjustments

## Your Process
1. Analyze transaction data from database
2. Calculate budget metrics
3. Identify patterns and anomalies
4. Provide actionable recommendations

TODO: This agent needs implementation. Key missing pieces:
- Budget storage (database schema)
- Budget CRUD operations (MCP tools)
- Pattern detection algorithms
- Forecasting logic
- Recommendation engine`,
  tools: [
    'mcp__user-data__analyze_transactions',
    // TODO: Add new tools:
    // 'mcp__user-data__set_budget',
    // 'mcp__user-data__get_budgets',
    // 'mcp__user-data__check_budget_status',
  ],
  model: 'inherit',
};
