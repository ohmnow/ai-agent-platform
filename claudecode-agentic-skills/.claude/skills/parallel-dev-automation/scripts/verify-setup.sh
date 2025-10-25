#!/usr/bin/env bash
# verify-setup.sh - Verify GitHub App authentication and permissions
#
# Usage: verify-setup.sh

set -euo pipefail

echo "🔍 Verifying Parallel Development Automation Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: GitHub CLI installed
echo "Checking GitHub CLI..."
if command -v gh &> /dev/null; then
  VERSION=$(gh --version | head -n 1)
  check_pass "GitHub CLI installed: $VERSION"
else
  check_fail "GitHub CLI not installed"
  echo "   Install from: https://cli.github.com/"
  exit 1
fi

# Check 2: Authentication status
echo ""
echo "Checking authentication..."
if gh auth status &> /dev/null; then
  ACCOUNT=$(gh api user --jq '.login')
  check_pass "Authenticated as: $ACCOUNT"
else
  check_fail "Not authenticated with GitHub"
  echo "   Run: gh auth login"
  exit 1
fi

# Check 3: Repository access
echo ""
echo "Checking repository access..."
if REPO_INFO=$(gh repo view --json name,owner 2>&1); then
  REPO_NAME=$(echo "$REPO_INFO" | jq -r '.name')
  REPO_OWNER=$(echo "$REPO_INFO" | jq -r '.owner.login')
  check_pass "Repository: $REPO_OWNER/$REPO_NAME"
else
  check_fail "Not in a GitHub repository"
  echo "   Navigate to a git repository with a GitHub remote"
  exit 1
fi

# Check 4: Required permissions
echo ""
echo "Checking permissions..."

# Check if we can create issues
if gh api repos/{owner}/{repo}/issues/1 &> /dev/null || gh api repos/{owner}/{repo}/issues &> /dev/null; then
  check_pass "Issues: Read/Write access"
else
  check_warn "Issues: Unable to verify access"
fi

# Check if we can create PRs
if gh api repos/{owner}/{repo}/pulls &> /dev/null; then
  check_pass "Pull Requests: Read/Write access"
else
  check_warn "Pull Requests: Unable to verify access"
fi

# Check if Actions are enabled
if gh api repos/{owner}/{repo}/actions/permissions &> /dev/null; then
  check_pass "GitHub Actions: Enabled"
else
  check_warn "GitHub Actions: Unable to verify"
fi

# Check 5: Workflow file
echo ""
echo "Checking GitHub Actions workflow..."
if [ -f ".github/workflows/claude-dev.yml" ]; then
  check_pass "Workflow file exists: .github/workflows/claude-dev.yml"
else
  check_warn "Workflow file not found"
  echo "   Copy template from: .claude/skills/parallel-dev-automation/assets/claude-dev-workflow.yml"
  echo "   To: .github/workflows/claude-dev.yml"
fi

# Check 6: Labels
echo ""
echo "Checking labels..."
if gh label list --json name --jq '.[] | select(.name=="claude-task")' &> /dev/null; then
  check_pass "Label 'claude-task' exists"
else
  check_warn "Label 'claude-task' not found"
  echo "   Create with: gh label create claude-task --description 'Trigger automated development' --color 7B68EE"
fi

# Summary
echo ""
echo "=================================================="
echo "Setup Verification Complete"
echo ""
echo "Next steps:"
echo "1. If any checks failed, address them before continuing"
echo "2. Copy the workflow template if needed"
echo "3. Create a test issue with 'claude-task' label"
echo "4. Monitor workflow execution with: gh run list"
