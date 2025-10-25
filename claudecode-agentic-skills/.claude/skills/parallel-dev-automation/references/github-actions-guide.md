# GitHub Actions Integration Guide

Complete guide for setting up Claude Code automation with GitHub Actions.

## Prerequisites

### 1. GitHub CLI Installation

```bash
# macOS
brew install gh

# Windows
winget install --id GitHub.cli

# Linux
sudo apt install gh
```

### 2. Authentication

```bash
# Login with GitHub App (recommended)
gh auth login --web

# Select:
# - GitHub.com
# - HTTPS
# - Login with browser
# - Authenticate

# Verify
gh auth status
```

### 3. Repository Setup

```bash
# Navigate to your repository
cd /path/to/your/repo

# Verify remote
gh repo view

# Check permissions
gh api user/repos/{owner}/{repo} --jq '.permissions'
```

## Setting Up the Workflow

### Step 1: Copy Workflow File

```bash
# Create workflows directory
mkdir -p .github/workflows

# Copy template
cp .claude/skills/parallel-dev-automation/assets/claude-dev-workflow.yml \
   .github/workflows/claude-dev.yml
```

### Step 2: Configure Branch Protection (Optional)

```bash
# Enable branch protection for main
gh api repos/{owner}/{repo}/branches/main/protection -X PUT -f \
  required_status_checks=null \
  enforce_admins=false \
  required_pull_request_reviews=null \
  restrictions=null
```

### Step 3: Create Required Labels

```bash
# Create claude-task label
gh label create claude-task \
  --description "Trigger automated development" \
  --color 7B68EE

# Create automated label
gh label create automated \
  --description "Created by automation" \
  --color 0E8A16

# Create complexity labels
gh label create "complexity:low" --color D4C5F9
gh label create "complexity:medium" --color C2E0C6
gh label create "complexity:high" --color F9D0C4

# Create priority labels
gh label create p0 --description "Critical" --color B60205
gh label create p1 --description "High" --color D93F0B
gh label create p2 --description "Medium" --color FBCA04
gh label create p3 --description "Low" --color 0E8A16
```

### Step 4: Enable Actions

```bash
# Check if Actions are enabled
gh api repos/{owner}/{repo}/actions/permissions

# Enable if needed
gh api repos/{owner}/{repo}/actions/permissions -X PUT -f \
  enabled=true \
  allowed_actions=all
```

## Claude Code Integration

### Option 1: Claude Code CLI (Future)

```yaml
- name: Run Claude Code
  run: |
    npx claude-code execute \
      --issue ${{ github.event.issue.number }} \
      --branch ${{ steps.issue.outputs.branch }}
```

### Option 2: Claude Code API (Future)

```yaml
- name: Call Claude Code API
  uses: actions/github-script@v7
  with:
    script: |
      const response = await fetch('https://api.claude.com/code/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${{ secrets.CLAUDE_API_KEY }}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          issue: context.issue.number,
          repository: context.repo
        })
      });
```

### Option 3: Manual Trigger (Current)

For now, the workflow creates placeholder commits. You can:

1. Monitor the created branch
2. Manually check it out
3. Use Claude Code locally
4. Push changes
5. The PR will update automatically

## Workflow Triggers

### Automatic Label Trigger

Issues labeled with `claude-task` automatically start development:

```bash
# Create issue with label
gh issue create \
  --title "Add user authentication" \
  --body "Implement OAuth login flow" \
  --label "feat,claude-task,p1"
```

### Manual Workflow Dispatch

Add to workflow file:

```yaml
on:
  issues:
    types: [labeled]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to process'
        required: true
        type: number
```

Then trigger:

```bash
gh workflow run claude-dev.yml \
  -f issue_number=123
```

## Auto-Merge Configuration

### Enable Auto-Merge

```yaml
- name: Enable auto-merge
  if: success()
  run: |
    gh pr merge ${{ steps.pr.outputs.pr_number }} \
      --auto \
      --squash \
      --delete-branch
```

### With Status Checks

