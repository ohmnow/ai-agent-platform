---
name: sub-agent-orchestration
description: Orchestrate complex multi-agent workflows for maximum efficiency and autonomy. Use when tasks require parallel execution, specialized expertise, coordinating multiple autonomous agents, breaking down complex features, or managing large-scale development workflows. Automatically creates, delegates to, and synthesizes results from specialized sub-agents.
---

# Sub-Agent Orchestration

Harness the power of multiple specialized AI agents working in concert to tackle complex development tasks with unprecedented speed and quality.

## Overview

Sub-agent orchestration enables breaking down complex tasks into specialized units of work, executed by purpose-built agents in parallel or sequence. This skill provides the framework, patterns, and tooling for creating sophisticated multi-agent workflows that maximize development velocity while maintaining high quality.

## When to Use Sub-Agent Orchestration

Use this skill when:

- **Complex Features**: Multi-part features requiring different expertise (frontend + backend + tests + docs)
- **Parallel Work**: Independent tasks that can execute simultaneously
- **Specialized Knowledge**: Tasks requiring domain expertise (security, performance, refactoring)
- **Large-Scale Changes**: Migrations, refactorings, or updates affecting many files
- **Quality Assurance**: Comprehensive audits requiring multiple perspectives
- **Repetitive Patterns**: Similar tasks across multiple modules/files

**Don't use when**:
- Simple, single-file changes
- Quick bug fixes
- Exploratory work without clear scope
- Tasks requiring continuous human input

## Core Concepts

### Sub-Agent Types

**1. Claude Code Task Tool Agents**
- `general-purpose`: Full toolset, handles most development tasks
- `Explore`: Fast codebase search and exploration

**2. Custom Sub-Agents** (`.claude/agents/`)
- Domain-specific agents with specialized instructions
- Custom tool sets and model configurations
- Project-specific workflows and patterns

**3. Skill-Based Agents**
Use agent templates from this skill:
- `code-reviewer`: Code quality and best practices
- `test-engineer`: Comprehensive test generation
- `documentation-writer`: Technical documentation
- `refactoring-expert`: Code improvement and debt reduction
- `security-analyst`: Vulnerability detection and security review

### Orchestration Patterns

**Sequential**: Tasks with dependencies execute in order
```
Research → Design → Implement → Test → Review → Deploy
```

**Parallel**: Independent tasks execute simultaneously
```
Frontend ┐
Backend  ├─> Integration
Tests    ┘
```

**Hierarchical**: Coordinator manages worker agents
```
Coordinator
├─> Module A Worker
├─> Module B Worker
└─> Module C Worker
```

**Adaptive**: Dynamic agent selection based on complexity
```
Analyze → [Simple Agent | Complex Pipeline]
```

## Decision Framework: When to Delegate

### Delegate to Sub-Agent If:

✅ **Task is well-defined**
- Clear scope and requirements
- Known success criteria
- Specific deliverables

✅ **Task is specialized**
- Requires domain expertise
- Benefits from focused context
- Has established patterns

✅ **Task is parallelizable**
- Independent from other work
- No blocking dependencies
- Can run simultaneously

✅ **Task is repetitive**
- Similar to previous work
- Follows known patterns
- Automatable workflow

### Handle Directly If:

❌ **Task is exploratory**
- Unclear requirements
- Discovery needed
- No clear outcome

❌ **Task is trivial**
- Single line change
- Quick fix
- No complexity

❌ **Task requires iteration**
- Needs immediate feedback
- Evolving requirements
- High uncertainty

❌ **Task is highly coupled**
- Depends on many other changes
- Needs holistic view
- Cross-cutting concerns

## Agent Creation Workflow

### Method 1: Use Pre-built Templates

```bash
# Interactive creation from template
.claude/skills/sub-agent-orchestration/scripts/create-subagent.py --interactive

# CLI creation
.claude/skills/sub-agent-orchestration/scripts/create-subagent.py \
  --name my-agent \
  --description "Specialized agent for X" \
  --template code-reviewer \
  --model sonnet
```

