# Task Tool Reference

Complete guide to Claude Code's Task tool for launching and managing sub-agents.

## Overview

The Task tool is Claude Code's primary mechanism for delegating work to specialized sub-agents. Each sub-agent runs with its own isolated context window, allowing parallel execution of complex workflows.

## Basic Usage

```typescript
// Invoke Task tool
Task({
  description: "Review code for security issues",
  prompt: "Perform comprehensive security audit of src/auth/ module focusing on authentication and authorization vulnerabilities",
  subagent_type: "general-purpose"
})
```

## Parameters

### `description` (required)
- **Type**: string
- **Purpose**: Short (3-5 word) summary of the task
- **Example**: "Review authentication code"
- **Best Practice**: Be concise - this is for task tracking

### `prompt` (required)
- **Type**: string
- **Purpose**: Detailed instructions for the sub-agent
- **Best Practice**: Be specific and comprehensive
- **Should Include**:
  - What to do
  - What to analyze/create
  - Expected output format
  - Success criteria
  - Any constraints

**Good prompt example**:
```
Perform comprehensive security audit of the authentication module (src/auth/).

Focus on:
1. SQL injection vulnerabilities
2. Password hashing implementation
3. Session management security
4. Authorization bypass risks

Review files: src/auth/login.ts, src/auth/session.ts, src/auth/middleware.ts

Provide detailed report with:
- Critical/High/Medium/Low categorized findings
- Specific file:line references
- Remediation recommendations
- Code examples for fixes

Return a structured markdown report.
```

**Poor prompt example**:
```
Check the auth code for problems
```

### `subagent_type` (required)
- **Type**: string
- **Purpose**: Selects which specialized agent to invoke
- **Available Types**:
  - `general-purpose`: Standard agent with all tools
  - `Explore`: Fast codebase exploration and search

## Available Sub-Agent Types

### general-purpose
**Best For**: Most development tasks
**Tools Available**: Full toolset (Read, Write, Edit, Grep, Glob, Bash, etc.)
**Use Cases**:
- Implementing features
- Code refactoring
- Test generation
- Documentation writing
- Bug fixing

**Example**:
```typescript
Task({
  description: "Implement user login feature",
  prompt: `Create user login functionality with email/password authentication.

Requirements:
- POST /api/auth/login endpoint
- Email validation
- Password hashing with bcrypt
- JWT token generation
- Error handling for invalid credentials
- Unit tests with 80%+ coverage

Files to create/modify:
- src/api/auth.ts (new)
- src/middleware/auth.ts (new)
- tests/auth.test.ts (new)`,
  subagent_type: "general-purpose"
})
```

### Explore
**Best For**: Codebase exploration and search
**Tools Available**: Read, Grep, Glob, Bash (optimized for search)
**Speed**: Very fast (optimized for quick searches)
**Use Cases**:
- Finding files by pattern
- Searching for keywords/code
- Understanding codebase structure
- Locating specific implementations

**Thoroughness Levels**:
- "quick": Basic searches
- "medium": Moderate exploration
- "very thorough": Comprehensive analysis

**Example**:
```typescript
Task({
  description: "Find error handling patterns",
  prompt: `Find all error handling code in the codebase.

Search for:
1. try-catch blocks
2. Error class definitions
3. Error middleware
4. Logging of errors

Provide:
- List of files with error handling
- Common patterns used
- Inconsistencies to address

Thoroughness: very thorough`,
  subagent_type: "Explore"
})
```

## Agent Communication Patterns

### Sequential Chaining
Execute agents one after another, passing context:

```typescript
// Step 1: Explore codebase
const exploreResult = await Task({
  description: "Map authentication code",
  prompt: "Find all authentication-related files and their relationships",
  subagent_type: "Explore"
});

// Step 2: Use exploration results to guide implementation
const implementResult = await Task({
  description: "Add OAuth support",
  prompt: `Add OAuth 2.0 authentication to the existing auth system.

Based on codebase exploration:
${exploreResult}

