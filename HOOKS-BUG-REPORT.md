# SDK Hooks Bug Report

**Date**: October 2, 2025
**SDK Version**: 0.1.1, 0.1.2 (both affected)
**Severity**: HIGH - Blocks all event tracking functionality

## Summary

Hooks in `@anthropic-ai/claude-agent-sdk` versions 0.1.1 and 0.1.2 **do not fire at all**, regardless of configuration. This completely blocks the ability to track:
- Tool usage
- Agent delegation
- Session lifecycle events
- Cost/token metrics
- Any custom event tracking

## Reproduction

### Test 1: Minimal Hook Test
```typescript
import { query, type HookInput } from '@anthropic-ai/claude-agent-sdk';

let hooksFired = 0;

function simpleHook(input: HookInput) {
  hooksFired++;
  console.log('🔥 HOOK FIRED!', input.event);
}

const result = query({
  prompt: 'Use the Read tool to read the package.json file',
  options: {
    allowedTools: ['Read'],
    hooks: [simpleHook],
  }
});

for await (const message of result) {
  console.log('Message type:', message.type);
}

console.log(`Hooks fired: ${hooksFired}`);
// Output: Hooks fired: 0
```

**Expected**: Hook fires on `preToolUse`, `postToolUse`, `sessionStart`, `sessionEnd`
**Actual**: Hook never fires, `hooksFired` remains 0

### Test 2: Official Example
Running the official `src/examples/hooks-example.ts`:

```bash
npx tsx src/examples/hooks-example.ts
```

**Expected**: Console logs showing hook events:
```
[Hook: sessionStart]
[Hook: preToolUse] Tool: Read
[Hook: postToolUse] Tool: Read
[Hook: sessionEnd]
```

**Actual**: No hook logs appear at all, only:
```
=== Hooks Example ===
Starting query with hooks enabled...
✓ Hooks example completed
```

## Investigation

### Tested Configurations

1. **Simple hooks without tools**: ❌ No hooks fired
2. **Hooks with tool usage (Read, Glob)**: ❌ No hooks fired
3. **Hooks with streaming input**: ❌ No hooks fired
4. **Hooks with MCP servers**: ❌ No hooks fired
5. **Official hooks-example.ts**: ❌ No hooks fired

### SDK Versions Tested
- `0.1.1`: ❌ Hooks don't fire
- `0.1.2`: ❌ Hooks don't fire (upgraded, still broken)

### Property Name Confusion

The documentation shows conflicting hook input property names:

**In TypeScript types** (from ai-agent-sdk-typescript.md):
```typescript
interface HookInput {
  hook_event_name: 'PreToolUse' | 'PostToolUse' | 'PreCompact' | ...;  // PascalCase
  tool_name: string;
  tool_input: any;
}
```

**In official example** (src/examples/hooks-example.ts):
```typescript
function toolUsageLogger(input: HookInput) {
  if (input.event === 'preToolUse') {  // camelCase, lowercase 'event'
    console.log(`Tool: ${input.tool.name}`);  // nested 'tool' object
  }
}
```

This inconsistency suggests the SDK may be in flux or documentation is outdated.

## Impact on MVP

### Features Blocked
1. **Activity Sidebar**: Cannot show "🤖 Using finance agent"
2. **Tools Used Sidebar**: Cannot show tool names
3. **Cost Tracking**: Cannot capture TaskOutput metrics (usage, cost_usd, duration_ms)
4. **Agent Delegation Verification**: Cannot confirm Task tool invocation
5. **Compaction Monitoring**: Cannot track when compaction occurs

### Current State
- ✅ Queries work and return accurate results
- ✅ Agents appear to be invoked (responses are domain-specific)
- ❌ Zero visibility into what's happening internally
- ❌ No event tracking whatsoever
- ❌ Empty sidebars in UI

## Workarounds Explored

### Workaround 1: Parse Messages (❌ Insufficient)
Attempted to infer events from message stream:

