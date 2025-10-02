/**
 * Claude Code PR Review Script
 *
 * Runs automatically on PR branches to review code, suggest fixes, and auto-commit improvements
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'child_process';

// Get branch name from GitHub environment
const branchRef = process.env.GITHUB_REF || process.env.GITHUB_HEAD_REF || '';
const branchName = branchRef.replace('refs/heads/', '');
const baseBranch = process.env.GITHUB_BASE_REF || 'main';

async function reviewPR() {
  console.log(`\n🤖 Claude Code PR Review Bot Starting...`);
  console.log(`📋 Branch: ${branchName} -> ${baseBranch}\n`);

  if (!branchName || !branchName.match(/^(feature|fix)\//)) {
    console.log('⏭️  Skipping - not a feature or fix branch');
    return;
  }

  // Get PR diff
  const diff = execSync(`git diff origin/${baseBranch}...HEAD`).toString();

  // Get changed files
  const changedFiles = execSync(`git diff --name-only origin/${baseBranch}...HEAD`)
    .toString()
    .split('\n')
    .filter(Boolean);

  if (changedFiles.length === 0) {
    console.log('⏭️  No files changed, skipping review');
    return;
  }

  console.log(`📝 Files changed: ${changedFiles.length}`);
  console.log(changedFiles.map(f => `  - ${f}`).join('\n'));

  // Read PR description from branch name or documentation
  const prTitle = branchName.replace(/^(feature|fix)\//, '').replace(/-/g, ' ');

  // Find any task documentation files
  let taskDescription = '';
  const docFiles = changedFiles.filter(f => f.endsWith('.md') || f.includes('README'));
  if (docFiles.length > 0) {
    try {
      taskDescription = execSync(`cat ${docFiles[0]}`).toString().slice(0, 2000);
    } catch (e) {
      // File might not exist yet
    }
  }

  // Create review prompt
  const reviewPrompt = `You are implementing a feature on branch "${branchName}".

${taskDescription ? `## Task Description\n${taskDescription}\n\n` : ''}

## Changed Files
${changedFiles.map(f => `- ${f}`).join('\n')}

## Git Diff
\`\`\`diff
${diff.slice(0, 15000)}
\`\`\`

## Your Task

Please implement the feature described in the task description above.

Focus on:
1. **Reading existing code** to understand the codebase structure
2. **Implementing the feature** according to the task description
3. **Following existing patterns** in the codebase
4. **Type safety** and error handling
5. **Testing** if test files are included

**Guidelines:**
- Use Read tool to understand existing code before making changes
- Use Edit tool to make surgical changes to existing files
- Use Write tool only for new files
- Use Grep/Glob to find relevant code patterns
- Follow TypeScript best practices
- Add comments for complex logic
- Handle errors appropriately

**DO:**
- Read existing similar code to match style
- Implement the specific feature requested
- Make focused, purposeful changes
- Test your changes if possible

**DON'T:**
- Make unnecessary changes outside the feature scope
- Rewrite existing working code unless needed
- Add features not requested
- Break existing functionality

Start by reading the relevant files to understand the codebase, then implement the feature.`;

  try {
    console.log('\n🔍 Starting implementation...\n');

    const result = query({
      prompt: reviewPrompt,
      options: {
        model: 'claude-sonnet-4-20250514',
        allowedTools: [
          'Read',
          'Write',
          'Edit',
          'Grep',
          'Glob',
          'Bash',
        ],
        maxTurns: 50,
        temperature: 0.3, // Slightly higher for implementation creativity
      }
    });

    let response = '';
    for await (const message of result) {
      if (message.type === 'text') {
        process.stdout.write(message.text);
        response += message.text;
      }

      if (message.type === 'tool_use') {
        console.log(`\n🔧 Using tool: ${message.toolName}`);
      }

      if (message.type === 'result') {
        console.log('\n📌 Implementation Result:', message.result?.substring(0, 200));
      }
    }

    console.log('\n\n✅ PR Implementation Complete!\n');

  } catch (error: any) {
    console.error('❌ PR Review Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Only run if API key is set
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set');
  process.exit(1);
}

reviewPR();