Integrate OAuth alongside existing email/password auth...`,
  subagent_type: "general-purpose"
});
```

### Parallel Execution
Launch multiple agents simultaneously for independent tasks:

```typescript
// Execute in parallel (use multiple Task calls in one message)
const [frontend, backend, tests] = await Promise.all([
  Task({
    description: "Build UI components",
    prompt: "Create React components for user profile page...",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Build API endpoints",
    prompt: "Create REST API endpoints for user profile CRUD...",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Generate test suite",
    prompt: "Create comprehensive tests for profile functionality...",
    subagent_type: "general-purpose"
  })
]);
```

### Hierarchical Delegation
Coordinator agent manages worker agents:

```typescript
// Main coordinator breaks down work
const tasks = analyzeFeatureRequirements(userRequest);

// Delegate to specialized worker agents
for (const task of tasks) {
  await Task({
    description: task.summary,
    prompt: task.detailed_instructions,
    subagent_type: task.agent_type
  });
}

// Aggregate results
const finalResult = synthesizeResults(taskResults);
```

## Best Practices

### 1. Clear Task Descriptions
✅ **Good**: "Security audit of auth module"
❌ **Bad**: "Check stuff"

### 2. Detailed Prompts
✅ **Good**: Include context, requirements, constraints, expected output
❌ **Bad**: Vague instructions leaving agent to guess

### 3. Appropriate Agent Selection
- Use `Explore` for search/discovery
- Use `general-purpose` for implementation
- Don't use `general-purpose` for simple searches

### 4. Context Management
**Include necessary context**:
```typescript
Task({
  description: "Fix bug in payment processing",
  prompt: `Fix the bug reported in issue #456.

Bug details:
- Error: "Payment fails for amounts > $1000"
- Affected file: src/payments/processor.ts
- Stack trace: [paste trace]

Previous context:
- Payment gateway is Stripe
- We use webhook validation
- Currency is always USD

Expected fix:
- Handle large amounts correctly
- Add validation
- Include test case`,
  subagent_type: "general-purpose"
})
```

**Don't overload with irrelevant context**:
- Keep prompts focused
- Reference files instead of pasting full code
- Link to documentation rather than copying it

### 5. Error Handling
```typescript
try {
  const result = await Task({
    description: "Complex refactoring",
    prompt: "...",
    subagent_type: "general-purpose"
  });

  if (!result.success) {
    // Retry with different approach
    const retryResult = await Task({
      description: "Simpler refactoring approach",
      prompt: "...",
      subagent_type: "general-purpose"
    });
  }
} catch (error) {
  // Handle task failures
  console.error("Task failed:", error);
}
```

## Performance Optimization

### Minimize Agent Invocations
❌ **Inefficient**:
```typescript
// Three separate agent calls
await Task({...}); // Search for files
await Task({...}); // Read files
await Task({...}); // Analyze code
```

✅ **Efficient**:
```typescript
// Single agent call with combined instructions
await Task({
  description: "Analyze codebase",
  prompt: "1. Find auth files, 2. Read them, 3. Analyze patterns",
  subagent_type: "Explore"
});
```

### Use Appropriate Agent Types
❌ **Slow**:
```typescript
// Using general-purpose for simple search
await Task({
  description: "Find config files",
  prompt: "Find all *.config.js files",
  subagent_type: "general-purpose"
});
```

✅ **Fast**:
```typescript
// Using Explore for search
await Task({
  description: "Find config files",
  prompt: "Find all *.config.js files",
  subagent_type: "Explore"
});
```

### Parallel When Possible
```typescript
// Launch independent tasks in parallel
// (Make multiple Task calls in single response)
Task({...}); // Task 1
Task({...}); // Task 2
Task({...}); // Task 3
// All execute simultaneously
```

## Common Patterns

### Pattern: Feature Development Pipeline
```typescript
// 1. Explore existing code
const codeMap = await Task({
  description: "Map existing feature",
  prompt: "Find all files related to user management...",
  subagent_type: "Explore"
});

// 2. Implement new feature
const implementation = await Task({
  description: "Add new user feature",
  prompt: `Add profile picture upload feature.