```typescript
for await (const message of result) {
  if (message.type === 'assistant' && message.text?.includes('Task')) {
    // Try to detect delegation from text
  }
}
```

**Problem**: Messages don't contain structured tool usage information

### Workaround 2: Wrap SDK Functions (❌ Not Possible)
Can't intercept internal SDK tool calls without hooks

### Workaround 3: Alternative Event Source (⚠️ Partial)
**Only viable option**: Track events at higher level by:
- Parsing message content for clues
- Tracking request/response timing
- Estimating costs from message lengths

**Limitations**:
- No per-tool granularity
- No accurate cost tracking
- No delegation confirmation

## Recommended Actions

### Immediate (For MVP)
1. **Document limitation**: Add "Known Issue: Hooks Not Working" to README
2. **Implement partial tracking**: Track at query level (start/end times, total cost estimates)
3. **Show static agent list**: Display agents available, not agents active
4. **Remove real-time activity**: Can't show live events, show "Query in progress..."

### Short-term (For SDK Team)
1. **File SDK bug report**: Report hooks not firing in 0.1.1/0.1.2
2. **Clarify documentation**: Reconcile `hook_event_name` vs `input.event` inconsistency
3. **Add hook debug mode**: SDK should log when hooks are registered/called
4. **Publish test suite**: Include working hook examples

### Long-term (For Future)
1. **Wait for SDK fix**: Monitor for version 0.1.3+ with hook fixes
2. **Re-enable features**: Once hooks work, activate event tracking
3. **Add comprehensive tests**: Verify hooks fire for all event types

## Alternative Implementations

### Option A: Message-Based Tracking (Current Best Option)
Since hooks don't work, track events from message metadata:

```typescript
for await (const message of result) {
  // Track timing
  if (message.type === 'assistant') {
    events.push({ type: 'response', timestamp: new Date() });
  }

  // Estimate tokens from message length
  if (message.text) {
    estimatedTokens += message.text.length / 4;
  }
}
```

**Pros**: Works without hooks
**Cons**: Inaccurate, no per-tool data

### Option B: Manual Tool Wrapper
Wrap tools ourselves before passing to SDK:

```typescript
const wrappedRead = (path: string) => {
  events.push({ type: 'tool_use', toolName: 'Read' });
  return originalRead(path);
};
```

**Pros**: Accurate tracking
**Cons**: Only works for custom tools, not SDK built-ins

### Option C: Polling Approach
Check SDK state periodically:

```typescript
setInterval(() => {
  const state = getSdkState();  // hypothetical API
  updateEvents(state);
}, 100);
```

**Pros**: Could catch events
**Cons**: No such API exists in SDK

## Conclusion

**Hooks are fundamentally broken in SDK 0.1.1 and 0.1.2.** This is a blocker for:
- Event tracking
- Activity monitoring
- Cost attribution
- Debugging agent behavior

**Recommended path forward**:
1. Implement Option A (message-based tracking) for MVP
2. File bug report with Anthropic
3. Wait for SDK fix in future version
4. Re-enable full event tracking when hooks work

## Test Files

- `src/test/test-hooks-minimal.ts` - Minimal reproduction
- `src/examples/hooks-example.ts` - Official example (also broken)
- `src/test/test-delegation.ts` - Phase 0 tests (hooks don't fire)

## Evidence

```bash
# Test with SDK 0.1.1
$ npm list @anthropic-ai/claude-agent-sdk
└── @anthropic-ai/claude-agent-sdk@0.1.1

$ npx tsx src/test/test-hooks-minimal.ts
Hooks fired: 0
❌ PROBLEM: Hooks did not fire at all!

# Upgrade to 0.1.2
$ npm install @anthropic-ai/claude-agent-sdk@0.1.2

$ npx tsx src/test/test-hooks-minimal.ts
Hooks fired: 0
❌ PROBLEM: Hooks did not fire at all!
```

Both versions exhibit the same issue.
