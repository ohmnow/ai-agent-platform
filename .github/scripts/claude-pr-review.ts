/**
 * Claude Code PR Review Script
 *
 * Runs automatically on PRs to review code, suggest fixes, and auto-commit improvements
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'child_process';

const PR_NUMBER = process.env.PR_NUMBER || '';
const BASE_BRANCH = process.env.BASE_BRANCH || 'main';
const HEAD_BRANCH = process.env.HEAD_BRANCH || '';

async function reviewPR() {
  console.log(`\n🤖 Claude Code PR Review Bot Starting...`);
  console.log(`📋 PR #${PR_NUMBER}: ${HEAD_BRANCH} -> ${BASE_BRANCH}\n`);

  // Get PR diff
  const diff = execSync(`git diff origin/${BASE_BRANCH}...HEAD`).toString();

  // Get changed files
  const changedFiles = execSync(`git diff --name-only origin/${BASE_BRANCH}...HEAD`)
    .toString()
    .split('\n')
    .filter(Boolean);

  console.log(`📝 Files changed: ${changedFiles.length}`);
  console.log(changedFiles.map(f => `  - ${f}`).join('\n'));

  // Create review prompt
  const reviewPrompt = `You are reviewing Pull Request #${PR_NUMBER}.

Changed files:
${changedFiles.map(f => `- ${f}`).join('\n')}

Git diff:
\`\`\`diff
${diff.slice(0, 10000)}
\`\`\`

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

If you find issues, fix them directly. Only make changes that are necessary and safe.`;

  try {
    console.log('\n🔍 Starting code review...\n');

    const result = query({
      prompt: reviewPrompt,
      options: {
        model: 'claude-sonnet-4',
        allowedTools: [
          'Read',
          'Write',
          'Edit',
          'Grep',
          'Glob',
          'Bash',
        ],
        maxTurns: 30,
        temperature: 0.2, // Lower temperature for more focused reviews
      }
    });

    let response = '';
    for await (const message of result) {
      if (message.type === 'text') {
        process.stdout.write(message.text);
        response += message.text;
      }

      if (message.type === 'assistant' && message.text) {
        console.log('\n📌 Review Summary:', message.text);
      }
    }

    console.log('\n\n✅ PR Review Complete!\n');

  } catch (error: any) {
    console.error('❌ PR Review Error:', error.message);
    process.exit(1);
  }
}

reviewPR();