Existing code: ${codeMap}

Requirements: ...`,
  subagent_type: "general-purpose"
});

// 3. Generate tests
const tests = await Task({
  description: "Create feature tests",
  prompt: `Generate tests for profile picture upload.

Implementation: ${implementation}

Test coverage: ...`,
  subagent_type: "general-purpose"
});
```

### Pattern: Code Quality Audit
```typescript
// Parallel quality checks
const [security, performance, style] = await Promise.all([
  Task({
    description: "Security audit",
    prompt: "Check for security vulnerabilities...",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Performance analysis",
    prompt: "Identify performance bottlenecks...",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Style review",
    prompt: "Check code style and best practices...",
    subagent_type: "general-purpose"
  })
]);
```

### Pattern: Migration
```typescript
// Sequential migration with validation
const modules = ['auth', 'api', 'ui', 'tests'];

for (const module of modules) {
  // Migrate module
  await Task({
    description: `Migrate ${module} module`,
    prompt: `Migrate ${module} from TypeScript 4 to TypeScript 5...`,
    subagent_type: "general-purpose"
  });

  // Validate migration
  await Task({
    description: `Validate ${module} migration`,
    prompt: `Run tests and check for issues in ${module}...`,
    subagent_type: "general-purpose"
  });
}
```

## Troubleshooting

### Agent Not Finding Files
**Problem**: Explore agent can't find expected files
**Solution**:
- Check glob patterns are correct
- Verify file paths
- Check .gitignore isn't hiding files

### Agent Timeout
**Problem**: Task takes too long
**Solution**:
- Break into smaller tasks
- Use more specific prompts
- Reduce scope

### Inconsistent Results
**Problem**: Agent produces different results each time
**Solution**:
- Make prompts more specific
- Provide examples of expected output
- Add validation criteria

### Context Overload
**Problem**: Agent seems confused by too much context
**Solution**:
- Simplify prompt
- Break into sequential steps
- Use references instead of copying content

## Advanced Usage

### Dynamic Agent Selection
```typescript
function selectAgentType(taskComplexity: string) {
  if (taskComplexity === 'search') {
    return 'Explore';
  }
  return 'general-purpose';
}

await Task({
  description: "Handle dynamic task",
  prompt: "...",
  subagent_type: selectAgentType(complexity)
});
```

### Result Aggregation
```typescript
const agentResults = await Promise.all(
  tasks.map(task => Task({
    description: task.name,
    prompt: task.instructions,
    subagent_type: task.type
  }))
);

// Synthesize results
const summary = aggregateResults(agentResults);
```

### Conditional Execution
```typescript
const analysisResult = await Task({
  description: "Analyze codebase",
  prompt: "Check if refactoring needed...",
  subagent_type: "Explore"
});

if (analysisResult.needsRefactoring) {
  await Task({
    description: "Perform refactoring",
    prompt: `Refactor based on analysis: ${analysisResult}`,
    subagent_type: "general-purpose"
  });
}
```

## Integration with Custom Sub-Agents

The Task tool can work with custom sub-agents defined in `.claude/agents/`:

```typescript
// Custom sub-agent will be automatically selected based on description match
await Task({
  description: "Review code quality",
  prompt: "Perform code review focusing on maintainability and best practices...",
  subagent_type: "general-purpose"
});

// If custom code-reviewer agent exists with matching description,
// Claude may delegate to it instead of generic agent
```

## Metrics and Monitoring

Track agent performance:

```typescript
const startTime = Date.now();

const result = await Task({
  description: "Complex task",
  prompt: "...",
  subagent_type: "general-purpose"
});

const duration = Date.now() - startTime;
console.log(`Task completed in ${duration}ms`);
```

Monitor agent success rates:
- Track completed vs failed tasks
- Measure average completion time
- Identify bottlenecks
- Optimize prompts based on results