### Method 2: Deploy Template Directly

Copy template to project agents:

```bash
# Copy template to .claude/agents/
cp .claude/skills/sub-agent-orchestration/assets/agent-templates/code-reviewer.md \
   .claude/agents/code-reviewer.md

# Customize as needed
```

### Method 3: Create Custom Agent

Define in `.claude/agents/my-agent.md`:

```markdown
---
name: my-agent
description: What it does and when to use it. Use PROACTIVELY when [trigger condition].
tools: Read, Write, Edit, Grep
model: sonnet
---

# My Custom Agent

## Purpose
[What this agent does]

## Methodology
[How it approaches tasks]

## Output Format
[Expected deliverables]
```

## Orchestration Workflows

### Feature Development Pipeline

Complete feature implementation with quality gates:

**Workflow**: `assets/orchestration-workflows/feature-pipeline.md`

**Phases**:
1. **Planning**: Analyze requirements, decompose tasks
2. **Parallel Implementation**: Frontend, backend, database work
3. **Testing**: Automated test generation
4. **Review**: Code quality and security checks
5. **Documentation**: API docs and usage guides
6. **Integration**: Synthesis and deployment

**Usage**:
```
"Implement user profile editing with avatar upload using feature pipeline"
```

**Benefits**:
- 3-5x faster than sequential development
- Consistent quality across all phases
- Automated testing and documentation
- Parallel execution of independent work

### Code Quality Audit

Comprehensive multi-dimensional quality assessment:

**Workflow**: `assets/orchestration-workflows/code-quality-audit.md`

**Agents** (parallel execution):
- Security analyst (vulnerabilities)
- Code reviewer (quality, patterns)
- Refactoring expert (technical debt)
- Test coverage analyzer (testing gaps)
- Documentation auditor (docs quality)

**Usage**:
```
"Run comprehensive quality audit on src/ directory"
```

**Benefits**:
- 5x faster than sequential review
- Multiple expert perspectives
- Comprehensive coverage
- Prioritized action plan

### Complex Migration

Large-scale codebase transformations:

**Workflow**: `assets/orchestration-workflows/migration-workflow.md`

**Phases**:
1. **Analysis**: Impact assessment and planning
2. **Strategy**: Migration approach and module breakdown
3. **Parallel Migration**: Module-by-module transformation
4. **Integration**: Merge and resolve conflicts
5. **Validation**: Testing and rollback planning
6. **Staged Deployment**: Progressive rollout

**Usage**:
```
"Migrate codebase from React 17 to React 18 using migration workflow"
```

**Benefits**:
- Reduces migration time by 60-80%
- Minimizes risk through incremental approach
- Automated validation at each phase
- Clear rollback plan

## Practical Examples

### Example 1: Building a Complete Feature

**Request**: "Add user authentication with OAuth and email login"

**Orchestration Plan**:
```typescript
// 1. Research existing patterns
Task({
  description: "Map existing auth code",
  prompt: "Find authentication patterns, identify integration points",
  subagent_type: "Explore"
});

// 2. Parallel implementation (3 agents)
[
  Task({
    description: "OAuth implementation",
    prompt: "Implement OAuth 2.0 flow with provider integration...",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Email auth implementation",
    prompt: "Implement email/password authentication with bcrypt...",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Auth UI components",
    prompt: "Create login/signup UI components with validation...",
    subagent_type: "general-purpose"
  })
];

// 3. Sequential quality assurance
Task({
  description: "Generate auth tests",
  prompt: "Create comprehensive test suite for authentication...",
  subagent_type: "general-purpose" // Uses test-engineer template
});

Task({
  description: "Security review",
  prompt: "Review authentication implementation for vulnerabilities...",
  subagent_type: "general-purpose" // Uses security-analyst template
});

Task({
  description: "Document auth system",
  prompt: "Create authentication documentation and usage guide...",
  subagent_type: "general-purpose" // Uses documentation-writer template
});
```

