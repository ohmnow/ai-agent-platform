---
name: parallel-dev-automation
description: Orchestrate autonomous parallel development using Claude Code instances and GitHub Actions. This skill should be used when breaking down project plans into tasks, creating GitHub issues, triggering parallel Claude Code development, managing automated PRs, and coordinating CI/CD workflows for team-scale autonomous development.
---

# Parallel Development Automation

Orchestrate autonomous parallel development by breaking down plans into GitHub issues, triggering Claude Code instances via CI/CD, and managing automated PR workflows with intelligent merge strategies.

## Overview

Transform project plans and PRDs into parallelized development workflows where multiple Claude Code instances work simultaneously on different features, automatically creating branches, implementing changes, generating PRs, and merging back to main with automated testing and intelligent conflict resolution.

## Workflow Architecture

### Phase 1: Plan Decomposition
1. Analyze project plan or PRD
2. Break down into discrete, parallelizable tasks
3. Identify dependencies between tasks
4. Order tasks by dependency chain
5. Estimate complexity and priority

### Phase 2: Issue Creation
1. Create GitHub issues from decomposed tasks
2. Add metadata (labels, complexity, dependencies)
3. Link related issues
4. Apply "claude-task" label for automation trigger
5. Set up dependency tracking

### Phase 3: Parallel Execution
1. GitHub Actions monitors for "claude-task" labeled issues
2. Triggers Claude Code instance for each issue
3. Claude creates feature branch
4. Implements changes following issue requirements
5. Runs tests locally
6. Creates PR with detailed description

### Phase 4: Integration & Merge
1. Automated CI runs tests on PR
2. If tests pass: Auto-merge to main
3. If tests fail: Attempt rebase once
4. If rebase fails: Request human review
5. Close linked issue on successful merge

## Prerequisites Check

Before starting autonomous development, verify:

### GitHub App Authentication
```bash
# Check if GitHub CLI is authenticated
gh auth status

# If not authenticated, login with GitHub App
gh auth login --web

# Verify repository access
gh repo view --json name,owner
```

### Required Permissions
- Read/Write access to Issues
- Read/Write access to Pull Requests
- Read/Write access to Actions
- Read/Write access to Contents

### Repository Setup
- GitHub Actions enabled
- Branch protection rules configured (optional)
- Required status checks defined
- Auto-merge settings enabled

## Task Decomposition Workflow

### From PRD to Issues

When given a PRD or project plan:

1. **Extract Features**
   - Identify major features/capabilities
   - Group related functionality
   - Note technical dependencies

2. **Break Down Features**
   - Split into implementable units (4-8 hours each)
   - Ensure each task is independently testable
   - Identify blocking dependencies

3. **Create Dependency Graph**
   ```
   Task A (foundation)
   ├── Task B (depends on A)
   ├── Task C (depends on A)
   └── Task D (depends on B, C)
   ```

4. **Prioritize & Label**
   - **Priority**: `p0` (critical), `p1` (high), `p2` (medium), `p3` (low)
   - **Complexity**: `complexity:low`, `complexity:medium`, `complexity:high`
   - **Type**: `feat`, `fix`, `docs`, `refactor`, `test`
   - **Automation**: `claude-task` (triggers automation)

### Issue Template Format

```markdown
## Description
Clear description of what needs to be implemented.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Approach
Brief outline of implementation approach.

## Dependencies
- Depends on #123
- Blocks #456

## Testing Requirements
- Unit tests required
- Integration tests required
- E2E tests (if applicable)

## Estimated Complexity
Medium (4-6 hours)
```

## GitHub Actions Automation

### Trigger Mechanism

Issues labeled with `claude-task` automatically trigger development:

1. **Issue Labeled Event** → GitHub Actions workflow starts
2. **Extract Issue Details** → Parse title, description, acceptance criteria
3. **Create Feature Branch** → `feat/issue-{number}-{slug}`
4. **Trigger Claude Code** → Run Claude via CLI or API
5. **Monitor Progress** → Track commits and status
6. **Create PR** → Automatic PR creation when complete

### Workflow Configuration

