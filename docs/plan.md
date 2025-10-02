# AI Agent Platform - MVP Development Plan

**Goal:** Build a minimal working prototype to test multi-agent orchestration with a simple web interface.

**Philosophy:**
- Skip production concerns (auth, database, deployment)
- Prove the core agent delegation pattern works
- Build iteratively, testing each component as we go
- Validate assumptions early before building complex features

---

## 🎯 Core Concept

```
User Input → Master Orchestrator Agent
                    ↓
            Analyzes intent & delegates to:
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
Finance Agent  Research Agent  Notes Agent
    ↓               ↓               ↓
Sub-agents     Sub-agents      Sub-agents
(via Task tool) (via Task tool) (via Task tool)
```

**Key Insights:**
- Agent delegation in the SDK works through the `Task` tool, not automatic routing. The master orchestrator must explicitly use the Task tool to delegate to specialized agents.
- Agents operate in a feedback loop: **gather context → take action → verify work → repeat**
- The file system represents information that could be pulled into the model's context (agentic search)
- Code generation is preferred for precise, composable, and reusable operations

**SDK Alignment Notes:**
- Hook event names are PascalCase: `'PreToolUse'`, `'PostToolUse'`, `'PreCompact'`, `'SessionStart'`, `'SessionEnd'`
- Hook inputs use `hook_event_name` (not `.event`) and flat properties like `tool_name`, `tool_input`
- AgentDefinition uses `prompt` (not `instructions`) and `tools` (not `allowedTools`)
- System prompt can extend Claude Code preset: `{ type: 'preset', preset: 'claude_code', append: '...' }`
- **CRITICAL:** Custom MCP servers require streaming input mode (async generator), not simple string prompts
- Session IDs are extracted from `system` messages with `subtype: 'init'`
- MCP tool naming: `mcp__{server-name}__{tool-name}`

**Guide References:**
Before implementing specific features, review these guides:
- Phase 0: Read `guides/subagents.md` for delegation patterns
- Phase 1: Read `guides/custom-tools.md` for MCP server creation (CRITICAL - streaming input required!)
- Phase 2: Read `guides/sessions.md` for proper session management
- Phase 2.5: Read `guides/cost-tracking.md` for usage tracking

---

## 📁 Project Structure (within current directory)

```
anth-agent-sdk-v1/
├── src/
│   ├── test/                     # NEW - Validation tests
│   │   └── test-delegation.ts   # Phase 0 validation
│   │
│   ├── data/                     # NEW - Agent file system (agentic search)
│   │   ├── notes/               # User notes as files
│   │   ├── transactions/        # Transaction data
│   │   └── calendar/            # Calendar events
│   │
│   ├── lib/                      # NEW - Shared utilities
│   │   └── sessions.ts          # Session management
│   │
│   ├── web/                      # NEW - Web interface
│   │   ├── server.ts            # Express server
│   │   ├── public/              # Static files
│   │   │   ├── index.html       # Landing page
│   │   │   ├── dashboard.html   # Agent dashboard
│   │   │   ├── styles.css       # Styling
│   │   │   └── app.js           # Client-side JS
│   │   └── api/                 # API routes
│   │       └── agents.ts        # Agent endpoints
│   │
│   ├── agents/                   # NEW - Agent definitions
│   │   ├── master-orchestrator.ts
│   │   ├── finance-agent.ts
│   │   ├── research-agent.ts
│   │   └── notes-agent.ts
│   │
│   ├── mcp-servers/              # NEW - Custom MCP servers
│   │   └── user-data-server.ts  # Simulated user data (notes, tasks, etc.)
│   │
│   ├── mock/                     # NEW - Mock data/auth
│   │   ├── users.ts             # Mock user data
│   │   └── connections.ts       # Mock data connections
│   │
│   └── examples/                 # EXISTING - Keep as reference
│
├── docs/                         # NEW
│   └── plan.md                  # This file
│
└── [existing files...]
```

---

## 📋 Implementation Phases

### Phase 0: Validation (CRITICAL - Do This First)

Before building the full system, validate core assumptions about agent delegation and context management.

**Create:** `src/test/test-delegation.ts`

**Test Areas:**

1. **SDK Type Validation**
   - Verify hook event names are PascalCase (`'PreToolUse'`, not `'preToolUse'`)
   - Confirm hook input structure uses `hook_event_name`, `tool_name`, `tool_input`
   - Validate AgentDefinition uses `prompt` and `tools` (not `instructions`, `allowedTools`)
   - Test systemPrompt preset extension works correctly

2. **Agent Delegation**
   - Test whether `agents` option enables automatic delegation
   - Test whether `Task` tool is required for delegation
   - Verify Task tool input structure: `{ description, prompt, subagent_type }`
   - Test hook events to understand what's actually happening
   - Verify subagent isolation and context management
   - Capture and validate TaskOutput metrics (usage, cost, duration)

3. **Context Management**
   - Test conversation memory/context passing
   - Validate context window limits with long conversations
   - Test compaction behavior and automatic summarization
   - Measure context usage across subagent calls
   - Verify `maxTurns` option works as expected
   - Test `PreCompact` hook trigger conditions

