#!/usr/bin/env bash
# task-dashboard.sh - Display dashboard of parallel development tasks
#
# Usage: task-dashboard.sh

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "📊 Parallel Development Dashboard"
echo "=================================="
echo ""

# Check for gh CLI
if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI required"
  exit 1
fi

# Get active claude-task issues
echo -e "${BLUE}Active Tasks:${NC}"
echo ""

ISSUES=$(gh issue list --label "claude-task" --state open --json number,title,labels,state --jq '.[]')

if [ -z "$ISSUES" ]; then
  echo "No active tasks found"
else
  echo "$ISSUES" | jq -r '"#\(.number) - \(.title)"'
fi

echo ""
echo -e "${BLUE}Active Pull Requests:${NC}"
echo ""

# Get PRs related to claude-task issues
PRS=$(gh pr list --label "automated" --json number,title,state,isDraft --jq '.[]')

if [ -z "$PRS" ]; then
  echo "No active PRs found"
else
  echo "$PRS" | jq -r 'if .isDraft then "#\(.number) - \(.title) (DRAFT)" else "#\(.number) - \(.title)" end'
fi

echo ""
echo -e "${BLUE}Recent Workflow Runs:${NC}"
echo ""

# Get recent workflow runs
gh run list --workflow=claude-dev.yml --limit 5 --json databaseId,status,conclusion,createdAt --jq '.[] | "\(.databaseId)\t\(.status)\t\(.conclusion)\t\(.createdAt)"' | while IFS=$'\t' read -r id status conclusion created; do
  case "$status" in
    "completed")
      if [ "$conclusion" = "success" ]; then
        echo -e "${GREEN}✓${NC} Run $id - Success"
      else
        echo -e "${RED}✗${NC} Run $id - $conclusion"
      fi
      ;;
    "in_progress")
      echo -e "${YELLOW}⏳${NC} Run $id - In Progress"
      ;;
    *)
      echo -e "  Run $id - $status"
      ;;
  esac
done

echo ""
echo "=================================="
echo "Use 'gh issue list --label claude-task' for more details"
echo "Use 'gh run view <run-id>' to see workflow details"
