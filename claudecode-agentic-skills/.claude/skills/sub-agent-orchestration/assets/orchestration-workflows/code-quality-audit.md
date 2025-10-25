# Code Quality Audit Workflow

Parallel multi-agent orchestration for comprehensive code quality assessment across multiple dimensions.

## Workflow Overview

```
Main Orchestrator
     ├─> Security Analyst (parallel)
     ├─> Code Reviewer (parallel)
     ├─> Refactoring Expert (parallel)
     ├─> Test Coverage Analyzer (parallel)
     └─> Documentation Auditor (parallel)
          ↓
     Result Aggregation
          ↓
     Priority Report & Action Plan
```

## Use Cases

- Pre-release quality gate
- Technical debt assessment
- Code inheritance evaluation
- Compliance audit preparation
- Legacy code modernization planning

## Agents & Responsibilities

### 1. Security Analyst Agent
**Focus**: Security vulnerabilities and risks
**Checks**:
- [ ] Input validation and sanitization
- [ ] Authentication and authorization
- [ ] SQL injection vulnerabilities
- [ ] XSS attack vectors
- [ ] CSRF protection
- [ ] Sensitive data exposure
- [ ] Dependency vulnerabilities
- [ ] Security misconfigurations

**Output**:
```json
{
  "critical": [
    {
      "type": "SQL Injection",
      "location": "api/users.ts:45",
      "severity": "critical",
      "remediation": "Use parameterized queries"
    }
  ],
  "high": [...],
  "medium": [...],
  "low": [...]
}
```

### 2. Code Reviewer Agent
**Focus**: Code quality and best practices
**Checks**:
- [ ] Code readability and clarity
- [ ] Naming conventions consistency
- [ ] Design pattern appropriateness
- [ ] DRY principle adherence
- [ ] SOLID principles compliance
- [ ] Error handling completeness
- [ ] Code complexity (cyclomatic)
- [ ] Function/method length

**Output**:
```json
{
  "scores": {
    "readability": 7.5,
    "maintainability": 6.2,
    "complexity": 5.8
  },
  "issues": [
    {
      "file": "utils/processor.ts",
      "line": 120,
      "issue": "Function too long (85 lines)",
      "suggestion": "Extract method for parsing logic"
    }
  ],
  "strengths": [...]
}
```

### 3. Refactoring Expert Agent
**Focus**: Code smells and technical debt
**Checks**:
- [ ] Code duplication
- [ ] Long methods/classes
- [ ] God objects
- [ ] Feature envy
- [ ] Inappropriate intimacy
- [ ] Shotgun surgery patterns
- [ ] Dead code
- [ ] Magic numbers/strings

**Output**:
```json
{
  "codeSmells": [
    {
      "smell": "Duplicate Code",
      "locations": [
        "auth/login.ts:20-35",
        "auth/register.ts:45-60"
      ],
      "refactoring": "Extract shared validation logic",
      "impact": "High"
    }
  ],
  "technicalDebt": {
    "estimated_hours": 24,
    "priority_areas": [...]
  }
}
```

### 4. Test Coverage Analyzer Agent
**Focus**: Testing completeness and quality
**Checks**:
- [ ] Line coverage percentage
- [ ] Branch coverage percentage
- [ ] Function coverage percentage
- [ ] Critical path coverage
- [ ] Edge case testing
- [ ] Error condition testing
- [ ] Integration test presence
- [ ] Test quality and maintainability

**Output**:
```json
{
  "coverage": {
    "line": 72,
    "branch": 65,
    "function": 80,
    "statement": 71
  },
  "gaps": [
    {
      "file": "payment/processor.ts",
      "uncovered_lines": [45, 46, 47, 62-70],
      "critical": true,
      "reason": "Payment processing error paths"
    }
  ],
  "recommendations": [...]
}
```

### 5. Documentation Auditor Agent
**Focus**: Documentation completeness and accuracy
**Checks**:
- [ ] README completeness
- [ ] API documentation currency
- [ ] Inline comment quality
- [ ] Architecture documentation
- [ ] Setup instructions clarity
- [ ] Example code validity
- [ ] Changelog maintenance
- [ ] Troubleshooting guides

