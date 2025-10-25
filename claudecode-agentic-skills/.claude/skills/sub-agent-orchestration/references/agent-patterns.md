# Sub-Agent Orchestration Patterns

Proven patterns for coordinating multiple sub-agents in complex workflows.

## Pattern Categories

1. **Execution Patterns** - How agents run (sequential, parallel, hierarchical)
2. **Communication Patterns** - How agents share information
3. **Specialization Patterns** - Domain-specific agent configurations
4. **Error Recovery Patterns** - Handling failures gracefully

## Execution Patterns

### Sequential Chain Pattern

**When to use**: Tasks with dependencies where output of one feeds into next

**Structure**:
```
Agent A → Agent B → Agent C → Result
```

**Example - Feature Development**:
```typescript
// 1. Research existing patterns
const research = await invokeAgent('Explore', {
  task: 'Research existing authentication patterns in codebase'
});

// 2. Implement based on research
const implementation = await invokeAgent('general-purpose', {
  task: `Implement OAuth based on patterns: ${research}`
});

// 3. Generate tests
const tests = await invokeAgent('test-engineer', {
  task: `Create tests for implementation: ${implementation}`
});

// 4. Document
const docs = await invokeAgent('documentation-writer', {
  task: `Document new feature: ${implementation}`
});
```

**Benefits**:
- Clear dependencies
- Context flows naturally
- Easy to debug
- Predictable execution

**Drawbacks**:
- Slower (sequential execution)
- Blocked by failures
- Can't leverage parallelism

---

### Fan-Out/Fan-In Pattern

**When to use**: Independent tasks that can run in parallel, then aggregate

**Structure**:
```
        ┌─> Agent A ─┐
Main ──┼─> Agent B ─┼──> Aggregator ──> Result
        └─> Agent C ─┘
```

**Example - Code Quality Audit**:
```typescript
// Fan-out: Launch parallel audits
const [security, quality, performance] = await Promise.all([
  invokeAgent('security-analyst', {
    task: 'Security vulnerability scan'
  }),
  invokeAgent('code-reviewer', {
    task: 'Code quality assessment'
  }),
  invokeAgent('general-purpose', {
    task: 'Performance profiling'
  })
]);

// Fan-in: Aggregate results
const report = synthesizeAuditResults({
  security,
  quality,
  performance
});
```