Reference the workflow template in `assets/claude-dev-workflow.yml`:

**Key Components:**
- Event trigger: `issues.labeled` with `claude-task`
- Checkout repository
- Setup Claude Code environment
- Execute development task
- Create PR with conventional commit format
- Run automated tests
- Handle merge or rebase

## PR Creation & Management

### Automated PR Format

```markdown
## Summary
[Auto-generated from issue description]

## Changes
- Implementation detail 1
- Implementation detail 2
- Implementation detail 3

## Testing
- [x] Unit tests added
- [x] Integration tests passing
- [ ] Manual testing required

## Closes
Closes #{issue-number}

## Checklist
- [x] Code follows project conventions
- [x] Tests added and passing
- [x] Documentation updated
- [x] No breaking changes (or marked with BREAKING CHANGE)
```

### Auto-Merge Strategy

**Success Path:**
```
PR Created → CI Tests Pass → Auto-Merge → Close Issue
```

**Rebase Path:**
```
PR Created → Tests Fail → Rebase Attempt → Tests Pass → Auto-Merge
```

**Human Review Path:**
```
PR Created → Tests Fail → Rebase Fails → Label: needs-review → Wait for Human
```

## Parallel Execution Management

### Dependency Resolution

Tasks without dependencies run immediately in parallel:

```
Independent Tasks (run in parallel):
- Task A: Setup authentication
- Task B: Create UI components
- Task C: Add analytics

Dependent Tasks (sequential):
- Task D: Integration tests (depends on A, B)
- Task E: Deployment config (depends on D)
```

### Conflict Prevention

1. **Scope Isolation**: Each task should modify different files
2. **Module Boundaries**: Clear separation of concerns
3. **Dependency Tracking**: Wait for blocking tasks to merge
4. **Rebase Strategy**: Automatically rebase on main before merge

### Monitoring Parallel Work

Use the helper script to monitor active development:

```bash
# Check all active Claude tasks
scripts/check-parallel-tasks.sh

# View task status dashboard
scripts/task-dashboard.sh

# Monitor specific issue
scripts/monitor-task.sh 123
```

## Error Handling & Recovery

### Common Failure Scenarios

**Merge Conflicts:**
1. Attempt automatic rebase
2. If conflicts detected, label `needs-rebase`
3. Request human intervention
4. Provide conflict resolution guide

**Test Failures:**
1. Retry tests once (flaky test protection)
2. If persistent failure, attempt rebase
3. After rebase, run tests again
4. If still failing, label `needs-debug`

**Dependency Issues:**
1. Verify dependent issues are closed
2. Ensure dependent PRs are merged
3. Rebase on latest main
4. Retry execution

### Recovery Procedures

**Stalled Task:**
```bash
# Check task status
scripts/check-task-status.sh 123

# Restart task
scripts/restart-task.sh 123

# Cancel and reassign
scripts/cancel-task.sh 123
gh issue comment 123 --body "Restarting task - previous attempt timed out"
```

## Usage Examples

### Example 1: New Feature Development

```bash
# 1. Create PRD file
cat > project-plan.md << 'EOF'
# User Authentication Feature
- OAuth integration
- Session management
- User profile pages
- Role-based access control
EOF

# 2. Decompose plan into issues
scripts/decompose-plan.sh project-plan.md

# 3. Review generated issues
gh issue list --label "claude-task"

# 4. Automation runs automatically
# Monitor progress:
scripts/task-dashboard.sh
```

### Example 2: Bug Fix Sprint

```bash
# 1. Label existing bugs for automation
gh issue list --label "bug" | while read -r issue; do
  gh issue edit "$issue" --add-label "claude-task"
done

# 2. Monitor parallel fixes
scripts/monitor-parallel-tasks.sh

# 3. Review PRs as they're created
gh pr list --label "automated"
```

### Example 3: Manual Task Initiation

```bash
# Create issue manually
gh issue create --title "Add dark mode support" \
  --body "Implement dark mode toggle and theme switching" \
  --label "feat,claude-task,p1"

# Automation triggers automatically
# Check status:
gh run list --workflow=claude-dev.yml
```

