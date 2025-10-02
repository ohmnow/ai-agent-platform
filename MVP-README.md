# AI Agent Platform MVP

Multi-agent orchestration system built with Claude Agent SDK, following Anthropic's best practices.

## 🎯 Overview

This MVP demonstrates a complete multi-agent system with:
- **Master Orchestrator** that coordinates specialized agents
- **Finance Agent** for spending analysis and budget tracking
- **Research Agent** for web research and fact-checking
- **Notes Agent** for knowledge management
- **Web Interface** for user interaction
- **Session Management** with conversation history
- **File-Based Storage** for agentic search

## 🏗️ Architecture

```
User → Web Interface → Express API → Master Orchestrator
                                            ↓
                              ┌─────────────┼─────────────┐
                              ↓             ↓             ↓
                        Finance Agent  Research Agent  Notes Agent
                              ↓             ↓             ↓
                        MCP Servers    WebSearch    File System
```

### Key Design Decisions

1. **Streaming Input Mode**: Required for MCP server compatibility
2. **File-Based Context**: Enables powerful grep/glob agentic search
3. **Code Generation**: Precise, composable calculations
4. **Task Tool**: Explicit delegation (Phase 0 revealed automatic delegation doesn't work reliably)
5. **Session Persistence**: UUID-based with in-memory storage

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Anthropic API key in `.env` file

### Installation

```bash
# Already installed dependencies
npm install

# Start the web server
npm run server
```

### Access the Platform

- **Landing Page**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard.html
- **API Status**: http://localhost:3000/api/agents/status

## 📁 Project Structure

```
src/
├── test/
│   ├── test-delegation.ts          # Phase 0 validation tests
│   └── test-orchestrator.ts        # Orchestrator tests
├── lib/
│   └── sessions.ts                 # Session management
├── data/                           # File-based storage (agentic search)
│   ├── notes/
│   │   ├── meeting-notes-2025-10-01.md
│   │   └── ideas-2025-09-28.md
│   ├── transactions/
│   │   └── 2025-10.csv
│   └── calendar/
│       └── events.json
├── agents/
│   ├── master-orchestrator.ts      # Coordinates all agents
│   ├── finance-agent.ts            # Financial analysis
│   ├── research-agent.ts           # Web research
│   └── notes-agent.ts              # Knowledge management
├── mcp-servers/
│   └── user-data-server.ts         # Custom MCP tools
├── web/
│   ├── server.ts                   # Express server
│   ├── public/
│   │   ├── index.html              # Landing page
│   │   ├── dashboard.html          # Agent dashboard
│   │   ├── styles.css              # Styling
│   │   └── app.js                  # Client-side JS
│   └── api/
│       └── agents.ts               # API endpoints
└── mock/
    └── users.ts                    # Mock user data
```

## 🧪 Testing

### Run Validation Tests

```bash
# Phase 0: SDK validation tests
npm run test:delegation

# Orchestrator integration test
npm run test:orchestrator
```

### Test Scenarios

1. **Financial Query**: "How much did I spend on Food in October 2025?"
2. **Research Query**: "Research the latest trends in AI agents"
3. **Notes Query**: "What notes do I have about Q1 planning?"

## 🔑 Key Features Implemented

### Phase 0: Validation ✅
- SDK type validation (PascalCase hook events, AgentDefinition structure)
- Delegation testing (Task tool behavior)
- Session management verification
- Streaming input mode validation

### Phase 1: Core Infrastructure ✅
- Session management with UUID and cleanup
- File-based data storage (notes, transactions, calendar)
- Mock user system

### Phase 2: Agent System ✅
- Master Orchestrator with streaming input
- Finance, Research, and Notes agents
- MCP server with code generation tools
- Hook-based event tracking
- Compaction support

### Phase 3: Web Interface ✅
- Landing page with templates
- Interactive dashboard
- Real-time agent activity tracking
- Session persistence

### Phase 4: API Integration ✅
- Express server with CORS
- Agent query endpoint
- Status endpoint
- Error handling

## 📝 Phase 0 Key Findings

From validation tests, we learned:

1. **Hook Events**: Use PascalCase (`'PreToolUse'`, not `'preToolUse'`)
2. **Hook Input Structure**: Use `hook_event_name`, `tool_name`, `tool_input` (flat properties)
3. **Task Tool Delegation**: Not automatic - requires explicit instructions to Claude
4. **Streaming Input**: Required for MCP servers (async generator, not simple strings)
5. **Session IDs**: Available from `system` messages with `subtype: 'init'`

## 🎓 Best Practices Applied

### From Anthropic's Guide

1. **Agent Loop**: gather context → take action → verify work → repeat
2. **Agentic Search**: Use file system + grep/glob instead of loading all data
3. **Code Generation**: Generate Python for calculations (precise & reusable)
4. **Subagents**: Use Task tool for delegation, isolates context
5. **Compaction**: Auto-summarizes conversation at context limits

### SDK Alignment

- System prompt extends Claude Code preset
- `settingSources: ['project']` for CLAUDE.md files
- MCP tool naming: `mcp__{server-name}__{tool-name}`
- TaskOutput metrics tracking (usage, cost, duration)

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```bash
ANTHROPIC_API_KEY=your_api_key_here
PORT=3000
```

### Agent Descriptions

Agents use directive language for better delegation:
- Finance: "MUST BE USED for financial analysis..."
- Research: "PROACTIVELY invoke when user asks questions..."
- Notes: "Use for accessing notes, calendar..."

## 🐛 Known Limitations

1. **Delegation Reliability**: Task tool not always automatically invoked (Phase 0 finding)
2. **Hook Events**: Not firing consistently in current tests
3. **Session Storage**: In-memory only (lost on server restart)
4. **No Authentication**: Mock user system only
5. **No Database**: File-based storage only

## 🚀 Future Enhancements

### Phase 2.5: Verification (Planned)
- Verification tools for each agent
- Cost tracking implementation
- Representative test cases
- Self-correction loops

### Production Readiness
- Redis for session storage
- Real authentication system
- Database integration
- Streaming responses (SSE)
- Permission system
- Error recovery
- Monitoring & logging

## 📚 Reference Documentation

- `docs/plan.md` - Complete implementation plan
- `docs/guides/` - SDK feature guides
  - `subagents.md` - Delegation patterns
  - `custom-tools.md` - MCP server creation
  - `sessions.md` - Session management
  - `cost-tracking.md` - Usage tracking

## 🤝 Contributing

This is an MVP demonstrating Anthropic's best practices for multi-agent systems. To extend:

1. Add new agents in `src/agents/`
2. Create custom MCP tools in `src/mcp-servers/`
3. Follow the agent loop pattern
4. Use file-based storage for context
5. Test with Phase 0 methodology

## 📄 License

MIT

## 🙏 Acknowledgments

Built following guidance from:
- Anthropic's "Building Agents with the Claude Agent SDK"
- Claude Agent SDK Documentation
- Phase 0 validation findings
