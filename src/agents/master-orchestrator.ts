/**
 * Master Orchestrator
 *
 * Coordinates multiple specialized agents to handle complex user requests.
 * Uses Task tool for explicit delegation based on Phase 0 findings.
 *
 * IMPORTANT: Uses streaming input mode (async generator) for MCP compatibility.
 * See guides/custom-tools.md for details.
 */

import {
  query,
  type HookInput,
  type PreToolUseHookInput,
  type PostToolUseHookInput,
  type SessionStartHookInput,
  type SessionEndHookInput,
  type PreCompactHookInput,
  // type AgentInput,
  // type TaskOutput,
} from '@anthropic-ai/claude-agent-sdk';
import { userDataServer } from '../mcp-servers/user-data-server.js';
import { investingServer } from '../mcp-servers/investing-server.js';
import { emailServer } from '../mcp-servers/email-server.js';
import { financeAgentConfig } from './finance-agent.js';
import { budgetAnalyzerConfig } from './budget-analyzer.js';
import { researchAgentConfig } from './research-agent.js';
import { notesAgentConfig } from './notes-agent.js';
import { investingAgentConfig } from './investing-agent.js';
import { taskCalendarAgentConfig, productivityOptimizerConfig, meetingCoordinatorConfig } from './task-calendar-agent.js';
import { emailAgentConfig } from './email-agent.js';
import {
  shoppingAgentConfig,
  productSpecsResearcherConfig,
  priceTrackerConfig,
  reviewAnalyzerConfig,
  dealFinderConfig,
  alternativeFinderConfig
} from './shopping-agent.js';
import { permissionManager } from '../lib/permissions.js';

export interface AgentEvent {
  type: 'agent_delegation' | 'tool_use' | 'agent_complete' | 'compaction';
  timestamp: Date;
  agentName?: string;
  toolName?: string;
  details?: any;
  // Track subagent metrics (from TaskOutput)
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  cost_usd?: number;
  duration_ms?: number;
}

export class MasterOrchestrator {
  private sessionId: string;
  private conversationHistory: any[] = [];
  private events: AgentEvent[] = [];

  constructor(sessionId: string, conversationHistory: any[] = []) {
    this.sessionId = sessionId;
    this.conversationHistory = conversationHistory;
  }

  async processQuery(userPrompt: string) {
    // IMPORTANT: MCP servers require streaming input mode (async generator)
    // See guides/custom-tools.md for details
    async function* generateInput() {
      yield {
        type: 'user' as const,
        message: {
          role: 'user' as const,
          content: userPrompt
        },
        parent_tool_use_id: undefined
      };
    }

    const result = query({
      prompt: generateInput(),  // Use async generator for MCP compatibility
      options: {
        // Use Claude Code system prompt as base, extend with orchestrator instructions
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: `\n\nYou are a master orchestrator agent following the agent loop: gather context → take action → verify work → repeat.

## Gather Context
- Understand user's intent and required capabilities
- Check conversation history for context
- Search relevant data using Grep/Glob if needed
- Determine which specialized agents are needed

## Take Action (Agent Delegation)
Use Task tool to delegate to specialized agents:
  * finance: For basic financial analysis, spending tracking (use for simple transaction queries)
  * budget-analyzer: For advanced budget analysis, pattern recognition, forecasting, and budget optimization (use when user asks about budgets, spending patterns, financial insights, or savings optimization)
  * investing: For investment analysis, portfolio tracking, stock research, market data (use when user mentions stocks, investments, portfolio, trading)
  * research: For web research, fact-checking, information gathering (use when user asks questions needing external knowledge)
  * notes: For accessing and managing user's notes and calendar (use when user references meetings, past conversations, saved info)
  * task-calendar: For task management, scheduling, time blocking, productivity tracking (use when user mentions tasks, deadlines, productivity, calendar scheduling)
  * email: For email management, inbox summaries, drafting replies, and email organization (use when user mentions email, inbox, messages, or wants to send emails)
  * shopping: For product research, price comparison, deal finding, purchase recommendations (use when user mentions products, shopping, prices, purchases)

IMPORTANT: Always use the Task tool when delegating. Do not try to answer investment, financial, research, notes, task management, or email questions directly - delegate to the appropriate agent.

Examples:
- "What's my portfolio performance?" → use Task tool with subagent_type="investing"
- "How much did I spend on groceries?" → use Task tool with subagent_type="finance"
- "Analyze Tesla stock" → use Task tool with subagent_type="investing"
- "Help me optimize my budget" → use Task tool with subagent_type="budget-analyzer"
- "What are my spending patterns?" → use Task tool with subagent_type="budget-analyzer"
- "Create a task for project review" → use Task tool with subagent_type="task-calendar"
- "What's my schedule today?" → use Task tool with subagent_type="task-calendar"
- "Summarize my inbox" → use Task tool with subagent_type="email"
- "Draft a reply to John's email" → use Task tool with subagent_type="email"
- "Find the best laptop under $1000" → use Task tool with subagent_type="shopping"

- Coordinate multiple agents in parallel when beneficial
- Synthesize results from all agents

## Verify Work
- Ensure delegated tasks were completed successfully
- Check that agent responses are coherent and complete
- Validate no conflicting information from different agents
- Confirm user's original question was fully answered

## Subagent Usage Guidelines
- Use subagents for parallelization (multiple searches, analyses)
- Subagents reduce context usage (only return relevant info)
- Prefer file-based context over loading all data
- Generate code for complex calculations

Remember: The file system (data/) contains user information. Use Grep/Glob for search.`,
        },

        // Make specialized agents available via Task tool
        agents: {
          'investing': investingAgentConfig,
          'finance': financeAgentConfig,
          'research': researchAgentConfig,
          'notes': notesAgentConfig,
          'task-calendar': taskCalendarAgentConfig,
          'email': emailAgentConfig,
          'budget-analyzer': budgetAnalyzerConfig,
          'productivity-optimizer': productivityOptimizerConfig,
          'meeting-coordinator': meetingCoordinatorConfig,
          'shopping': shoppingAgentConfig,
          'product-specs-researcher': productSpecsResearcherConfig,
          'price-tracker': priceTrackerConfig,
          'review-analyzer': reviewAnalyzerConfig,
          'deal-finder': dealFinderConfig,
          'alternative-finder': alternativeFinderConfig,
        },

        // Connect MCP servers with user data, investing, and email
        mcpServers: {
          'user-data': userDataServer,
          'investing': investingServer,
          'email': emailServer,
        },

        // Allow master to use Task tool for delegation plus basic tools
        allowedTools: ['Task', 'Bash', 'Read', 'Write', 'Grep', 'Glob', 'WebSearch', 'WebFetch'],

        // Use permission manager for user approval
        canUseTool: permissionManager.getCanUseToolCallback(),

        // Load project settings for CLAUDE.md files if they exist
        settingSources: ['project'],

        // Continue conversation for memory
        continue: this.conversationHistory.length > 0,

        // Context management - implement compaction
        maxTurns: 50, // Limit conversation length before compaction

        // Hooks to track agent activity (CORRECT format from permissions.md)
        hooks: {
          PreToolUse: [{
            hooks: [async (input: any, toolUseId: any, context: any) => {
              return this.preToolUseHook(input, toolUseId, context);
            }]
          }],
          PostToolUse: [{
            hooks: [async (input: any, toolUseId: any, context: any) => {
              return this.postToolUseHook(input, toolUseId, context);
            }]
          }],
          PreCompact: [{
            hooks: [async (input: any, toolUseId: any, context: any) => {
              return this.preCompactHook(input, toolUseId, context);
            }]
          }]
        },
      }
    });

