# Agentcomm Product Roadmap

## Product Vision Analysis

**Goal:** Multi-agent productivity platform with command center dashboard for specialized AI agents

**Current State:**
- ✅ Basic agent orchestration working
- ✅ SSE streaming implemented
- ✅ Permission system functional
- ✅ Database-backed tools (sub-10ms)
- ✅ MCP server integration
- ✅ Claude Code automation for PR development

**Gap:** Need to build command center UI, scheduling, integrations, and user management

---

## Strategic Prioritization Framework

### P0 (Core Infrastructure) - **Build Now**
Critical foundation that everything depends on. Block all other work.

### P1 (Integration Points) - **Build Architecture, Stub Implementation**
Key integration points we control. Build interfaces now, let Claude Code implement via PRs.

### P2 (Feature Development) - **Delegate to Claude Code PRs**
Features that can be built independently once infrastructure exists.

### P3 (Nice-to-Have) - **Future Iterations**
Enhancement features for post-MVP.

---

## Feature Breakdown by Priority

### 🔴 P0: Core Infrastructure (Build Now - Week 1)

These are architectural decisions and core systems we must build ourselves:

#### 1. Multi-Agent Architecture ✅ (DONE)
- [x] Orchestrator agent routing
- [x] Subagent delegation via Task tool
- [x] Finance agent with database access
- [x] Research agent
- [x] Notes agent

#### 2. Real-Time Communication ✅ (DONE)
- [x] SSE streaming setup
- [x] Permission system with in-chat approval
- [x] Session management

#### 3. Database Architecture (PARTIAL - Complete Now)
- [x] Prisma + SQLite setup
- [x] Transaction data model
- [ ] User model with preferences
- [ ] Agent workspace storage model
- [ ] Task/schedule model
- [ ] Conversation history model

**Action:** Create database schema PR for core models

#### 4. Authentication & User Management (NEW - Build Now)
- [ ] User signup/login system
- [ ] User profile with goals/interests
- [ ] Agent preferences per user
- [ ] Multi-user session management

**Action:** Choose auth system (Clerk/Auth0/custom) and implement

#### 5. API Architecture (NEW - Build Now)
- [ ] RESTful API for dashboard
- [ ] WebSocket/SSE for real-time updates
- [ ] Agent status endpoints
- [ ] Task queue endpoints

**Action:** Design and implement core API layer

---

### 🟡 P1: Integration Points (Build Interfaces, Stub Implementation - Week 1-2)

Build the integration layer ourselves, let Claude Code implement the details:

#### 6. Command Center Dashboard (Interface Only)
**We build:**
- [ ] Dashboard layout structure
- [ ] Agent card component architecture
- [ ] Real-time data connection (WebSocket/SSE)
- [ ] State management setup (React Query/Zustand)

**Claude Code implements:**
- Visual design
- Individual component styling
- Data visualization charts
- Animations/polish

**Action:** Create dashboard-foundation PR with component stubs

#### 7. Task Scheduling System (Architecture Only)
**We build:**
- [ ] Cron-like scheduler architecture
- [ ] Task queue data model
- [ ] Job runner interface
- [ ] Notification system hooks

**Claude Code implements:**
- Cron parser logic
- Job execution engine
- Retry/failure handling
- Notification templates

**Action:** Create scheduler-architecture PR with TODO comments

#### 8. External Integration Framework (Interfaces Only)
**We build:**
- [ ] Plaid integration interface/types
- [ ] Brokerage API interface/types
- [ ] MCP server configuration
- [ ] OAuth flow structure

**Claude Code implements:**
- Plaid API calls
- Brokerage API implementations
- Error handling
- Data transformation

**Action:** Create integration-interfaces PR

#### 9. Agent Workspace System (Architecture Only)
**We build:**
- [ ] Workspace isolation model
- [ ] File storage strategy (per-agent directories)
- [ ] Memory persistence interface
- [ ] CLAUDE.md template structure

**Claude Code implements:**
- File I/O operations
- Memory serialization
- Workspace cleanup
- Template generation

**Action:** Create workspace-system PR

---

### 🟢 P2: Feature Development (Delegate to Claude Code - Week 2-3)

Full implementation via Claude Code PRs:

#### 10. Budget Analyzer ✅ (PR #3 - In Progress)
- [x] PR created with stubs
- [ ] Claude implementing database schema
- [ ] Claude implementing MCP tools
- [ ] Claude implementing analysis logic

#### 11. Pattern Detection ✅ (PR #4 - In Progress)
- [x] PR created with stubs
- [ ] Claude implementing algorithms
- [ ] Claude implementing tests

#### 12. Investing Agent (NEW - Claude Code PR)
- Market data integration
- Portfolio tracking
- Price checks
- Investment research tools