**Result**: Complete, tested, documented authentication system in fraction of time

### Example 2: Pre-Release Quality Gate

**Request**: "Run full quality audit before v2.0 release"

**Orchestration Plan**:
```typescript
// Launch all quality checks in parallel
const auditResults = await Promise.all([
  Task({
    description: "Security audit",
    prompt: "Scan for security vulnerabilities, generate report",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Code quality review",
    prompt: "Review code quality, identify technical debt",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Test coverage analysis",
    prompt: "Analyze test coverage, identify gaps",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Performance profiling",
    prompt: "Profile performance, identify bottlenecks",
    subagent_type: "general-purpose"
  }),
  Task({
    description: "Documentation completeness",
    prompt: "Audit documentation for completeness and accuracy",
    subagent_type: "general-purpose"
  })
]);

// Synthesize into release readiness report
```

**Result**: Comprehensive quality report with prioritized action items

### Example 3: Large Refactoring

**Request**: "Refactor monolithic API into microservices"

**Orchestration Plan**:
```typescript
// Phase 1: Analysis
const analysis = await Task({
  description: "Analyze monolith structure",
  prompt: "Map dependencies, identify service boundaries...",
  subagent_type: "Explore"
});

// Phase 2: Parallel extraction (one agent per service)
const services = ['users', 'products', 'orders', 'payments'];
const extractions = await Promise.all(
  services.map(service =>
    Task({
      description: `Extract ${service} service`,
      prompt: `Extract ${service} functionality into microservice...`,
      subagent_type: "general-purpose"
    })
  )
);

// Phase 3: Integration
const integration = await Task({
  description: "Integrate microservices",
  prompt: "Create API gateway, configure service mesh...",
  subagent_type: "general-purpose"
});

// Phase 4: Validation
const validation = await Task({
  description: "Validate microservices",
  prompt: "Test service integration, verify functionality...",
  subagent_type: "general-purpose"
});
```

**Result**: Systematic microservices extraction with testing

## Performance Optimization

### Maximize Parallel Execution

✅ **Good - Parallel**:
```typescript
await Promise.all([
  agent1.execute(),
  agent2.execute(),
  agent3.execute()
]); // 5 minutes total
```

❌ **Bad - Sequential**:
```typescript
await agent1.execute(); // 5 min
await agent2.execute(); // 5 min
await agent3.execute(); // 5 min
// 15 minutes total
```

### Right-Size Agent Scope

✅ **Good - Balanced**:
```typescript
Task({
  description: "Implement login endpoint",
  prompt: "Create POST /auth/login with validation, bcrypt, JWT...",
  subagent_type: "general-purpose"
}); // Clear scope, manageable
```

❌ **Bad - Too Large**:
```typescript
Task({
  description: "Build entire auth system",
  prompt: "Implement complete authentication with OAuth, email, 2FA...",
  subagent_type: "general-purpose"
}); // Too much for one agent
```

❌ **Bad - Too Small**:
```typescript
Task({
  description: "Add import statement",
  prompt: "Add: import bcrypt from 'bcrypt'",
  subagent_type: "general-purpose"
}); // Overhead not worth it
```

### Use Appropriate Agent Types

✅ **Good - Right Tool**:
```typescript
// Use Explore for search
Task({
  description: "Find error handling",
  prompt: "Locate all error handling patterns",
  subagent_type: "Explore"
}); // Fast, optimized for search
```

❌ **Bad - Wrong Tool**:
```typescript
// Don't use general-purpose for search
Task({
  description: "Find error handling",
  prompt: "Locate all error handling patterns",
  subagent_type: "general-purpose"
}); // Slow, not optimized
```

## Error Handling & Recovery

### Retry Pattern

```typescript
async function executeWithRetry(task, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Task(task);
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      // Simplify task for retry
      task.prompt = simplifyPrompt(task.prompt);
    }
  }
}
```

### Fallback Pattern

