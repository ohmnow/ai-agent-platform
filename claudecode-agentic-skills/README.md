# Claude Code Agentic Skills

**Dual-Purpose Repository**:
1. **GitHub Template** - Reusable foundation for building AI-agent-powered applications
2. **EstimateFlow Project Checkpoint** - Complete MVP documentation for construction estimating platform

This repository contains:
- **Reusable Claude Code Skills** for any project (sub-agent orchestration, parallel development automation)
- **EstimateFlow Documentation** - Full technical specs, 39 GitHub issues, agent architecture ([see project-docs/](./project-docs/))
- **Project Templates** - Start new agentic projects quickly

---

## 🚀 Two Ways to Use This Repository

### Use Case 1: Start EstimateFlow Development
EstimateFlow documentation is complete and ready for implementation:
- **[Read Project Summary](./project-docs/PROJECT-SUMMARY.md)** - Quick overview
- **[Review Technical Specs](./project-docs/technical-specs.md)** - Complete architecture
- **[See GitHub Issues](./project-docs/github-issues.md)** - 39 parallelizable issues
- **[Understand Features](./project-docs/features.md)** - Detailed specifications

**Next Steps**: [Create EstimateFlow project repository](./GITHUB-WORKFLOW.md#creating-estimateflow-project-repository)

### Use Case 2: Start a New Agentic Project
Use this as a template for any AI-agent-powered application:
1. Click "Use this template" on GitHub
2. Copy [project documentation templates](./project-docs/templates/)
3. Leverage skills: sub-agent-orchestration, parallel-dev-automation
4. Follow the same pattern: plan → issues → parallel development

**Guide**: [GitHub Workflow & Template Usage](./GITHUB-WORKFLOW.md)

---

## What Are Skills?

Skills are modular extensions that enhance Claude's capabilities. They're **autonomously invoked** by Claude based on your request - you don't need to explicitly call them like slash commands.

## What Are Skills?

Skills are modular extensions that enhance Claude's capabilities. They're **autonomously invoked** by Claude based on your request - you don't need to explicitly call them like slash commands.

## Project Structure

```
.claude/
└── skills/
    ├── document-skills/        # Core foundational document processing skills
    │   ├── docx/              # Word document creation & editing
    │   ├── pdf/               # PDF manipulation toolkit
    │   ├── pptx/              # PowerPoint presentation creation
    │   └── xlsx/              # Excel spreadsheet processing
    │
    ├── skill-creator/         # Meta skill for creating new skills
    │   ├── SKILL.md           # Main skill definition
    │   ├── LICENSE.txt        # MIT License
    │   └── scripts/
    │       ├── init_skill.py      # Initialize new skills
    │       ├── package_skill.py   # Package skills for distribution
    │       └── quick_validate.py  # Validate skill structure
    │
    └── [your-custom-skills]/  # Add your custom skills here
```

### Skill Organization

- **document-skills/**: Production-quality document processing skills from Anthropic. These serve as foundational capabilities and reference examples for building complex skills.
- **skill-creator/**: Meta skill that guides you through creating new skills.
- **Custom skills**: Create your own skills at `.claude/skills/your-skill-name/` (not inside document-skills/)

## Available Skills

### Document Skills (Core)

Production-quality skills from Anthropic for working with common document formats:

#### docx
Comprehensive Word document creation, editing, and analysis with:
- Tracked changes and comments
- Formatting preservation
- Text extraction
- Professional document workflows

#### pdf
PDF manipulation toolkit for:
- Extracting text and tables
- Creating new PDFs
- Merging/splitting documents
- Handling forms

#### pptx
PowerPoint presentation creation and editing with:
- Layouts and templates
- Charts and visualizations
- Automated slide generation

#### xlsx
Excel spreadsheet processing with:
- Formulas and formatting
- Data analysis
- Visualization capabilities

### skill-creator (Meta Skill)

The `skill-creator` skill guides you through creating effective skills. It provides:

- **6-step creation process**: From understanding use cases to iteration
- **Helper scripts**: Initialize, validate, and package skills
- **Best practices**: Progressive disclosure, proper structure, clear descriptions
- **References to default skills**: Learn from production-quality examples

**When to use**: When you want to create a new skill or update an existing skill that extends Claude's capabilities.

### Custom Skills

#### conventional-commits

Generate git commit messages following the Conventional Commits specification:
- Semantic commit types (feat, fix, docs, etc.)
- Scoped commits for better organization
- Breaking change notation
- Integration with automated changelog tools

**When to use**: When creating git commits, especially when you ask to commit changes or follow conventional commit standards.

#### parallel-dev-automation

Orchestrate autonomous parallel development using Claude Code instances and GitHub Actions:
- Break down project plans into GitHub issues
- Trigger automated development on labeled issues
- Manage parallel Claude Code instances via CI/CD
- Create PRs automatically with smart merge strategies
- Handle test failures and conflicts with automated rebase

**When to use**: When working on complex projects that need to be broken down into parallelizable tasks, or when you want to leverage GitHub Actions for autonomous development at scale.

**Example**: EstimateFlow project uses this skill - see [github-issues.md](./project-docs/github-issues.md) for 39 parallelizable issues.

#### sub-agent-orchestration

Orchestrate complex multi-agent workflows for maximum efficiency:
- Coordinate multiple specialized AI agents
- Execute tasks in parallel or sequence
- Break down complex features into specialized work units
- Create purpose-built agents for specific domains

**When to use**: Complex features requiring different expertise (frontend + backend + tests), large-scale changes, quality assurance workflows.

**Example**: EstimateFlow uses 8 specialized agents (photo analyzer, voice transcriber, hours estimator, etc.) working in parallel/sequence.

## Creating Your First Custom Skill

### Option 1: Ask Claude (Recommended)

Simply ask Claude to help you create a skill:
```
"Help me create a skill for [your use case]"
```

Claude will use the skill-creator skill to guide you through the process.

### Option 2: Use the Init Script Directly

```bash
python3 .claude/skills/skill-creator/scripts/init_skill.py my-skill --path .claude/skills
```

This creates:
```
.claude/skills/my-skill/
├── SKILL.md
├── scripts/
│   └── example.py
├── references/
│   └── api_reference.md
└── assets/
    └── example_asset.txt
```

### Option 3: Manual Creation

1. Create directory: `.claude/skills/my-skill/`
2. Add `SKILL.md` with frontmatter:

```yaml
---
name: my-skill
description: Clear description of what this does and when Claude should use it
---

# My Skill

## Overview
[Brief explanation]

## Instructions
[Step-by-step guidance for Claude]
```

## Skill Development Workflow

1. **Validate your skill**:
   ```bash
   python3 .claude/skills/skill-creator/scripts/quick_validate.py .claude/skills/my-skill
   ```

2. **Test the skill**: Ask Claude to use it on real tasks

3. **Iterate**: Update based on performance

4. **Package for distribution** (optional):
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
6. **Learn from default skills**: Review document-skills for patterns when building complex capabilities

## Team Collaboration

Project skills in `.claude/skills/` automatically sync with your team:

```bash
git add .claude/skills/
git commit -m "Add new skill"
git push
```

Team members get access when they pull - no manual installation needed.

## Learning from Default Skills

The document-skills are excellent references for:
- **Complex file format handling**: See how docx/pdf/pptx/xlsx handle binary formats
- **Workflow decision trees**: Learn structured approaches to different use cases
- **Bundled resources**: Examples of scripts, references, and assets organization
- **Progressive disclosure**: How to keep SKILL.md lean while providing deep capabilities

Before creating a skill that works with complex formats or requires sophisticated workflows, review these production-quality examples.

## Resources

- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills.md)
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Claude Code Plugins](https://docs.claude.com/en/docs/claude-code/plugins.md)
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Creating custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)

## License

- **skill-creator**: MIT License (see [.claude/skills/skill-creator/LICENSE.txt](.claude/skills/skill-creator/LICENSE.txt))
- **document-skills**: Proprietary (source-available for reference, see individual LICENSE.txt files)
- **Custom skills you create**: Your choice of license
