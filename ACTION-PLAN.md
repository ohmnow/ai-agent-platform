# Action Plan to Complete MVP

**Current Status**: 75% Complete (Functional but Missing Observability)
**Target**: 100% Complete MVP with Full Event Tracking & Verification
**Estimated Time**: 6-9 hours

---

## Phase 1: Critical Blockers (HIGH PRIORITY)

### 1.1 Debug Hook Event Tracking ⚠️ BLOCKER
**Duration**: 1-2 hours
**Status**: PENDING
**Priority**: CRITICAL

**Problem**:
- Hooks are registered and properly structured
- Events should be captured in `this.events` array
- Events are NOT appearing in API response or UI sidebars

**Debug Steps**:

1. **Add comprehensive logging to master-orchestrator.ts**
   ```typescript
   private activityTracker(input: HookInput) {
     console.log('🔍 HOOK FIRED:', input.hook_event_name);
     console.log('🔍 Current events count:', this.events.length);

     if (input.hook_event_name === 'PreToolUse') {
       // existing code
       console.log('🔍 Event added. New count:', this.events.length);
     }
   }
   ```

2. **Verify events array after query execution**
   ```typescript
   async processQuery(userPrompt: string) {
     // ... existing code ...

     console.log('🔍 Query complete. Total events captured:', this.events.length);
     console.log('🔍 Events:', JSON.stringify(this.events, null, 2));

     return { messages, events: this.events, sessionId: capturedSessionId };
   }
   ```

3. **Check API endpoint is receiving events**
   ```typescript
   // In src/web/api/agents.ts
   export async function handleAgentQuery(req: Request, res: Response) {
     const { messages, events, sessionId: capturedSessionId } = await orchestrator.processQuery(prompt);

     console.log('🔍 API received events:', events.length);
     console.log('🔍 Events:', JSON.stringify(events, null, 2));

     // ... rest of handler
   }
   ```

4. **Test with minimal query setup**
   - Create `src/test/test-hooks.ts`
   - Test hooks without MCP servers
   - Test hooks without streaming input
   - Isolate the issue

**Expected Outcome**: Identify where events are being lost

**Success Criteria**:
- Console shows "HOOK FIRED" messages
- Events array populates during query
- Events appear in API response JSON

---

### 1.2 Verify Agent Delegation
**Duration**: 30 minutes
**Status**: PENDING
**Priority**: HIGH
**Depends On**: 1.1 (Hook debugging)

**Problem**: Cannot confirm if Task tool is being invoked or if master is answering directly

**Tasks**:

1. **Add explicit Task tool logging**
   ```typescript
   // In master-orchestrator.ts, add to allowedTools hook check
   if (preToolInput.tool_name === 'Task') {
     console.log('✅ TASK TOOL INVOKED');
     console.log('   Subagent:', taskInput.subagent_type);
     console.log('   Description:', taskInput.description);
   }
   ```

2. **Test with explicit delegation prompt**
   ```
   Query: "Use the finance agent to analyze my spending in October 2025"
   ```
   - This SHOULD trigger Task tool usage
   - If it doesn't, delegation is broken

3. **Add delegation counter**
   ```typescript
   private delegationCount = 0;

   // In activityTracker
   if (preToolInput.tool_name === 'Task') {
     this.delegationCount++;
     console.log(`📊 Total delegations this session: ${this.delegationCount}`);
   }
   ```

**Success Criteria**:
- Console shows "TASK TOOL INVOKED" for finance queries
- Delegation events captured with correct subagent_type
- Can confirm master is NOT answering financial queries directly

---

### 1.3 Fix Event Forwarding to UI
**Duration**: 30 minutes
**Status**: PENDING
**Priority**: HIGH
**Depends On**: 1.1, 1.2

**Problem**: Events may be generated but not reaching frontend

**Tasks**:

1. **Verify API response structure**
   - Check `/api/agents/query` response in browser DevTools
   - Confirm `events` array is populated in JSON
   - Validate event structure matches frontend expectations