```typescript
async function executeWithFallback(primaryTask, fallbackTask) {
  try {
    return await Task(primaryTask);
  } catch (error) {
    console.warn('Primary failed, using fallback');
    return await Task(fallbackTask);
  }
}
```

### Graceful Degradation

```typescript
async function featureDevelopment(feature) {
  try {
    // Ideal: Full pipeline
    return await fullPipeline(feature);
  } catch (error) {
    try {
      // Fallback: Implementation only
      return await implementationOnly(feature);
    } catch (error2) {
      // Last resort: Partial implementation
      return await partialImplementation(feature);
    }
  }
}
```

## Validation & Quality Assurance

### Validate Agent Configurations

```bash
# Validate all agents
.claude/skills/sub-agent-orchestration/scripts/validate-agents.py

# Validate specific agent
.claude/skills/sub-agent-orchestration/scripts/validate-agents.py \
  .claude/agents/my-agent.md

# Strict mode (warnings as errors)
.claude/skills/sub-agent-orchestration/scripts/validate-agents.py --strict
```

### Monitor Agent Performance

Track metrics:
- Completion time per agent
- Success vs failure rate
- Retry frequency
- Parallel vs sequential time saved

## Resources

### Scripts

**`create-subagent.py`**: Interactive sub-agent creator
- Template selection
- Tool configuration
- Model selection
- Validation

**`validate-agents.py`**: Agent configuration validator
- YAML frontmatter validation
- Required field checks
- Tool availability verification
- Best practice recommendations

### Agent Templates (`assets/agent-templates/`)

**`code-reviewer.md`**: Code quality specialist
- Review methodology
- Quality metrics
- Feedback structure
- Integration with workflows

**`test-engineer.md`**: Test generation expert
- Testing philosophy
- Coverage analysis
- Test patterns by language
- CI/CD integration

**`documentation-writer.md`**: Technical documentation specialist
- Documentation types
- Writing guidelines
- Quality checklist
- Maintenance workflow

**`refactoring-expert.md`**: Code improvement specialist
- Code smell detection
- Refactoring techniques
- Metrics tracking
- Automated tooling

**`security-analyst.md`**: Security vulnerability scanner
- Threat modeling
- Vulnerability categories
- Secure coding patterns
- Security testing

### Orchestration Workflows (`assets/orchestration-workflows/`)

**`feature-pipeline.md`**: Complete feature development workflow

**`code-quality-audit.md`**: Parallel quality assessment

**`migration-workflow.md`**: Large-scale codebase transformation

### Reference Documentation (`references/`)

**`task-tool-reference.md`**: Complete Task tool API guide
- Parameter documentation
- Agent type details
- Communication patterns
- Best practices

**`agent-patterns.md`**: Proven orchestration patterns
- Execution patterns
- Communication patterns
- Specialization patterns
- Error recovery patterns

## Best Practices

1. **Start Simple**: Begin with sequential, add parallelism as needed
2. **Clear Prompts**: Detailed instructions yield better results
3. **Right-Size Tasks**: Not too large, not too small
4. **Use Templates**: Leverage pre-built agent templates
5. **Validate Often**: Run validator during development
6. **Monitor Performance**: Track metrics, optimize patterns
7. **Handle Errors**: Always have fallback strategies
8. **Document Workflows**: Record successful orchestration patterns
9. **Iterate**: Improve agents based on real usage
10. **Share Knowledge**: Contribute successful patterns back to team

## Integration with Other Skills

- **parallel-dev-automation**: CI/CD orchestration of multiple Claude Code instances
- **conventional-commits**: Standardized commit messages from agents
- **document-skills**: Specialized document processing agents
- **skill-creator**: Creating new specialized agent templates

## Next Steps

1. **Explore Templates**: Review agent templates in `assets/agent-templates/`
2. **Try a Workflow**: Use feature-pipeline for next feature
3. **Create Custom Agent**: Use create-subagent.py for project-specific needs
4. **Monitor Results**: Track performance improvements
5. **Iterate & Improve**: Refine based on experience
