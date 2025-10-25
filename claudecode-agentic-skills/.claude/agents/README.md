# Agent Templates

This directory contains **template agent definitions** that can be copied to new projects.

## What Goes Here (Template Repository)

Example/template agents that demonstrate best practices:
- Example photo analyzer agent
- Example API integration agent
- Example data processor agent
- Template structure showing proper frontmatter

## What Goes in Project Repositories

**Actual project-specific agents** should live in the `.claude/agents/` directory of each project:

```
your-project/
└── .claude/
    └── agents/
        ├── photo-analyzer.md        # Project-specific
        ├── voice-transcriber.md     # Project-specific
        └── custom-agent.md          # Project-specific
```

## Creating Agents for Your Project

When starting a new project from this template:

1. **Copy this template repository**
2. **Create project-specific agents** in `.claude/agents/`
3. **Reference the sub-agent-orchestration skill** for patterns and best practices

See: [/.claude/skills/sub-agent-orchestration/](../skills/sub-agent-orchestration/) for detailed agent creation guidance.

## Agent File Structure

```markdown
---
name: agent-name
description: Clear description of what this agent does. Use PROACTIVELY when [trigger].
tools: Read, Write, Grep, Bash
model: sonnet
---

# Agent Name

## Purpose
What this agent does

## Methodology
How it approaches tasks

## Output Format
Expected deliverables
```

## Example Agents

See `/.claude/skills/sub-agent-orchestration/assets/agent-templates/` for production-quality examples:
- code-reviewer.md
- test-engineer.md
- documentation-writer.md
- refactoring-expert.md
- security-analyst.md