**Output**:
```json
{
  "completeness": 68,
  "issues": [
    {
      "type": "Missing API docs",
      "endpoints": ["/api/v2/users", "/api/v2/orders"],
      "severity": "medium"
    },
    {
      "type": "Outdated examples",
      "files": ["README.md"],
      "severity": "low"
    }
  ]
}
```

## Orchestration Flow

### 1. Initialization Phase
```typescript
interface AuditConfig {
  scope: 'full' | 'incremental' | 'critical-only';
  codebase: string[];
  excludePaths: string[];
  standards: {
    minCoverage: number;
    maxComplexity: number;
    securityLevel: 'strict' | 'standard' | 'relaxed';
  };
}

const config: AuditConfig = {
  scope: 'full',
  codebase: ['src/**/*.ts'],
  excludePaths: ['**/*.test.ts', 'dist/**'],
  standards: {
    minCoverage: 80,
    maxComplexity: 10,
    securityLevel: 'strict'
  }
};
```

### 2. Parallel Execution Phase
```typescript
// Main orchestrator launches all agents in parallel
const auditResults = await Promise.all([
  invokeAgent('security-analyst', {
    task: 'security-audit',
    scope: config.codebase,
    level: config.standards.securityLevel
  }),
  invokeAgent('code-reviewer', {
    task: 'quality-review',
    scope: config.codebase,
    standards: config.standards
  }),
  invokeAgent('refactoring-expert', {
    task: 'technical-debt-analysis',
    scope: config.codebase
  }),
  invokeAgent('test-engineer', {
    task: 'coverage-analysis',
    scope: config.codebase,
    target: config.standards.minCoverage
  }),
  invokeAgent('documentation-writer', {
    task: 'documentation-audit',
    scope: config.codebase
  })
]);

const [security, quality, refactoring, testing, documentation] = auditResults;
```

### 3. Result Aggregation Phase
```typescript
interface AuditReport {
  overall_score: number; // 0-100
  critical_issues: number;
  blocker_issues: number;
  pass_fail: 'pass' | 'fail';
  dimensions: {
    security: DimensionScore;
    quality: DimensionScore;
    maintainability: DimensionScore;
    testing: DimensionScore;
    documentation: DimensionScore;
  };
  action_plan: ActionItem[];
}

const report = aggregateResults(auditResults, config.standards);
```

### 4. Prioritization Phase
```typescript
// Main orchestrator prioritizes issues
const priorities = {
  P0: [], // Critical blockers (security critical, data loss)
  P1: [], // High priority (quality gates, test failures)
  P2: [], // Medium priority (technical debt, refactoring)
  P3: []  // Low priority (documentation, minor improvements)
};

// Apply prioritization algorithm
for (const issue of allIssues) {
  const priority = calculatePriority(
    issue.severity,
    issue.impact,
    issue.effort
  );
  priorities[priority].push(issue);
}
```

## Report Generation

### Executive Summary
```markdown
# Code Quality Audit Report
**Date**: 2025-01-15
**Scope**: Full codebase (234 files, 45,000 LOC)
**Overall Score**: 72/100 ⚠️

## Status: CONDITIONAL PASS
- Critical Issues: 2 🚨
- Blocker Issues: 5 ⛔
- High Priority: 15 ⚠️
- Medium Priority: 32 📋
- Low Priority: 48 📝

## Dimensional Scores
| Dimension       | Score | Status |
|-----------------|-------|--------|
| Security        | 65    | ⚠️ FAIL |
| Code Quality    | 78    | ✅ PASS |
| Maintainability | 70    | ⚠️ WARN |
| Test Coverage   | 68    | ⚠️ FAIL |
| Documentation   | 72    | ✅ PASS |
```

### Detailed Findings by Dimension

#### Security (Score: 65/100) ⚠️
**Critical Issues**:
1. SQL Injection vulnerability in `api/users.ts:45`
2. Hardcoded API key in `config/secrets.ts:12`

**High Priority**:
1. Missing authentication on admin endpoints
2. Weak password requirements
3. CORS misconfiguration allows all origins

[... detailed breakdown ...]

#### Code Quality (Score: 78/100) ✅
**Strengths**:
- Consistent naming conventions
- Good use of TypeScript types
- Clean project structure

**Areas for Improvement**:
- High cyclomatic complexity in `processor.ts` (CC: 25)
- Long methods in `calculator.ts` (150+ lines)