#### 13. Enhanced Finance Agent (NEW - Claude Code PR)
- Plaid integration for real bank data
- Spending analysis improvements
- Budget recommendations
- Trend visualization data

#### 14. Onboarding Flow (NEW - Claude Code PR)
- Signup form
- Goal collection
- Agent preference selection
- Workspace initialization

#### 15. Notification System (NEW - Claude Code PR)
- Email notifications
- In-app alerts
- Notification preferences
- Alert triggers

---

### 🔵 P3: Enhancements (Post-MVP - Week 4+)

#### 16. Advanced Dashboard Features
- Custom widgets
- Drag-and-drop layout
- Dashboard templates
- Export/sharing

#### 17. Agent Marketplace
- Community-created agents
- Agent templates
- Publishing workflow

#### 18. Mobile App
- React Native implementation
- Push notifications
- Mobile-optimized UX

#### 19. Collaboration Features
- Shared agents
- Team workspaces
- Agent results sharing

---

## Recommended Implementation Plan

### Phase 1: Core Infrastructure (This Week)
**We build manually:**
1. Complete database schema (users, workspaces, tasks, conversations)
2. Implement authentication system
3. Build core API layer
4. Set up dashboard foundation

**Output:** Solid foundation for all features

### Phase 2: Integration Points (Week 2)
**We build interfaces, Claude Code implements:**
1. Dashboard component stubs → PR for Claude
2. Scheduler architecture → PR for Claude
3. Integration interfaces → PR for Claude
4. Workspace system → PR for Claude

**Output:** All integration points defined, Claude filling in implementation

### Phase 3: Feature Development (Week 2-3)
**Claude Code builds via PRs:**
1. Complete Budget Analyzer (PR #3)
2. Complete Pattern Detection (PR #4)
3. Investing Agent (new PR)
4. Enhanced Finance Agent (new PR)
5. Onboarding flow (new PR)

**Output:** Feature-complete MVP

### Phase 4: Polish & Testing (Week 3-4)
1. Integration testing
2. End-to-end testing
3. Performance optimization
4. UI/UX polish

---

## Resource Allocation Strategy

### You (Manual Work)
- Database schema design
- Authentication setup
- Core API architecture
- Integration point definitions
- PR review and merging

### Claude Code (Automated PRs)
- Feature implementation
- Test coverage
- Component styling
- Algorithm implementation
- Documentation

### Benefits of This Approach
1. **Speed:** Parallel development (you + Claude Code)
2. **Quality:** You control architecture, Claude handles implementation
3. **Focus:** You work on high-leverage decisions
4. **Scale:** Claude can work on multiple PRs simultaneously
5. **Learning:** Claude's implementations become codebase patterns

---

## Success Metrics

### Week 1 Goals
- [ ] Complete database schema
- [ ] Authentication working
- [ ] Core API endpoints functional
- [ ] Dashboard foundation deployed

### Week 2 Goals
- [ ] All integration interfaces defined
- [ ] 4+ Claude Code PRs merged
- [ ] Scheduler architecture complete
- [ ] Basic dashboard showing agent status

### Week 3 Goals
- [ ] All P2 features implemented
- [ ] End-to-end workflow functional
- [ ] Integration tests passing
- [ ] Ready for beta users

---

## Decision Points

### Immediate Decisions Needed
1. **Auth System:** Clerk vs Auth0 vs Custom?
2. **Frontend Framework:** Next.js vs React + Express?
3. **Dashboard Library:** Recharts vs Chart.js vs D3?
4. **Deployment:** Vercel vs Railway vs AWS?
5. **Database:** Keep SQLite or migrate to Postgres?

### Can Defer
- Mobile app platform
- Agent marketplace design
- Collaboration features
- Payment/pricing model

---

## Next Actions

### Recommended Next Steps (in order):
1. **Review this roadmap** - Align on priorities
2. **Make technology decisions** - Auth, frontend, deployment
3. **Create P0 PRs** - Database schema, auth setup
4. **Build core API** - Manual implementation
5. **Create P1 stub PRs** - Let Claude Code implement
6. **Monitor Claude's work** - Review and merge PRs
7. **Integrate and test** - Bring it all together

### First PR to Create Manually:
**"Core Database Schema & User Management"**
- Complete Prisma schema
- User model with preferences
- Agent workspace model
- Task/schedule model
- Conversation history model

This unblocks everything else.

---

## Questions for Alignment

1. Timeline expectations? (Realistic: 3-4 weeks for solid MVP)
2. MVP scope? (Minimal = Finance + Dashboard, Full = All agents)
3. Solo project or planning to add devs?
4. Deployment preference? (Vercel simplest for Next.js)
5. Auth preference? (Clerk easiest, most features out-of-box)
