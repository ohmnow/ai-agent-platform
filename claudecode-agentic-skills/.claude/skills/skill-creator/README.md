# Claude Code Agentic Skills

This repository demonstrates how to set up and use Claude Code skills in your projects.

## What Are Skills?

Skills are modular extensions that enhance Claude's capabilities. They're **autonomously invoked** by Claude based on your request - you don't need to explicitly call them like slash commands.

## Project Structure

```
.claude/
└── skills/
    └── skill-creator/          # Skill for creating new skills
        ├── SKILL.md            # Main skill definition
        ├── LICENSE.txt         # MIT License
        └── scripts/
            ├── init_skill.py       # Initialize new skills
            ├── package_skill.py    # Package skills for distribution
            └── quick_validate.py   # Validate skill structure
```

## Available Skills

### skill-creator

The `skill-creator` skill guides you through creating effective skills. It provides:

- **6-step creation process**: From understanding use cases to iteration
- **Helper scripts**: Initialize, validate, and package skills
- **Best practices**: Progressive disclosure, proper structure, clear descriptions

**When to use**: When you want to create a new skill or update an existing skill that extends Claude's capabilities.

## Creating Your First Skill

1. **Ask Claude to create a skill**:
   ```
   "Help me create a skill for [your use case]"
   ```

2. **Or use the init script directly**:
   ```bash
   python3 .claude/skills/skill-creator/scripts/init_skill.py my-skill --path .claude/skills
   ```

3. **Edit the generated SKILL.md** to complete TODO items

4. **Validate your skill**:
   ```bash
   python3 .claude/skills/skill-creator/scripts/quick_validate.py .claude/skills/my-skill
   ```

5. **Package for distribution**:
   ```bash
   python3 .claude/skills/skill-creator/scripts/package_skill.py .claude/skills/my-skill
   ```

## Skill Anatomy

Every skill requires a `SKILL.md` file with:

```yaml
---
name: skill-name
description: Clear description of what this does and when Claude should use it
---

# Skill Name

## Overview
[Brief explanation]

## Instructions
[Step-by-step guidance for Claude]
```

### Optional Bundled Resources

- **scripts/**: Executable code (Python/Bash) for automation
- **references/**: Documentation loaded as needed into context
- **assets/**: Files used in output (templates, images, etc.)

## How Skills Work

### Discovery & Loading
Claude Code automatically scans for skills in:
1. **Personal**: `~/.claude/skills/` (your machine)
2. **Project**: `.claude/skills/` (in your repo)
3. **Plugins**: Bundled with installed plugins

### Progressive Disclosure
Skills use a three-level loading system:
1. **Metadata** (~100 words) - Always in context
2. **SKILL.md body** (<5k words) - Loaded when skill triggers
3. **Bundled resources** (Unlimited) - Loaded as needed

### Activation
Unlike slash commands, skills are **model-invoked**:
```
User Request → Claude analyzes → Matches description →
Loads SKILL.md → Executes with tools → Returns result
```

## Best Practices

1. **Clear descriptions**: Include WHEN to use the skill with specific trigger terms
2. **Keep skills focused**: One clear purpose per skill
3. **Use imperative language**: "To accomplish X, do Y" (not "You should...")
4. **Leverage bundled resources**: Keep SKILL.md lean, detailed info in references/
5. **Restrict tools**: Use `allowed-tools` field for read-only or security-sensitive workflows

## Team Collaboration

Project skills in `.claude/skills/` automatically sync with your team:

```bash
git add .claude/skills/
git commit -m "Add new skill"
git push
```

Team members get access when they pull - no manual installation needed.

## Resources

- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills.md)
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Claude Code Plugins](https://docs.claude.com/en/docs/claude-code/plugins.md)

## License

The skill-creator skill is licensed under the MIT License (see [.claude/skills/skill-creator/LICENSE.txt](.claude/skills/skill-creator/LICENSE.txt)).