2. **Add client-side logging**
   ```javascript
   // In app.js sendMessage()
   const data = await response.json();
   console.log('📥 Received data:', data);
   console.log('📥 Events count:', data.events?.length);
   console.log('📥 Events:', data.events);
   ```

3. **Fix event display logic if needed**
   ```javascript
   // Ensure events are being processed
   if (data.events && data.events.length > 0) {
     console.log('✅ Processing events...');
     data.events.forEach(evt => {
       console.log('  Event:', evt.type, evt);
       if (evt.type === 'agent_delegation') {
         addAgentActivity(`🤖 Using ${evt.agentName} agent`);
       }
       // ... rest of logic
     });
   } else {
     console.warn('⚠️ No events received');
   }
   ```

**Success Criteria**:
- Browser console shows events array
- Activity sidebar populates with delegation events
- Tools Used sidebar shows tool names

---

## Phase 2: UX Improvements (MEDIUM PRIORITY)

### 2.1 Implement Server-Sent Events (SSE) Streaming
**Duration**: 2-3 hours
**Status**: PENDING
**Priority**: MEDIUM

**Problem**: Queries take 100+ seconds with no feedback ("Thinking..." spinner only)

**Architecture**:
```
Client (EventSource) → SSE Endpoint → Master Orchestrator → Stream Events → Client Updates UI
```

**Tasks**:

1. **Create SSE endpoint** (`src/web/api/stream.ts`)
   ```typescript
   export async function handleStreamQuery(req: Request, res: Response) {
     res.writeHead(200, {
       'Content-Type': 'text/event-stream',
       'Cache-Control': 'no-cache',
       'Connection': 'keep-alive'
     });

     const { prompt, sessionId } = req.body;

     // ... session logic ...

     const orchestrator = new MasterOrchestrator(session.id, session.conversationHistory);

     // Stream events as they occur
     for await (const event of orchestrator.streamQuery(prompt)) {
       res.write(`data: ${JSON.stringify(event)}\n\n`);
     }

     res.end();
   }
   ```

2. **Add streaming method to MasterOrchestrator**
   ```typescript
   async *streamQuery(userPrompt: string) {
     // Yield initial event
     yield { type: 'start', timestamp: new Date() };

     // Stream messages as they arrive
     for await (const message of result) {
       yield { type: 'message', message };

       // Yield events as hooks fire
       if (this.events.length > 0) {
         yield { type: 'event', event: this.events[this.events.length - 1] };
       }
     }

     yield { type: 'complete', timestamp: new Date() };
   }
   ```

3. **Update frontend to use EventSource** (`app.js`)
   ```javascript
   async function sendMessage(prompt) {
     const eventSource = new EventSource('/api/agents/stream');

     eventSource.onmessage = (event) => {
       const data = JSON.parse(event.data);

       if (data.type === 'message') {
         // Update chat with new message
       } else if (data.type === 'event') {
         // Update sidebar with event
       } else if (data.type === 'complete') {
         eventSource.close();
       }
     };
   }
   ```

4. **Add progressive UI updates**
   - Show "Searching files..." when Grep/Glob used
   - Show "Delegating to finance agent..." when Task tool invoked
   - Show "Analyzing data..." during code execution
   - Show "Verifying results..." during verification

**Success Criteria**:
- Real-time updates appear in UI during query processing
- No more 100-second "Thinking..." wait
- User sees what the system is doing step-by-step

---

### 2.2 Add Cost Tracking UI
**Duration**: 1 hour
**Status**: PENDING
**Priority**: MEDIUM
**Depends On**: 1.1 (Hook events must work)

**Problem**: Backend captures cost metrics, but no UI display

**Tasks**:

1. **Add cost display section to dashboard.html**
   ```html
   <div class="cost-panel">
     <h3>💰 Session Cost</h3>
     <div id="cost-display">
       <div class="cost-row">
         <span>Input Tokens:</span>
         <span id="input-tokens">0</span>
       </div>
       <div class="cost-row">
         <span>Output Tokens:</span>
         <span id="output-tokens">0</span>
       </div>
       <div class="cost-row">
         <span>Total Cost:</span>
         <span id="total-cost">$0.00</span>
       </div>
     </div>
   </div>
   ```