4. **Tool Access**
   - Verify that subagents can access appropriate tools
   - Test file system access (Read, Write, Glob, Grep)
   - Validate bash script execution capabilities
   - Confirm MCP server tool availability
   - Test that `settingSources: ['project']` loads CLAUDE.md files

**Success Criteria:**
- Understand exactly how to trigger subagent delegation
- Confirm which hook events fire during delegation (PascalCase names)
- Know when compaction is needed and how it works
- Validate agentic search capabilities (Grep, Glob)
- Verify all SDK types match official reference

**If delegation doesn't work as expected:** Pivot architecture before building UI.

---

## 🚀 Phase 1: Core Infrastructure

### 1.1 Set up Web Server
**File:** `src/web/server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints
app.post('/api/agents/query', async (req, res) => {
  // Handle agent queries
});

app.get('/api/agents/status', (req, res) => {
  // Return active agents
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Agent Platform running on http://localhost:${PORT}`);
});
```

**Dependencies to add:**
```bash
npm install express cors
npm install -D @types/express @types/cors
```

### 1.2 Session Management
**File:** `src/lib/sessions.ts`

```typescript
import { randomUUID } from 'crypto';

export interface Session {
  id: string;
  userId: string;
  conversationHistory: any[];
  createdAt: Date;
  lastActivity: Date;
}

class SessionManager {
  private sessions = new Map<string, Session>();

  createSession(userId: string = 'user-001'): Session {
    const session: Session = {
      id: randomUUID(),
      userId,
      conversationHistory: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  updateHistory(sessionId: string, messages: any[]): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.conversationHistory.push(...messages);
      session.lastActivity = new Date();
    }
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Cleanup old sessions (>1 hour inactive)
  cleanupStale(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [id, session] of this.sessions.entries()) {
      if (session.lastActivity < oneHourAgo) {
        this.sessions.delete(id);
      }
    }
  }
}

export const sessionManager = new SessionManager();

// Run cleanup every 15 minutes
setInterval(() => sessionManager.cleanupStale(), 15 * 60 * 1000);
```

### 1.3 Mock User System

**File:** `src/mock/users.ts`

```typescript
// Simple in-memory mock - no database needed for MVP
export const mockUser = {
  id: 'user-001',
  name: 'Test User',
  email: 'test@example.com',
  connectedServices: ['notes', 'calendar', 'mock-finance'],
};

export function getCurrentUser() {
  return mockUser; // In production, this would check auth
}
```

### 1.4 File-Based Data Storage (Agentic Search)

**Anthropic's Guidance:** "The file system represents information that could be pulled into the model's context. The folder and file structure becomes a form of context engineering."

Instead of storing data in JSON, store it as files for agentic search using Grep/Glob.

**File:** `src/data/notes/meeting-notes-2025-10-01.md`

```markdown
# Meeting Notes - Q1 Strategy
Date: 2025-10-01

## Discussion Points
- Discussed Q1 strategy and revenue targets
- Team agreed on new product features
- Action items assigned to team leads
```

**File:** `src/data/notes/ideas-2025-09-28.md`

```markdown
# Product Ideas
Date: 2025-09-28

## New Features
- AI-powered search across user notes
- Integration with calendar for context-aware reminders
- Budget analysis with predictive modeling
```

**File:** `src/data/transactions/2025-10.csv`

```csv
date,amount,description,category
2025-10-01,-45.99,Grocery Store,Food
2025-10-01,-120.00,Electric Bill,Utilities
2025-10-02,-12.50,Coffee Shop,Food
```

**File:** `src/data/calendar/events.json`

```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "start": "2025-10-03T10:00:00",
    "end": "2025-10-03T11:00:00",
    "location": "Conference Room A"
  }
]
```

**Benefits:**
- Agents can use Grep to search across notes: `grep -r "Q1 strategy" data/notes/`
- Glob patterns to find specific files: `data/transactions/2025-*.csv`
- Bash commands for data processing: `tail -n 10 data/transactions/2025-10.csv`
- More scalable than loading all data into tools

---

## 🤖 Phase 2: Agent System

### 2.1 Create MCP Server with Code Generation

**File:** `src/mcp-servers/user-data-server.ts`

**Anthropic's Guidance:** "Code is precise, composable, and infinitely reusable. Consider which tasks benefit from being expressed as code."

```typescript
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import path from 'path';

