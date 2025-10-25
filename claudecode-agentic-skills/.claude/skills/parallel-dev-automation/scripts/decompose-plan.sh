#!/usr/bin/env bash
# decompose-plan.sh - Break down project plans into GitHub issues
#
# Usage: decompose-plan.sh <plan-file>
# Example: decompose-plan.sh project-plan.md

set -euo pipefail

PLAN_FILE="${1:-}"

if [ -z "$PLAN_FILE" ]; then
  echo "Error: Plan file required"
  echo "Usage: $0 <plan-file>"
  exit 1
fi

if [ ! -f "$PLAN_FILE" ]; then
  echo "Error: File not found: $PLAN_FILE"
  exit 1
fi

echo "🔍 Analyzing plan: $PLAN_FILE"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) is not installed"
  echo "Install: https://cli.github.com/"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "Error: Not authenticated with GitHub"
  echo "Run: gh auth login"
  exit 1
fi

# Read the plan file
PLAN_CONTENT=$(<"$PLAN_FILE")

# Use Claude to decompose the plan
echo "📋 Breaking down plan into tasks..."
echo ""

# Create a temporary file for Claude's response
TEMP_FILE=$(mktemp)

cat > "$TEMP_FILE" << EOF
Analyze this project plan and break it down into discrete, parallelizable GitHub issues.

For each task:
1. Create a clear, actionable title
2. Write a detailed description
3. List acceptance criteria
4. Identify dependencies (if any)
5. Estimate complexity (low/medium/high)
6. Assign appropriate labels (feat/fix/docs/etc)

Format each task as:
---
TITLE: [Task title]
LABELS: [comma-separated labels including claude-task]
COMPLEXITY: [low/medium/high]
PRIORITY: [p0/p1/p2/p3]
DEPENDENCIES: [list of task numbers this depends on, or "none"]

DESCRIPTION:
[Detailed description]

ACCEPTANCE CRITERIA:
- [ ] Criterion 1
- [ ] Criterion 2

TECHNICAL APPROACH:
[Brief implementation notes]
---

Project Plan:
$PLAN_CONTENT
EOF

# Note: This assumes Claude Code CLI or API integration
# You'll need to implement the actual Claude invocation based on your setup
echo "⚠️  Note: Actual Claude integration needed here"
echo "For now, review the plan manually and create issues"
echo ""
echo "Next steps:"
echo "1. Review the plan in: $PLAN_FILE"
echo "2. Create issues with: gh issue create"
echo "3. Add 'claude-task' label to trigger automation"
echo ""
echo "Example issue creation:"
echo "  gh issue create --title 'Add authentication' \\"
echo "    --body 'Implement OAuth integration' \\"
echo "    --label 'feat,claude-task,p1,complexity:medium'"

rm -f "$TEMP_FILE"