**Benefits**:
- Fast (parallel execution)
- Scalable
- Fault isolated (one failure doesn't block others)

**Drawbacks**:
- Requires result aggregation
- More complex coordination
- Potential resource contention

---

### Pipeline Pattern

**When to use**: Data flows through stages, each adding value

**Structure**:
```
Input → Stage 1 → Stage 2 → Stage 3 → Output
```

**Example - Content Processing**:
```typescript
// Stage 1: Extract data
const extracted = await invokeAgent('Explore', {
  task: 'Extract user stories from PRD document'
});

// Stage 2: Transform to tasks
const tasks = await invokeAgent('general-purpose', {
  task: `Convert user stories to GitHub issues: ${extracted}`
});

// Stage 3: Enrich with technical details
const enriched = await invokeAgent('general-purpose', {
  task: `Add technical requirements to tasks: ${tasks}`
});

// Stage 4: Validate
const validated = await invokeAgent('general-purpose', {
  task: `Validate completeness of tasks: ${enriched}`
});
```

**Benefits**:
- Clear data transformations
- Easy to add/remove stages
- Composable
- Testable stages

**Drawbacks**:
- Sequential (can be slow)
- Coupling between stages
- Error propagates through pipeline

---

### Hierarchical Pattern

**When to use**: Complex tasks requiring coordination and delegation

**Structure**:
```
     Coordinator
    /    |    \
  W1    W2    W3   (Workers)
  / \    |   / \
 T1 T2  T3 T4  T5  (Tasks)
```

**Example - Migration Project**:
```typescript
// Coordinator agent plans migration
const plan = await invokeAgent('general-purpose', {
  task: 'Create migration plan for React 17→18 upgrade'
});

// Coordinator delegates to worker agents
const modules = plan.modules;
const results = await Promise.all(
  modules.map(module =>
    invokeAgent('general-purpose', {
      task: `Migrate ${module.name} following strategy: ${module.strategy}`
    })
  )
);

// Coordinator aggregates and validates
const validation = await invokeAgent('general-purpose', {
  task: `Validate migration results and create integration plan: ${results}`
});
```

**Benefits**:
- Handles complexity well
- Clear responsibility hierarchy
- Scalable delegation
- Centralized coordination

**Drawbacks**:
- Coordinator is single point of failure
- More overhead
- Complex state management

---

### Adaptive Pattern

**When to use**: Task complexity unknown upfront, needs dynamic agent selection

**Structure**:
```
Task → Analyzer → [Dynamic Agent Selection] → Result
```

**Example - Smart Bug Fix**:
```typescript
// Analyze bug complexity
const analysis = await invokeAgent('Explore', {
  task: 'Analyze bug #123 and determine required changes'
});

// Dynamically select approach
let result;
if (analysis.complexity === 'simple') {
  // Direct fix
  result = await invokeAgent('general-purpose', {
    task: `Apply simple fix: ${analysis.solution}`
  });
} else if (analysis.complexity === 'refactoring-needed') {
  // Refactoring required
  result = await invokeAgent('refactoring-expert', {
    task: `Refactor to fix bug: ${analysis}`
  });
} else {
  // Complex - sequential pipeline
  const refactored = await invokeAgent('refactoring-expert', {...});
  const tested = await invokeAgent('test-engineer', {...});
  const reviewed = await invokeAgent('code-reviewer', {...});
  result = { refactored, tested, reviewed };
}
```

**Benefits**:
- Optimizes for actual needs
- Efficient resource usage
- Flexible
- Self-adjusting

**Drawbacks**:
- Complex decision logic
- Harder to predict behavior
- Requires good analysis

## Communication Patterns

### Context Passing

Explicitly pass results between agents:

```typescript
const step1 = await agent1.execute();
const step2 = await agent2.execute({ context: step1 });
const step3 = await agent3.execute({ context: step2 });
```

### Shared State

Use common data structure:

```typescript
const sharedContext = {
  project: 'my-app',
  changes: [],
  decisions: []
};

// Agents update shared context
await agent1.execute({ context: sharedContext });
await agent2.execute({ context: sharedContext });
// Both agents see accumulated state
```

### Message Passing

Agents communicate via messages:

```typescript
const messageQueue = [];

// Agent 1 produces message
messageQueue.push({
  from: 'agent-1',
  to: 'agent-2',
  data: { files: [...] }
});

// Agent 2 consumes message
const msg = messageQueue.find(m => m.to === 'agent-2');
await agent2.execute({ message: msg });
```

## Specialization Patterns

### Single Responsibility

Each agent does one thing well:

```
code-reviewer: Only reviews code
test-engineer: Only writes tests
security-analyst: Only checks security
```

### Domain Expert

Agents specialize in domains:

```
frontend-expert: React, CSS, UI/UX
backend-expert: APIs, databases, servers
devops-expert: CI/CD, containers, cloud
```

### Task-Specific

Agents for specific recurring tasks:

```
migration-agent: Framework upgrades
refactoring-agent: Code improvements
documentation-agent: Docs generation
```

## Error Recovery Patterns

### Retry with Fallback

```typescript
async function executeWithRetry(agent, task, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await agent.execute(task);
    } catch (error) {
      if (i === maxRetries - 1) {
        // Final attempt failed - use fallback
        return await fallbackAgent.execute(task);
      }
      // Adjust task and retry
      task = simplifyTask(task);
    }
  }
}
```

### Circuit Breaker

```typescript
class AgentCircuitBreaker {
  constructor(private failureThreshold = 3) {
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(agent, task) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker OPEN - too many failures');
    }

    try {
      const result = await agent.execute(task);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}
```

### Graceful Degradation

```typescript
async function robustFeatureDevelopment(feature) {
  try {
    // Ideal: Full feature with tests and docs
    return await fullFeaturePipeline(feature);
  } catch (error) {
    try {
      // Fallback: Feature without tests
      return await implementationOnly(feature);
    } catch (error2) {
      // Last resort: Partial implementation
      return await partialImplementation(feature);
    }
  }
}
```

## Anti-Patterns to Avoid

### ❌ God Agent

Single agent doing everything:

```typescript
// BAD: One agent for all tasks
await megaAgent.execute({
  tasks: [
    'implement feature',
    'write tests',
    'review code',
    'write docs',
    'deploy'
  ]
});
```

**Fix**: Use specialized agents in pipeline

### ❌ Excessive Coordination Overhead

Too much back-and-forth:

```typescript
// BAD: Too many coordination steps
const a = await coordinator.plan();
const b = await worker.confirm(a);
const c = await coordinator.adjust(b);
const d = await worker.execute(c);
const e = await coordinator.validate(d);
```

**Fix**: Group communications, trust workers

### ❌ Tight Coupling

Agents depend on internal details:

```typescript
// BAD: Agent A knows Agent B's internals
agentA.execute({
  useAgentBInternalMethod: true,
  agentBConfig: {...}
});
```

**Fix**: Use well-defined interfaces

### ❌ No Error Handling

Failures crash entire workflow:

```typescript
// BAD: No error handling
const results = await Promise.all([
  agent1.execute(),
  agent2.execute(),
  agent3.execute()
]);
// One failure = complete failure
```

**Fix**: Individual error handling + graceful degradation

## Pattern Selection Guide

**Choose Sequential when**:
- Tasks have clear dependencies
- Order matters
- Context builds incrementally

**Choose Parallel when**:
- Tasks are independent
- Speed is critical
- Resources available

**Choose Hierarchical when**:
- Task is complex
- Need coordination
- Clear work breakdown

**Choose Adaptive when**:
- Complexity varies
- Resources limited
- Optimization important

## Real-World Examples

### Example 1: Feature Development
Pattern: Sequential Pipeline

```
Explore → Design → Implement → Test → Review → Document → Deploy
```

### Example 2: Code Audit
Pattern: Fan-Out/Fan-In

```
                    ┌─> Security ─┐
Main ─> Analysis ──┼─> Quality ──┼──> Report
                    └─> Coverage ─┘
```

### Example 3: Large Migration
Pattern: Hierarchical

```
        Coordinator
       /    |    \
    Mod1  Mod2  Mod3
    / \    |   / \
  F1 F2   F3 F4 F5
```

### Example 4: Bug Triage
Pattern: Adaptive

```
Bug → Analyze → [Simple Fix | Refactor | Investigation]
```