// Instead of returning raw data, provide tools that work with file system
const analyzeTransactionsWithCode = tool(
  'analyze_transactions_code',
  'Generate Python code to analyze transaction data from CSV files',
  {
    month: z.string().describe('Month to analyze (e.g., "2025-10")'),
    analysis_type: z.enum(['summary', 'by_category', 'trends']).describe('Type of analysis to perform'),
  },
  async (args) => {
    const csvPath = path.join(process.cwd(), `src/data/transactions/${args.month}.csv`);

    // Generate Python code for analysis
    const pythonCode = `
import pandas as pd
import json

# Load transaction data
df = pd.read_csv('${csvPath}')
df['amount'] = df['amount'].astype(float)

${args.analysis_type === 'summary' ? `
# Calculate summary statistics
summary = {
    'total_spent': float(df[df['amount'] < 0]['amount'].sum()),
    'total_income': float(df[df['amount'] > 0]['amount'].sum()),
    'transaction_count': len(df),
    'average_transaction': float(df['amount'].mean())
}
print(json.dumps(summary, indent=2))
` : ''}

${args.analysis_type === 'by_category' ? `
# Group by category
by_category = df.groupby('category')['amount'].sum().to_dict()
print(json.dumps(by_category, indent=2))
` : ''}

${args.analysis_type === 'trends' ? `
# Calculate daily trends
df['date'] = pd.to_datetime(df['date'])
daily = df.groupby('date')['amount'].sum().to_dict()
print(json.dumps({str(k): float(v) for k, v in daily.items()}, indent=2))
` : ''}
`;

    return {
      content: [{
        type: 'text',
        text: `Generated Python code for ${args.analysis_type} analysis:\n\n${pythonCode}\n\nRun with: python -c "${pythonCode.replace(/\n/g, '\\n')}"`,
      }],
    };
  }
);

const createBudgetRule = tool(
  'create_budget_rule',
  'Generate code for a budget rule that runs on new transactions',
  {
    rule_name: z.string().describe('Name of the budget rule'),
    condition: z.string().describe('Condition to check (e.g., "amount > 100")'),
    action: z.string().describe('Action to take (e.g., "send_alert")'),
  },
  async (args) => {
    const ruleCode = `
# Budget Rule: ${args.rule_name}
def check_rule(transaction):
    amount = transaction['amount']
    category = transaction['category']
    description = transaction['description']

    if ${args.condition}:
        ${args.action}(transaction)
        return True
    return False
`;

    return {
      content: [{
        type: 'text',
        text: `Generated budget rule code:\n\n${ruleCode}`,
      }],
    };
  }
);

export const userDataServer = createSdkMcpServer({
  name: 'user-data',
  version: '1.0.0',
  tools: [analyzeTransactionsWithCode, createBudgetRule],
});
```

**Key Changes:**
- Tools generate code instead of returning raw data
- Agents can execute generated code via Bash tool
- More flexible - can handle complex calculations
- Code is reusable and precise

### 2.2 Define Specialized Agents

**IMPORTANT:** Based on Phase 0 testing, we'll use the Task tool for delegation rather than the `agents` option. Each agent type will be configured as a separate agent definition that can be invoked via Task tool.

**File:** `src/agents/finance-agent.ts`

```typescript
export const financeAgentConfig = {
  name: 'Finance Agent',
  // NOTE: Use clear, directive language in descriptions (see guides/subagents.md)
  description: 'MUST BE USED for financial analysis, spending tracking, and budget insights. Use PROACTIVELY when user mentions money, transactions, or budgets.',
  prompt: `You are a personal finance assistant following the agent loop: gather context → take action → verify work → repeat.

## Gather Context
- Use Grep to search transaction CSV files: grep "Grocery" data/transactions/*.csv
- Use Glob to find relevant files: data/transactions/2025-*.csv
- Use Read to examine specific transaction files
- Search previous analysis results stored in data/analysis/

## Take Action
- Generate Python code to analyze spending patterns using analyze_transactions_code tool
- Create budget rules with executable code using create_budget_rule tool
- Execute analysis code via Bash tool
- Store results in data/analysis/ for future reference

## Verify Work
- Check that generated code runs without errors
- Validate calculations make mathematical sense
- Compare results against known totals
- If errors occur, regenerate code with fixes

## Capabilities
- Analyze spending patterns by category, time period, merchant
- Track budgets and alert on overspending
- Provide financial insights and recommendations
- Generate reusable code for recurring analyses

When you need specialized analysis, use the Task tool to invoke the 'budget-analyzer' subagent.

Remember: Prefer code generation for calculations - it's precise, composable, and reusable.`,
  tools: ['Bash', 'Read', 'Write', 'Grep', 'Glob', 'analyze_transactions_code', 'create_budget_rule', 'WebSearch', 'Task'],
  model: 'inherit',
};

// Subagent for specialized budget analysis
export const budgetAnalyzerConfig = {
  name: 'Budget Analyzer',
  description: 'Specializes in analyzing spending patterns and suggesting budget improvements',
  prompt: `You are a specialized budget analysis subagent.

Your task: Analyze transaction data and provide budget recommendations.

Process:
1. Read transaction CSV files from data/transactions/
2. Generate Python code to calculate spending by category
3. Execute analysis code via Bash
4. Verify results are mathematically correct
5. Return insights and recommendations to parent agent

Focus on precision and verification - double-check all calculations.`,
  tools: ['Bash', 'Read', 'Grep', 'analyze_transactions_code'],
  model: 'inherit',
};

