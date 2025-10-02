# GitHub Actions + Claude Code Integration

This guide explains how to set up Claude Code to automatically review PRs via GitHub Actions.

## 🎯 What This Does

When you create a pull request, GitHub Actions will:
1. ✅ Run standard CI tests (TypeScript, linting, performance)
2. 🤖 Launch a Claude Code instance to review the code
3. 🔧 Auto-commit fixes for issues found
4. 📝 Comment on the PR with review results

## 🔑 Setup Instructions

### 1. Add Anthropic API Key to GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key from https://console.anthropic.com

### 2. Workflows

Two workflows are configured:

#### `ci.yml` - Standard CI Tests
- Runs on every push and PR
- Tests database migrations
- Runs performance benchmarks
- Validates TypeScript compilation

#### `pr-review.yml` - Claude Code Reviews
- Runs on PR open, sync, and reopen
- Reviews code changes
- Fixes TypeScript errors
- Checks best practices
- Auto-commits improvements

## 🚀 How It Works

### Workflow Triggers

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [ main, develop ]
```

### Claude Code Review Script

Location: `.github/scripts/claude-pr-review.ts`

The script:
1. Gets PR diff and changed files
2. Sends to Claude with review instructions
3. Claude reads files, identifies issues, makes fixes
4. Changes are auto-committed back to the PR branch

### Example PR Flow

```bash
# Create feature branch
git checkout -b feature/new-agent

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "feat: Add new agent"
git push -u origin feature/new-agent

# Create PR
gh pr create --title "Add new agent" --body "Implements XYZ"

# 🤖 GitHub Actions automatically:
# 1. Runs CI tests
# 2. Claude reviews code
# 3. Claude fixes issues
# 4. Commits fixes to your branch
# 5. You review and merge
```

## 🔧 Configuration

### Customize Review Behavior

Edit `.github/scripts/claude-pr-review.ts`:

```typescript
const result = query({
  prompt: reviewPrompt,
  options: {
    model: 'claude-sonnet-4',
    allowedTools: [
      'Read',      // Read files
      'Write',     // Create new files
      'Edit',      // Modify existing files
      'Grep',      // Search code
      'Glob',      // Find files
      'Bash',      // Run commands
    ],
    maxTurns: 30,           // Max conversation turns
    temperature: 0.2,       // Lower = more focused
  }
});
```

### Control What Claude Can Fix

Modify the `allowedTools` array:
- Remove `Write` to prevent new file creation
- Remove `Edit` to make Claude read-only
- Add `WebSearch` to allow research

### Change Review Instructions

Edit the `reviewPrompt` in `claude-pr-review.ts`:

```typescript
const reviewPrompt = `You are reviewing Pull Request #${PR_NUMBER}.

Please review this PR and:
1. Check for TypeScript errors
2. Verify code quality and best practices
3. Look for potential bugs or security issues
4. Ensure tests are included if needed
5. Fix any issues you find by editing the files directly

Focus on:
- Type safety
- Error handling
- Performance considerations
- Code consistency with the project
`;
```

## 📊 Monitoring

### View Workflow Runs

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# Watch live
gh run watch
```

### Check Claude's Changes

Claude commits with this format:
```
🤖 Claude Code: Auto-fixes from PR review

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🛡️ Security

### API Key Protection
- Never commit `ANTHROPIC_API_KEY` to code
- Only store in GitHub Secrets
- Rotate keys periodically

### Permissions
The workflow has these permissions:
```yaml
permissions:
  contents: write        # Can commit to PR branch
  pull-requests: write   # Can comment on PRs
```

### Trust Boundary
- Claude only modifies PR branch (not main)
- You review Claude's changes before merging
- CI tests still run after Claude's commits

## 🎛️ Advanced Features

### Parallel Reviews

Run multiple specialized reviews:

```yaml
- name: Run security review
  run: npx tsx .github/scripts/claude-security-review.ts

- name: Run performance review
  run: npx tsx .github/scripts/claude-performance-review.ts
```

### Review Comments

Have Claude comment on PRs instead of auto-committing:

```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

await octokit.pulls.createReview({
  owner: 'your-org',
  repo: 'your-repo',
  pull_number: PR_NUMBER,
  body: claudeReviewSummary,
  event: 'COMMENT'
});
```

### Conditional Auto-Fix

Only auto-fix certain types of issues:

```typescript
if (issueType === 'typescript-error' || issueType === 'missing-semicolon') {
  // Auto-fix
  await fixIssue();
} else {
  // Just comment
  await commentOnPR(`Found issue: ${description}`);
}
```

## 🐛 Troubleshooting

### "API Key Not Found"
- Check secret name is exactly `ANTHROPIC_API_KEY`
- Verify secret is set at repository level (not organization)

### "Permission Denied" on Git Push
- Check workflow has `contents: write` permission
- Verify branch protection rules allow bot commits

### Claude Not Making Changes
- Check `allowedTools` includes `Edit` and `Write`
- Increase `maxTurns` if review is complex
- Check logs: `gh run view --log`

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/typescript)
- [Anthropic API Keys](https://console.anthropic.com)

## 💡 Tips

1. **Start Conservative**: Begin with read-only reviews (no `Edit`/`Write` tools)
2. **Monitor Costs**: Each PR review uses API credits
3. **Limit Scope**: Use `git diff --name-only` to only review changed files
4. **Set Budgets**: Use workflow timeouts to prevent runaway costs
5. **Gradual Trust**: Review Claude's commits carefully at first