```yaml
# Require status checks to pass
- name: Wait for checks
  uses: fountainhead/action-wait-for-check@v1.1.0
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    checkName: test
    ref: ${{ steps.issue.outputs.branch }}

- name: Auto-merge if passed
  if: success()
  run: gh pr merge ${{ steps.pr.outputs.pr_number }} --auto --squash
```

## Parallel Execution

### Limit Concurrent Tasks

```yaml
concurrency:
  group: claude-dev
  max-parallel: 5
```

### Per-Issue Concurrency

```yaml
concurrency:
  group: claude-dev-${{ github.event.issue.number }}
  cancel-in-progress: false
```

## Monitoring and Debugging

### View Workflow Runs

```bash
# List recent runs
gh run list --workflow=claude-dev.yml

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### Debug Failed Runs

```bash
# Get run details
gh api runs/<run-id> --jq '.jobs[]'

# Re-run failed jobs
gh run rerun <run-id> --failed
```

### Monitor Active Tasks

```bash
# Use the dashboard script
.claude/skills/parallel-dev-automation/scripts/task-dashboard.sh

# Or manually
gh issue list --label "claude-task" --state open
gh pr list --label "automated"
```

## Secrets Management

### Add Secrets

```bash
# Via CLI
gh secret set CLAUDE_API_KEY

# Via web UI
# Settings → Secrets and variables → Actions → New repository secret
```

### Use in Workflow

```yaml
env:
  CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

## Troubleshooting

### Workflow Not Triggering

1. Check label name matches exactly: `claude-task`
2. Verify Actions are enabled
3. Check workflow file is in `.github/workflows/`
4. Verify permissions in workflow

```bash
# Debug
gh api repos/{owner}/{repo}/actions/runs --jq '.workflow_runs[0]'
```

### Permission Errors

```yaml
# Add to job
permissions:
  issues: write
  pull-requests: write
  contents: write
  actions: read
```

### Branch Already Exists

```yaml
- name: Create or update branch
  run: |
    if git show-ref --verify --quiet refs/heads/${{ steps.issue.outputs.branch }}; then
      git checkout ${{ steps.issue.outputs.branch }}
      git pull origin main
    else
      git checkout -b ${{ steps.issue.outputs.branch }}
    fi
```

## Best Practices

### 1. Use GitHub App Tokens

More secure and better rate limits than personal access tokens.

### 2. Implement Retry Logic

```yaml
- name: Development Task
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 30
    max_attempts: 3
    command: |
      # Your Claude Code command here
```

### 3. Add Notifications

```yaml
- name: Notify on completion
  if: always()
  uses: actions/github-script@v7
  with:
    script: |
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: 'Status: ${{ job.status }}'
      });
```

### 4. Cache Dependencies

```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.cache
    key: ${{ runner.os }}-cache-${{ hashFiles('**/package-lock.json') }}
```

### 5. Use Matrix Strategy

For testing across multiple environments:

```yaml
strategy:
  matrix:
    node: [16, 18, 20]
steps:
  - uses: actions/setup-node@v3
    with:
      node-version: ${{ matrix.node }}
```

## Advanced Features

### Dependency Management

```yaml
- name: Check dependencies
  uses: actions/github-script@v7
  with:
    script: |
      const issue = context.payload.issue;
      const body = issue.body;

      // Extract dependency references
      const depMatches = body.match(/depends on #(\d+)/gi);

      if (depMatches) {
        for (const match of depMatches) {
          const depNumber = parseInt(match.match(/\d+/)[0]);

          const { data: depIssue } = await github.rest.issues.get({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: depNumber
          });

          if (depIssue.state === 'open') {
            throw new Error(`Dependency #${depNumber} is still open`);
          }
        }
      }
```

### Rebase on Failure

```yaml
- name: Rebase if tests fail
  if: failure()
  run: |
    git fetch origin main
    git rebase origin/main
    git push --force-with-lease
```

### Custom PR Templates

Create `.github/pull_request_template.md`:

```markdown
## Summary
<!-- Auto-filled by workflow -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests passing
- [ ] Integration tests passing

## Checklist
- [ ] Code follows style guide
- [ ] Self-review completed
- [ ] Documentation updated
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Script Action](https://github.com/actions/github-script)