// Verification tool for finance agent
export const verifyFinanceCalculations = tool(
  'verify_finance_calculations',
  'Verify that financial calculations are correct by checking rules',
  {
    calculation_type: z.enum(['total', 'average', 'category_sum']),
    result: z.number().describe('The calculated result to verify'),
    source_file: z.string().describe('CSV file used for calculation'),
  },
  async (args) => {
    // Simple verification logic
    const rules = {
      total: 'Sum of all amounts should equal result',
      average: 'Total divided by count should equal result',
      category_sum: 'Sum of category amounts should equal result',
    };

    return {
      content: [{
        type: 'text',
        text: `Verification rule for ${args.calculation_type}: ${rules[args.calculation_type]}

To verify:
1. Re-read source file: ${args.source_file}
2. Recalculate using bash: awk -F',' '{sum+=$2} END {print sum}' ${args.source_file}
3. Compare with result: ${args.result}
4. If mismatch, regenerate calculation code`,
      }],
    };
  }
);
```

**File:** `src/agents/research-agent.ts`

```typescript
export const researchAgentConfig = {
  name: 'Research Agent',
  description: 'Use for web research, fact-checking, and information gathering. PROACTIVELY invoke when user asks questions requiring external knowledge or current information.',
  prompt: `You are a research assistant following the agent loop: gather context → take action → verify work → repeat.

## Gather Context (Agentic Search)
- Search previous research: grep -r "topic" data/notes/
- Find related notes: glob pattern matching data/notes/*topic*.md
- Review existing research files to avoid duplication
- Check user preferences in data/notes/research-preferences.md

## Take Action (Parallel Subagents)
- Use Task tool to spawn multiple search subagents in parallel
- Each subagent researches different aspects or sources
- Subagents return only relevant excerpts, not full content
- Synthesize findings from all subagents
- Save research to data/notes/research-YYYY-MM-DD-topic.md

## Verify Work
- Cross-reference facts across multiple sources
- Check that citations are properly formatted
- Verify URLs are accessible
- Ensure no contradictory information

## Capabilities
- Deep web research with parallel subagents
- Fact-checking and source verification
- Synthesizing information from multiple sources
- Saving findings for future reference

For deep research requiring multiple sources, spawn specialized search subagents in parallel.
Always cite your sources and verify information across sources.`,
  tools: ['WebSearch', 'WebFetch', 'Read', 'Write', 'Grep', 'Glob', 'Task'],
  model: 'inherit',
};
```

**File:** `src/agents/notes-agent.ts`

```typescript
export const notesAgentConfig = {
  name: 'Notes Agent',
  description: 'Use for accessing notes, calendar, and personal knowledge management. Invoke when user references past conversations, meetings, or saved information.',
  prompt: `You are a personal knowledge manager following the agent loop: gather context → take action → verify work → repeat.

## Gather Context (File System as Knowledge Base)
- Search notes using grep: grep -i "keyword" data/notes/*.md
- Find files by date: data/notes/*2025-10*.md
- List all notes: glob data/notes/**/*.md
- Read calendar: data/calendar/events.json

## Take Action
- Create new notes as markdown files in data/notes/
- Update existing notes using Write tool
- Organize notes into subdirectories by topic
- Generate summaries of multiple notes
- Link related notes together

## Verify Work
- Confirm files were created/updated correctly
- Check markdown formatting is valid
- Verify cross-references between notes work
- Ensure no duplicate notes exist

## File Naming Convention
- Meeting notes: meeting-notes-YYYY-MM-DD-topic.md
- Ideas: ideas-YYYY-MM-DD-topic.md
- Research: research-YYYY-MM-DD-topic.md
- General: note-YYYY-MM-DD-title.md

Always use the file system for storage - this enables powerful agentic search with grep/glob.`,
  tools: ['Read', 'Write', 'Grep', 'Glob', 'Bash'],
  model: 'inherit',
};
```

### 2.3 Master Orchestrator

**Important:** Before implementing, read `guides/sessions.md` for session management and `guides/custom-tools.md` for MCP streaming input requirements.

**File:** `src/agents/master-orchestrator.ts`

```typescript
import {
  query,
  HookInput,
  PreToolUseHookInput,
  PostToolUseHookInput,
  SessionStartHookInput,
  SessionEndHookInput,
  PreCompactHookInput,
  AgentInput,
  TaskOutput,
} from '@anthropic-ai/claude-agent-sdk';
import { userDataServer } from '../mcp-servers/user-data-server.js';
import { financeAgentConfig } from './finance-agent.js';
import { researchAgentConfig } from './research-agent.js';
import { notesAgentConfig } from './notes-agent.js';