## Integration with Existing Workflow

### With Conventional Commits

This skill works seamlessly with the `conventional-commits` skill:
- Issues labeled by type (`feat`, `fix`, `docs`)
- PRs follow conventional commit format
- Automated changelog generation
- Semantic versioning support

### With Testing Strategy

Respects project testing requirements:
- Runs existing test suites
- Adds tests for new functionality
- Maintains code coverage thresholds
- Integration with CI/CD pipelines

### With Code Review Process

Balances automation with human oversight:
- Auto-merge for passing tests
- Human review for failed rebase
- Optional manual approval gates
- Reviewer assignment for complex changes

## Best Practices

### Task Sizing
- Keep tasks to 4-8 hours of work
- Break large features into smaller issues
- Ensure each task has clear acceptance criteria
- Make tasks independently testable

### Dependency Management
- Document dependencies explicitly
- Use GitHub issue linking
- Order tasks in dependency chains
- Allow parallel work where possible

### Quality Control
- Require tests for all changes
- Set code coverage thresholds
- Use linting and formatting checks
- Enable automated security scanning

### Monitoring & Metrics
- Track task completion rate
- Monitor average PR merge time
- Measure test pass rate
- Review conflict resolution frequency

## Troubleshooting

### Issue: Tasks Not Triggering

**Check:**
- Issue has `claude-task` label
- GitHub Actions is enabled
- Workflow file is in `.github/workflows/`
- GitHub App has correct permissions

**Solution:**
```bash
scripts/verify-setup.sh
```

### Issue: PRs Failing Tests

**Check:**
- Local tests pass before PR
- Dependencies are up to date
- No conflicts with main branch
- CI environment matches local

**Solution:**
```bash
scripts/debug-failing-pr.sh {pr-number}
```

### Issue: Merge Conflicts

**Check:**
- Task modified shared files
- Main branch updated during development
- Dependency changes not synced

**Solution:**
```bash
# Manual rebase
scripts/rebase-pr.sh {pr-number}

# Or re-trigger automation
scripts/retry-task.sh {issue-number}
```

## Advanced Configuration

### Custom Workflow Triggers

Modify `.github/workflows/claude-dev.yml` to customize:
- Trigger conditions (labels, comments, schedule)
- Claude Code configuration
- Test requirements
- Merge criteria

### Parallel Execution Limits

Control resource usage:
```yaml
# In workflow file
concurrency:
  group: claude-dev
  max_parallel: 5  # Max 5 tasks at once
```

### Notification Setup

Get updates on task progress:
```yaml
# In workflow file
notification:
  slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
  discord_webhook: ${{ secrets.DISCORD_WEBHOOK }}
  email: dev-team@example.com
```

## Security Considerations

### Token Management
- Use GitHub App tokens (not PAT)
- Rotate tokens regularly
- Limit token scope to necessary permissions
- Store tokens in GitHub Secrets

### Code Review
- Always review automated PRs
- Enable branch protection
- Require status checks
- Use CODEOWNERS for sensitive areas

### Access Control
- Limit who can add `claude-task` label
- Restrict workflow modifications
- Audit automation actions
- Monitor for suspicious activity

## Next Steps After Setup

1. **Verify Authentication**: Run `scripts/verify-setup.sh`
2. **Test with Sample Issue**: Create a simple task
3. **Monitor First Run**: Watch the automation process
4. **Refine Configuration**: Adjust based on results
5. **Scale Gradually**: Start with 2-3 parallel tasks
6. **Document Learnings**: Track what works well

## Related Skills

- **skill-creator**: Create custom skills for project-specific workflows
- **conventional-commits**: Ensure automated commits follow standards
- **document-skills**: Generate documentation from automated changes

## Reference Files

- `scripts/decompose-plan.sh` - Break down plans into issues
- `scripts/verify-setup.sh` - Check GitHub App authentication
- `scripts/task-dashboard.sh` - Monitor parallel tasks
- `assets/claude-dev-workflow.yml` - GitHub Actions workflow template
- `references/github-actions-guide.md` - Detailed CI/CD setup
