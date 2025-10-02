/**
 * Shopping Agent - Product research, price tracking, deal finding
 * TODO: Implement with APIs for Amazon, price tracking, reviews
 */
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

export const shoppingAgentConfig: AgentDefinition = {
  description: 'Product research, price tracking, deal finding, purchase recommendations',
  prompt: `Shopping assistant for product research and deal finding.

Features to implement:
- Product comparison
- Price tracking and alerts
- Review aggregation
- Deal finding (coupons, sales)
- Wishlist management
- Replenishment reminders`,
  tools: ['WebSearch', 'Read', 'Write'],
  model: 'inherit',
};