export interface AgentEvent {
  type: 'agent_delegation' | 'tool_use' | 'agent_complete';
  timestamp: Date;
  agentName?: string;
  toolName?: string;
  details?: any;
  // Track subagent metrics
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
        }
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
- Use Task tool to delegate to specialized agents:
  * finance: For financial analysis, spending tracking, budgets
  * research: For web research, fact-checking, information gathering
  * notes: For accessing and managing user's notes and calendar
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
          'finance': financeAgentConfig,
          'research': researchAgentConfig,
          'notes': notesAgentConfig,
        },

        // Connect MCP server with user data
        mcpServers: [userDataServer],

        // Allow master to use Task tool for delegation plus basic tools
        allowedTools: ['Task', 'Bash', 'Read', 'Write', 'Grep', 'Glob', 'WebSearch'],

        // Load project settings for CLAUDE.md files if they exist
        settingSources: ['project'],

        // Continue conversation for memory
        continue: this.conversationHistory.length > 0,

        // Context management - implement compaction
        maxTurns: 50, // Limit conversation length before compaction

        // Hooks to track agent activity
        hooks: [this.activityTracker.bind(this), this.compactionHook.bind(this)],
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

    return { messages, events: this.events };
  }

  private activityTracker(input: HookInput) {
    // SDK Reference: Hook event names are PascalCase
    // SDK Reference: Use hook_event_name, tool_name, tool_input (not nested objects)

    // Track tool usage
    if (input.hook_event_name === 'PreToolUse') {
      const preToolInput = input as PreToolUseHookInput;
      console.log(`🔧 Using tool: ${preToolInput.tool_name}`);

      this.events.push({
        type: 'tool_use',
        timestamp: new Date(),
        toolName: preToolInput.tool_name,
        details: preToolInput.tool_input,
      });

      // Detect Task tool usage (agent delegation)
      if (preToolInput.tool_name === 'Task') {
        const taskInput = preToolInput.tool_input as AgentInput;
        const agentType = taskInput.subagent_type || 'unknown';
        console.log(`🤖 Delegating to: ${agentType} agent`);

        this.events.push({
          type: 'agent_delegation',
          timestamp: new Date(),
          agentName: agentType,
          details: taskInput,
        });
      }
    }

    // Track tool completion and capture metrics
    if (input.hook_event_name === 'PostToolUse') {
      const postToolInput = input as PostToolUseHookInput;

      // If Task tool completed, capture subagent metrics
      if (postToolInput.tool_name === 'Task') {
        const taskOutput = postToolInput.tool_response as TaskOutput;

        this.events.push({
          type: 'agent_complete',
          timestamp: new Date(),
          agentName: 'subagent',
          usage: taskOutput.usage,
          cost_usd: taskOutput.total_cost_usd,
          duration_ms: taskOutput.duration_ms,
        });

        console.log(`✅ Subagent completed in ${taskOutput.duration_ms}ms, cost: $${taskOutput.total_cost_usd}`);
      }
    }

    // Track other lifecycle events
    if (input.hook_event_name === 'SessionStart') {
      const sessionInput = input as SessionStartHookInput;
      console.log(`🚀 Session started (${sessionInput.source})`);
    }

    if (input.hook_event_name === 'SessionEnd') {
      const sessionInput = input as SessionEndHookInput;
      console.log(`✅ Session ended (${sessionInput.reason})`);
    }
  }

  private compactionHook(input: HookInput) {
    // Anthropic's guidance: "Compaction automatically summarizes previous messages when context limit approaches"
    // SDK Reference: Hook event name is 'PreCompact' (PascalCase)

    if (input.hook_event_name === 'PreCompact') {
      const compactInput = input as PreCompactHookInput;
      console.log(`🗜️ Compacting conversation history (trigger: ${compactInput.trigger})`);

      this.events.push({
        type: 'agent_complete',
        timestamp: new Date(),
        details: {
          action: 'compaction',
          trigger: compactInput.trigger,
          messageCount: this.conversationHistory.length,
          custom_instructions: compactInput.custom_instructions,
        },
      });
    }

    // Monitor context usage after tool use
    if (input.hook_event_name === 'PostToolUse') {
      const currentMessageCount = this.conversationHistory.length;

      // Warn if approaching context limits
      if (currentMessageCount > 40) {
        console.log(`⚠️ Conversation has ${currentMessageCount} messages - approaching compaction threshold`);
      }
    }
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
```

---

## 🎨 Phase 3: Web Interface

### 3.1 Landing Page
**File:** `src/web/public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Agent Platform</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="hero">
    <h1>AI Agent Platform</h1>
    <p class="subtitle">Your personal AI assistants, working together</p>
    
    <div class="prompt-container">
      <input 
        type="text" 
        id="prompt-input" 
        placeholder="What would you like to do?"
        autofocus
      />
      <button id="submit-btn">Start</button>
    </div>

    <div class="agent-templates">
      <h3>Choose an agent type or describe your own</h3>
      <div class="templates-grid">
        <div class="template-card" data-agent="finance">
          <div class="icon">💰</div>
          <h4>Finance Agent</h4>
          <p>Track spending, analyze budgets, financial insights</p>
        </div>
        <div class="template-card" data-agent="research">
          <div class="icon">🔬</div>
          <h4>Research Agent</h4>
          <p>Deep web research, fact-checking, synthesis</p>
        </div>
        <div class="template-card" data-agent="notes">
          <div class="icon">📝</div>
          <h4>Notes Agent</h4>
          <p>Knowledge management, search, organization</p>
        </div>
        <div class="template-card" data-agent="custom">
          <div class="icon">⚙️</div>
          <h4>Custom Agent</h4>
          <p>Describe your own agent purpose</p>
        </div>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

### 3.2 Dashboard
**File:** `src/web/public/dashboard.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Dashboard</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="dashboard">
    <aside class="sidebar">
      <h2>Your Agents</h2>
      <div id="agent-list">
        <!-- Populated by JS -->
      </div>
    </aside>

    <main class="main-panel">
      <div class="conversation-container">
        <div id="messages"></div>
        
        <div class="input-container">
          <input 
            type="text" 
            id="chat-input" 
            placeholder="Send a message..."
          />
          <button id="send-btn">Send</button>
        </div>
      </div>
    </main>

    <aside class="info-panel">
      <h3>Agent Activity</h3>
      <div id="agent-activity">
        <!-- Real-time agent delegation info -->
      </div>
      
      <h3>Tools Used</h3>
      <div id="tools-used">
        <!-- Track which tools are being called -->
      </div>
    </aside>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

### 3.3 Client JavaScript
**File:** `src/web/public/app.js`

```javascript
// Session management - persist session across page loads
let sessionId = localStorage.getItem('sessionId');

// Landing page - template selection
document.querySelectorAll('.template-card').forEach(card => {
  card.addEventListener('click', () => {
    const agentType = card.dataset.agent;
    const input = document.getElementById('prompt-input');

    if (agentType === 'finance') {
      input.value = 'Analyze my spending from the past week';
    } else if (agentType === 'research') {
      input.value = 'Research the latest trends in AI agents';
    } else if (agentType === 'notes') {
      input.value = 'What notes do I have about meetings?';
    }

    // Could auto-submit or let user edit
    input.focus();
  });
});

// Submit query from landing page
document.getElementById('submit-btn')?.addEventListener('click', async () => {
  const prompt = document.getElementById('prompt-input').value;
  if (!prompt) return;

  // Redirect to dashboard with query
  window.location.href = `/dashboard.html?q=${encodeURIComponent(prompt)}`;
});

// Dashboard - handle initial query from URL parameter
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q');

  if (initialQuery && document.getElementById('chat-input')) {
    // Populate input and auto-submit
    document.getElementById('chat-input').value = initialQuery;
    // Clear URL parameter
    window.history.replaceState({}, '', '/dashboard.html');
    // Trigger send
    sendMessage(initialQuery);
  }
});