2. **Add cost aggregation function** (`app.js`)
   ```javascript
   let sessionCost = {
     inputTokens: 0,
     outputTokens: 0,
     totalCost: 0
   };

   function updateCostDisplay(events) {
     events.forEach(evt => {
       if (evt.type === 'agent_complete' && evt.usage) {
         sessionCost.inputTokens += evt.usage.input_tokens;
         sessionCost.outputTokens += evt.usage.output_tokens;
         sessionCost.totalCost += evt.cost_usd || 0;
       }
     });

     document.getElementById('input-tokens').textContent =
       sessionCost.inputTokens.toLocaleString();
     document.getElementById('output-tokens').textContent =
       sessionCost.outputTokens.toLocaleString();
     document.getElementById('total-cost').textContent =
       `$${sessionCost.totalCost.toFixed(4)}`;
   }
   ```

3. **Add per-agent cost breakdown**
   - Track cost by agent type (finance, research, notes)
   - Show which agents are most expensive
   - Display cache hit rates if available

**Success Criteria**:
- Cost updates in real-time as queries complete
- Accurate token counts displayed
- Cost persists across page refreshes (stored in session)

---

## Phase 3: Verification & Testing (MEDIUM PRIORITY)

### 3.1 Integrate Verification Tools
**Duration**: 1 hour
**Status**: PENDING
**Priority**: MEDIUM

**Problem**: Verification tools defined but not used by agents

**Tasks**:

1. **Add verify_finance_calculations to finance agent tools**
   ```typescript
   // In finance-agent.ts
   export const financeAgentConfig: AgentDefinition = {
     // ... existing config ...
     tools: [
       'Bash', 'Read', 'Write', 'Grep', 'Glob',
       'mcp__user-data__analyze_transactions_code',
       'mcp__user-data__create_budget_rule',
       'mcp__user-data__verify_finance_calculations', // ADD THIS
       'WebSearch', 'Task'
     ],
   };
   ```

2. **Update agent prompt to use verification**
   ```typescript
   prompt: `You are a personal finance assistant following the agent loop...

   ## Verify Work
   - ALWAYS use verify_finance_calculations tool to check your calculations
   - Compare verification results to your analysis
   - If discrepancies found, regenerate code and re-analyze
   - Only return results after verification passes

   Example verification flow:
   1. Generate code to analyze spending
   2. Execute code and get results
   3. Use verify_finance_calculations with the results
   4. If verification fails, debug and retry
   5. Return verified results to user
   `
   ```

3. **Test self-correction loop**
   - Query: "How much did I spend on Food?"
   - Verify finance agent uses verification tool
   - Check if agent retries on verification failure

**Success Criteria**:
- Finance agent calls verify_finance_calculations after every analysis
- Verification passes for accurate calculations
- Agent retries when verification fails

---

### 3.2 Test Parallel Subagent Execution
**Duration**: 30 minutes
**Status**: PENDING
**Priority**: LOW

**Problem**: Budget-analyzer subagent exists but never tested in parallel

**Tasks**:

1. **Create test query requiring multiple agents**
   ```
   Query: "Analyze my October spending AND create a budget for November
          AND research best budgeting strategies"
   ```
   - Should invoke: finance, budget-analyzer (parallel), research

2. **Verify parallel execution**
   - Check console logs for simultaneous Task tool invocations
   - Verify TaskOutput metrics for multiple subagents
   - Confirm results are synthesized correctly

3. **Add parallelization test to test suite**
   ```typescript
   // src/test/test-parallel-agents.ts
   const result = await orchestrator.processQuery(`
     I need three things:
     1. My spending analysis for October
     2. A budget plan for November
     3. Research on zero-based budgeting
   `);

   // Verify 3 separate Task tool invocations
   // Verify results include all three components
   ```

**Success Criteria**:
- Multiple Task tools invoked in same query
- Agents run in parallel (not sequential)
- Results combined coherently

---

### 3.3 Test Context Compaction
**Duration**: 30 minutes
**Status**: PENDING
**Priority**: LOW

**Problem**: PreCompact hook implemented but never triggered

**Tasks**:

1. **Create long conversation test**
   ```typescript
   // src/test/test-compaction.ts
   const orchestrator = new MasterOrchestrator('test-session');

   // Send 50+ messages to trigger compaction
   for (let i = 0; i < 55; i++) {
     await orchestrator.processQuery(`Message ${i}: What is ${i} + ${i}?`);
   }

   // Verify PreCompact hook fired
   // Verify conversation was summarized
   // Verify context size reduced
   ```

2. **Monitor compaction behavior**
   - Check when compaction triggers (after how many messages)
   - Verify important information preserved
   - Ensure session continuity after compaction

**Success Criteria**:
- PreCompact hook fires at expected threshold
- Conversation summarized correctly
- No loss of critical context

---

## Phase 4: Polish & Production Readiness (LOW PRIORITY)

### 4.1 Error Handling
**Duration**: 1 hour

**Tasks**:
- Add try-catch around agent queries
- Display user-friendly error messages
- Retry logic for transient failures
- Graceful degradation when agents unavailable

### 4.2 Loading States
**Duration**: 30 minutes

**Tasks**:
- Better "Thinking..." indicators
- Progress bar for long queries
- Estimated time remaining
- Cancel query button

### 4.3 Session Management
**Duration**: 1 hour

**Tasks**:
- Session list view (show all sessions)
- Session deletion
- Session export (download conversation)
- Session import (resume old conversation)

### 4.4 Miscellaneous Fixes
**Duration**: 30 minutes

**Tasks**:
- Add favicon.ico (fix 404 error)
- Improve mobile responsiveness
- Add keyboard shortcuts (Enter to send, Cmd+K for new session)
- Better empty states for sidebars

---

## Execution Order

### Sprint 1: Fix Observability (4 hours)
1. Debug hooks (1.1) → 1-2 hours
2. Verify delegation (1.2) → 30 minutes
3. Fix event forwarding (1.3) → 30 minutes
4. Add cost tracking UI (2.2) → 1 hour

**Target**: Working event tracking, visible agent activity, cost display

### Sprint 2: Enhance UX (3 hours)
5. Implement SSE streaming (2.1) → 2-3 hours
6. Add error handling (4.1) → 1 hour

**Target**: Real-time feedback, graceful error handling

### Sprint 3: Testing & Verification (2 hours)
7. Integrate verification tools (3.1) → 1 hour
8. Test parallel execution (3.2) → 30 minutes
9. Test compaction (3.3) → 30 minutes

**Target**: Verified agent behavior, comprehensive test coverage

### Sprint 4: Polish (Optional, 2 hours)
10. Loading states (4.2) → 30 minutes
11. Session management (4.3) → 1 hour
12. Miscellaneous fixes (4.4) → 30 minutes

**Target**: Production-ready polish

---

## Success Criteria for "Complete MVP"

- ✅ All queries complete successfully
- ✅ Agent delegation visible and verified
- ✅ Event tracking working (hooks firing, sidebars populated)
- ✅ Cost tracking displayed in UI
- ✅ Real-time feedback during query processing
- ✅ Verification tools integrated and used
- ✅ Error handling prevents crashes
- ✅ All three agent types tested (finance, research, notes)
- ✅ Parallel subagent execution verified
- ✅ Context compaction tested

---

## Risk Assessment

### High Risk
- **Hook debugging**: If hooks fundamentally don't work with streaming input, may need architecture change
- **SSE implementation**: Complexity could introduce new bugs

### Medium Risk
- **Verification integration**: Agents may not reliably use verification tools
- **Parallel execution**: Race conditions possible

### Low Risk
- **Cost tracking UI**: Straightforward frontend work
- **Polish items**: Nice-to-haves, not blockers

---

## Next Immediate Action

**START HERE**: Execute Task 1.1 (Debug Hook Event Tracking)

Add comprehensive logging to `master-orchestrator.ts` and re-run a test query to see where events are being lost. This is the critical blocker preventing visibility into the entire system.

```bash
# After adding logging
npm run server

# Then test with Playwright or browser:
# Query: "How much did I spend on Food in October 2025?"
# Watch console for hook firing logs
```
