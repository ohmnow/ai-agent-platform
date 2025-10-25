# Project Documentation Templates

This directory contains **reusable templates** for starting new agentic development projects.

## Available Templates

### 1. [technical-specs-template.md](./technical-specs-template.md)
Template for comprehensive technical specifications including:
- System architecture
- Technology stack
- Database schema
- API specifications
- Agent architecture
- Security & deployment

**When to use**: Start of any new project to define technical approach

### 2. [github-issues-template.md](./github-issues-template.md)
Template for breaking down projects into parallelizable GitHub issues:
- Issue organization by phase
- Dependency tracking
- Complexity estimation
- Automation labels

**When to use**: After technical specs complete, before development starts

### 3. [features-template.md](./features-template.md)
Template for detailed feature specifications:
- User workflows
- Use cases
- Technical implementation notes
- Acceptance criteria

**When to use**: When planning features and user experience

### 4. [agent-spec-template.md](./agent-spec-template.md)
Template for documenting individual agents:
- Agent purpose and methodology
- Input/output schemas
- Prompt engineering details
- Testing approach

**When to use**: When creating specialized agents for your project

## How to Use These Templates

### For EstimateFlow Project
The current `project-docs/*.md` files are **completed versions** of these templates, specifically for EstimateFlow.

### For New Projects

1. **Copy this template repository**:
   ```bash
   gh repo create my-new-project --template your-username/claudecode-agentic-skills
   cd my-new-project
   ```

2. **Use templates as starting point**:
   ```bash
   cp project-docs/templates/technical-specs-template.md project-docs/technical-specs.md
   cp project-docs/templates/github-issues-template.md project-docs/github-issues.md
   # Edit to fit your new project
   ```

3. **Create project-specific agents**:
   ```bash
   # Copy agent templates from sub-agent-orchestration skill
   cp .claude/skills/sub-agent-orchestration/assets/agent-templates/code-reviewer.md \
      .claude/agents/code-reviewer.md

   # Customize for your project
   ```

4. **Set up GitHub issues**:
   - Use github-issues-template.md to create issues
   - Label with `claude-task` for automation
   - Use parallel-dev-automation skill

## Customization Guide

Each template includes:
- `{{PLACEHOLDERS}}` - Replace with project-specific values
- `[EXAMPLES]` - Replace with your actual content
- `TODO:` comments - Sections requiring decisions

Search for these markers and fill in your project details.

## Next Steps

After filling out templates:
1. Review technical specs with team
2. Create GitHub issues from breakdown
3. Set up development environment
4. Begin parallel development with `claude-task` labels