// Dashboard - send message
document.getElementById('send-btn')?.addEventListener('click', async () => {
  const input = document.getElementById('chat-input');
  const prompt = input.value;
  if (!prompt) return;

  input.value = '';
  sendMessage(prompt);
});

// Handle Enter key in chat input
document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('send-btn').click();
  }
});

async function sendMessage(prompt) {
  addMessage('user', prompt);

  // Call API
  try {
    const response = await fetch('/api/agents/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, sessionId }),
    });

    const data = await response.json();

    // Store session ID for conversation continuity
    if (data.sessionId) {
      sessionId = data.sessionId;
      localStorage.setItem('sessionId', sessionId);
    }

    // Display messages
    data.messages.forEach(msg => {
      if (msg.type === 'assistant' && msg.text) {
        addMessage('assistant', msg.text);
      }
    });

    // Display agent events
    data.events?.forEach(evt => {
      if (evt.type === 'agent_delegation') {
        addAgentActivity(`🤖 Using ${evt.agentName}`);
      }
      if (evt.type === 'tool_use') {
        addToolUsage(evt.toolName);
      }
    });

  } catch (error) {
    console.error('Error:', error);
    addMessage('error', 'Failed to process request');
  }
}

function addMessage(role, text) {
  const messagesDiv = document.getElementById('messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `message message-${role}`;
  msgDiv.textContent = text;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addAgentActivity(text) {
  const activityDiv = document.getElementById('agent-activity');
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.textContent = text;
  activityDiv.insertBefore(item, activityDiv.firstChild);
}

function addToolUsage(toolName) {
  const toolsDiv = document.getElementById('tools-used');
  const item = document.createElement('div');
  item.className = 'tool-item';
  item.textContent = toolName;
  toolsDiv.insertBefore(item, toolsDiv.firstChild);
}
```

### 3.4 Styling
**File:** `src/web/public/styles.css`

```css
:root {
  --bg-dark: #1a1a1a;
  --bg-card: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --accent: #6366f1;
  --border: #3a3a3a;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-dark);
  color: var(--text-primary);
  line-height: 1.6;
}

/* Landing Page */
.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  text-align: center;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.25rem;
  margin-bottom: 3rem;
}

.prompt-container {
  max-width: 700px;
  margin: 0 auto 4rem;
  display: flex;
  gap: 1rem;
}

#prompt-input {
  flex: 1;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
}

button {
  padding: 1rem 2rem;
  font-size: 1rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

button:hover {
  opacity: 0.9;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  max-width: 1000px;
  margin: 2rem auto 0;
}

.template-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.template-card .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.template-card h4 {
  margin-bottom: 0.5rem;
}

.template-card p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Dashboard */
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  height: 100vh;
}

.sidebar {
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  padding: 2rem;
}

.main-panel {
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.conversation-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

#messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.message {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
  max-width: 80%;
}

.message-user {
  background: var(--accent);
  margin-left: auto;
}

.message-assistant {
  background: var(--bg-card);
}

.input-container {
  display: flex;
  gap: 1rem;
}

#chat-input {
  flex: 1;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
}

.info-panel {
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  padding: 2rem;
  overflow-y: auto;
}

.activity-item, .tool-item {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: var(--bg-dark);
  border-radius: 4px;
  font-size: 0.9rem;
}
```

---

## 🔌 Phase 4: API Integration

### 4.1 Agent API Endpoint
**File:** `src/web/api/agents.ts`

```typescript
import { Request, Response } from 'express';
import { MasterOrchestrator } from '../../agents/master-orchestrator.js';
import { sessionManager } from '../../lib/sessions.js';