    // Stream and collect messages
    const messages: any[] = [];
    let capturedSessionId: string | undefined;

    for await (const message of result) {
      // Capture session ID from init message (see guides/sessions.md)
      if (message.type === 'system' && message.subtype === 'init') {
        capturedSessionId = message.session_id;
        console.log(`📋 Session ID: ${capturedSessionId}`);
      }

      messages.push(message);
      this.conversationHistory.push(message);
    }

    console.log('🔍 Query complete. Total events captured:', this.events.length);
    console.log('🔍 Events:', JSON.stringify(this.events, null, 2));

    return { messages, events: this.events, sessionId: capturedSessionId };
  }

  private async preToolUseHook(input: any, toolUseId: any, context: any) {
    console.log('🔥 PRE TOOL USE HOOK FIRED');
    console.log(`🔧 Tool: ${input.tool_name}`);

    this.events.push({
      type: 'tool_use',
      timestamp: new Date(),
      toolName: input.tool_name,
      details: input.tool_input,
    });

    // Detect Task tool usage (agent delegation)
    if (input.tool_name === 'Task') {
      const taskInput = input.tool_input as any; // AgentInput type not available in this SDK version
      const agentType = taskInput.subagent_type || 'unknown';
      console.log(`✅ TASK TOOL INVOKED - Subagent: ${agentType}`);

      this.events.push({
        type: 'agent_delegation',
        timestamp: new Date(),
        agentName: agentType,
        details: taskInput,
      });
    }

    return { continue: true };
  }

  private async postToolUseHook(input: any, toolUseId: any, context: any) {
    console.log('🔥 POST TOOL USE HOOK FIRED');
    console.log(`✅ Tool completed: ${input.tool_name}`);

    // If Task tool completed, capture subagent metrics
    if (input.tool_name === 'Task') {
      const taskOutput = input.tool_response as any; // TaskOutput type not available in this SDK version

      this.events.push({
        type: 'agent_complete',
        timestamp: new Date(),
        agentName: 'subagent',
        usage: taskOutput.usage,
        cost_usd: taskOutput.total_cost_usd,
        duration_ms: taskOutput.duration_ms,
      });

      console.log(`📊 Subagent metrics: ${taskOutput.duration_ms}ms, $${taskOutput.total_cost_usd}`);
    }

    return { continue: true };
  }

  private async preCompactHook(input: any, toolUseId: any, context: any) {
    console.log('🔥 PRE COMPACT HOOK FIRED');
    console.log(`🗜️  Compacting conversation history (trigger: ${input.trigger})`);

    this.events.push({
      type: 'compaction',
      timestamp: new Date(),
      details: {
        action: 'compaction',
        trigger: input.trigger,
        messageCount: this.conversationHistory.length,
        custom_instructions: input.custom_instructions,
      },
    });

    return { continue: true };
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  getEvents() {
    return this.events;
  }

  clearHistory() {
    this.conversationHistory = [];
    this.events = [];
  }
}
