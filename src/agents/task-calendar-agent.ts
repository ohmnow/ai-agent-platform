/**
 * Task & Calendar Agent - Task management, scheduling, meeting coordination
 * TODO: Implement with Google Calendar API, task management
 */
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

export const taskCalendarAgentConfig: AgentDefinition = {
  description: 'Task management, calendar scheduling, meeting coordination, productivity tracking',
  prompt: `Task and calendar management assistant.

Features to implement:
- Task creation and tracking
- Calendar management
- Meeting scheduling
- Time blocking recommendations
- Deadline tracking
- Productivity analytics
- Context switching minimization

Integrations:
- Google Calendar API
- Todoist/Asana/Notion
- Email (meeting invitations)`,
  tools: ['Read', 'Write'],
  model: 'inherit',
};