export async function handleAgentQuery(req: Request, res: Response) {
  try {
    const { prompt, sessionId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    // Get or create session
    let session = sessionId ? sessionManager.getSession(sessionId) : null;
    if (!session) {
      session = sessionManager.createSession();
    }

    // Create orchestrator for this session with conversation history
    const orchestrator = new MasterOrchestrator(
      session.id,
      session.conversationHistory
    );

    // Process query through master orchestrator
    const { messages, events } = await orchestrator.processQuery(prompt);

    // Update session history
    sessionManager.updateHistory(session.id, messages);

    // Return response with agent activity
    res.json({
      success: true,
      sessionId: session.id,
      messages: messages.map(msg => ({
        type: msg.type,
        text: msg.text,
        name: msg.name,
      })),
      events: events.map(evt => ({
        type: evt.type,
        timestamp: evt.timestamp,
        agentName: evt.agentName,
        toolName: evt.toolName,
      })),
    });

  } catch (error: any) {
    console.error('Agent query error:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message
    });
  }
}

export function handleAgentStatus(req: Request, res: Response) {
  const { sessionId } = req.query;

  const session = sessionId ? sessionManager.getSession(sessionId as string) : null;

  res.json({
    agents: [
      { id: 'finance', name: 'Finance Agent', status: 'ready' },
      { id: 'research', name: 'Research Agent', status: 'ready' },
      { id: 'notes', name: 'Notes Agent', status: 'ready' },
    ],
    conversationLength: session?.conversationHistory.length || 0,
    sessionActive: !!session,
  });
}
```

### 4.2 Update Server
**File:** `src/web/server.ts` (full version)

```typescript
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAgentQuery, handleAgentStatus } from './api/agents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/agents/query', handleAgentQuery);
app.get('/api/agents/status', handleAgentStatus);

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 AI Agent Platform running on http://localhost:${PORT}\n`);
  console.log('📝 Test with these queries:');
  console.log('   - "Analyze my recent spending"');
  console.log('   - "Research the latest in AI agents"');
  console.log('   - "What notes do I have?"');
  console.log('');
});
```

---

## 📦 Phase 5: Package Updates

### 5.1 Update package.json

Add new scripts:
```json
{
  "scripts": {
    "web": "tsx src/web/server.ts",
    "dev": "tsx watch src/web/server.ts",
    "build:web": "tsc && cp -r src/web/public dist/web/"
  }
}
```

Add dependencies:
```bash
npm install express cors
npm install -D @types/express @types/cors
```

---

## 🧪 Phase 6: Testing & Validation

### Test Scenarios

1. **Basic Query**
   - Input: "What's in my notes?"
   - Expected: Master uses `notes` agent, calls `get_user_notes` tool
   
2. **Finance Analysis**
   - Input: "Analyze my spending this week"
   - Expected: Master delegates to `finance` agent, which may use `budget-analyzer` subagent
   
3. **Research Task**
   - Input: "Research Claude Agent SDK best practices"
   - Expected: Master delegates to `research` agent, uses `WebSearch` and `web-researcher` subagent
   
4. **Cross-Agent Task**
   - Input: "Find my highest expenses and search for cheaper alternatives"
   - Expected: Master uses `finance` agent for transactions, then `research` agent for alternatives
   
5. **Memory Test**
   - First: "My name is Alice"
   - Then: "What's my name?"
   - Expected: Agent remembers from conversation history

---

## 🎯 Success Criteria

- [ ] Web UI loads and accepts input
- [ ] Master orchestrator successfully delegates to subagents
- [ ] Can observe which agents/subagents are activated in UI
- [ ] Tools are called appropriately (visible in logs/UI)
- [ ] Conversation memory persists within session
- [ ] Mock data is successfully accessed via MCP server
- [ ] Multiple agent types can be tested

---

## 🚧 Known Issues & Solutions

### 1. **SDK Type Corrections Applied**
**Issue:** Initial plan had incorrect SDK types based on assumptions.

**Solution:**
- ✅ Fixed hook event names: `'PreToolUse'`, `'PostToolUse'`, `'PreCompact'` (PascalCase)
- ✅ Fixed hook input structure: use `hook_event_name`, `tool_name`, `tool_input`
- ✅ Fixed AgentDefinition: `prompt` (not `instructions`), `tools` (not `allowedTools`)
- ✅ Added systemPrompt preset: `{ type: 'preset', preset: 'claude_code', append: '...' }`
- ✅ Added TaskOutput metric tracking: `usage`, `cost_usd`, `duration_ms`

### 2. **Agent Delegation Requires Task Tool**
**Issue:** The `agents` option makes agents available but doesn't trigger automatic delegation.

**Solution:**
- Master orchestrator must use the `Task` tool explicitly to delegate
- Include clear instructions about when to use Task tool
- Monitor `'PreToolUse'` hook (PascalCase) to detect Task tool usage
- Phase 0 testing validates this behavior

### 3. **Context Management & Compaction**
**Issue:** Long conversations will hit context limits without compaction.

**Solution:**
- Set `maxTurns: 50` to limit conversation length
- Implement `compactionHook` to monitor and trigger compaction
- Use `'PreCompact'` event (PascalCase) to track when compaction occurs
- Track compaction trigger type: `'manual'` or `'auto'`
- Subagents help by returning only relevant info, not full context

### 4. **Session Management**
**Issue:** In-memory session storage doesn't persist across server restarts.

**Solution:**
- Use Map-based session storage with UUIDs
- Implement stale session cleanup (1 hour timeout)
- For production: migrate to Redis or database

### 5. **Event Tracking**
**Issue:** Hook events don't include `subagent_start` - need to infer from Task tool usage.

**Solution:**
- Monitor `'PreToolUse'` hook (PascalCase) for Task tool calls
- Extract `subagent_type` from `tool_input` (AgentInput type)
- Use `'PostToolUse'` to capture TaskOutput metrics
- Manually create agent_delegation events with metrics

### 6. **Response Timeouts**
**Issue:** Long agent tasks may timeout HTTP requests.

**Solution:**
- Set 60s timeout for agent queries
- Add loading indicators in UI
- Future: Add SSE streaming for real-time updates

### 7. **Error Handling**
**Solution:**
- Wrap all agent calls in try-catch
- Return user-friendly error messages
- Log detailed errors server-side
- Add error boundaries in client code

---

## 📈 Future Enhancements (Post-MVP)

Once core orchestration is proven:

1. **WebSocket Streaming** - Real-time message streaming
2. **Persistent Database** - PostgreSQL for conversation history
3. **Real Auth** - Clerk/Auth0 integration
4. **Real MCP Servers** - Plaid, Gmail, etc.
5. **Agent Monitoring** - Detailed analytics dashboard
6. **Multi-user Support** - Proper user isolation
7. **Agent Marketplace** - Let users share/import agent configs
8. **Mobile UI** - Responsive design + PWA

---

## 🏃‍♂️ Quick Start Commands

```bash
# 1. Install new dependencies
npm install express cors
npm install -D @types/express @types/cors