[... detailed breakdown ...]

### Action Plan

#### Immediate Actions (< 24 hours)
1. **[P0-SEC-001]** Fix SQL injection in user API
   - File: `api/users.ts:45`
   - Action: Implement parameterized queries
   - Owner: Security team
   - Estimated time: 2 hours

2. **[P0-SEC-002]** Remove hardcoded credentials
   - File: `config/secrets.ts:12`
   - Action: Move to environment variables
   - Owner: DevOps team
   - Estimated time: 1 hour

#### Short-term Actions (< 1 week)
[... additional actions ...]

#### Long-term Actions (< 1 month)
[... additional actions ...]

## Example Usage

### Full Codebase Audit
```bash
# Trigger full audit
claude "Run comprehensive code quality audit on entire codebase"

# Output:
# - Security analysis report
# - Code quality metrics
# - Refactoring opportunities
# - Test coverage gaps
# - Documentation issues
# - Prioritized action plan
```

### Incremental Audit (PR Changes)
```bash
# Audit only changed files
claude "Run code quality audit on PR #123 changes"

# Faster execution, focused on:
# - New security vulnerabilities
# - Code quality regressions
# - Missing tests for new code
# - Documentation for new features
```

### Critical Path Audit
```bash
# Audit high-risk areas only
claude "Audit security and test coverage for payment processing module"

# Focused on:
# - Security analyst
# - Test coverage analyzer
# - Skip documentation and general quality checks
```

## Performance Optimization

### Parallel Execution Benefits
- **Sequential time**: ~30 minutes (6 agents × 5 min each)
- **Parallel time**: ~5 minutes (max agent time)
- **Time saved**: 83% faster

### Incremental Auditing
```typescript
// Cache previous audit results
const previousAudit = loadAuditCache();
const changedFiles = getChangedFiles(previousAudit.commit);

// Only audit changed files and dependencies
const incrementalAudit = await runIncrementalAudit(
  changedFiles,
  previousAudit
);
```

### Resource Management
```typescript
const resourceLimits = {
  maxParallelAgents: 5,
  maxMemoryPerAgent: '2GB',
  timeout: '10m'
};
```

## Integration Points

### CI/CD Pipeline
```yaml
# .github/workflows/quality-audit.yml
name: Code Quality Audit
on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Quality Audit
        run: claude-code orchestrate code-quality-audit --scope incremental
      - name: Post Results
        if: always()
        uses: actions/github-script@v6
        with:
          script: |
            // Post audit results as PR comment
```

### Quality Gates
```typescript
const qualityGates = {
  minOverallScore: 70,
  maxCriticalIssues: 0,
  maxBlockerIssues: 2,
  requiredPasses: ['security', 'testing']
};

if (!meetsQualityGates(auditReport, qualityGates)) {
  throw new Error('Quality gates not met - blocking merge');
}
```

## Customization

### Custom Agent Mix
```typescript
// Security-focused audit
const securityAudit = await orchestrateAudit({
  agents: ['security-analyst', 'dependency-scanner', 'secret-scanner'],
  scope: 'full'
});

// Maintenance-focused audit
const maintenanceAudit = await orchestrateAudit({
  agents: ['refactoring-expert', 'code-reviewer', 'documentation-writer'],
  scope: 'full'
});
```

### Custom Standards
```typescript
const enterpriseStandards = {
  security: {
    allowedDependencies: ['approved-list.json'],
    minSecurityScore: 90,
    requirePentesting: true
  },
  quality: {
    maxComplexity: 8,
    maxFunctionLength: 30,
    enforcePatterns: ['repository-pattern', 'factory-pattern']
  },
  testing: {
    minCoverage: 90,
    requireE2E: true,
    requirePerformanceTests: true
  }
};
```

## Benefits

### Comprehensive Assessment
- All quality dimensions covered simultaneously
- No blind spots in code review
- Consistent evaluation criteria

### Efficiency
- 5x faster than sequential analysis
- Automated vs manual review
- Repeatable and consistent results

### Actionable Insights
- Prioritized action plan
- Clear ownership assignments
- Measurable improvements

### Continuous Improvement
- Track quality trends over time
- Identify recurring patterns
- Measure technical debt reduction