# 2. Run the web server
npm run web

# 3. Open browser
open http://localhost:3000

# 4. Test with queries in the UI
```

---

## 📝 Implementation Order

**Phase 0: Validation**
1. Create test-delegation.ts
2. Validate agent delegation mechanics
3. Confirm hook events and tool access
4. Document findings

**Phase 1: Infrastructure**
5. Set up Express server
6. Create session management
7. Create mock data files
8. Build user-data MCP server

**Phase 2: Agent System**
9. Set up file-based data storage (data/notes, data/transactions, data/calendar)
10. Define agent configurations with agent loop principles
11. Implement MasterOrchestrator with Task tool support and compaction
12. Add verification tools for each agent
13. Add event tracking via hooks
14. Test orchestrator with simple queries and verify compaction works

**Phase 2.5: Verification & Testing**
15. Implement verification tools for each agent type
16. Add code generation for finance calculations
17. Test agentic search with Grep/Glob patterns
18. Validate subagent parallelization
19. Test context management and compaction
20. Add cost tracking (see `guides/cost-tracking.md`)
21. Create representative test cases based on usage patterns

**Phase 3: Web Interface**
21. Build landing page HTML/CSS
22. Create dashboard UI
23. Add client-side JavaScript

**Phase 4: API Integration**
24. Connect API endpoints
25. Wire up session management
26. Add error handling

**Phase 5: End-to-End Testing**
27. Test all agent types with real scenarios
28. Validate delegation flow and parallelization
29. Test conversation memory and compaction
30. Test verification loops (agents fixing their own errors)
31. Measure performance and context usage
32. Build representative test set for continuous evaluation
33. Refine based on results

---

## 🎓 Key Learnings to Extract (Aligned with Anthropic's Guide)

As we build this MVP, focus on understanding:

### Agent Loop Effectiveness
1. **Gather Context**: How well does agentic search (Grep/Glob) work vs. semantic search?
2. **Take Action**: When does Claude choose code generation vs. direct tool calls?
3. **Verify Work**: How often do agents self-correct? What verification methods work best?

### Delegation Patterns
4. **Subagent usage**: When does Claude delegate vs. handle directly?
5. **Parallelization**: Can we effectively run multiple subagents simultaneously?
6. **Context isolation**: How much context reduction do subagents provide?

### Context Management
7. **Compaction behavior**: When does compaction trigger? How effective is it?
8. **File system as context**: Is storing data as files better than in-memory?
9. **Tool vs. bash**: When does Claude prefer custom tools vs. bash scripts?

### Performance & Reliability
10. **Multi-agent latency**: How long does orchestration with subagents take?
11. **Verification loops**: Do agents successfully fix their own errors?
12. **Code generation quality**: Are generated scripts reliable and reusable?

These insights will inform the production architecture and validate Anthropic's guidance.

---

## 🤝 Next Steps

**Immediate:**

1. Review and approve updated plan
2. Create test-delegation.ts (Phase 0)
3. Run validation tests
4. Adjust architecture based on findings

**Then:**

5. Proceed with iterative implementation
6. Test each component as we build
7. Adjust based on what we learn

Ready to start with Phase 0 validation! 🚀

