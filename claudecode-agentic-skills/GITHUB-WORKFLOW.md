# GitHub Workflow Guide: Template Repository + Project Repositories

This guide explains how to use this repository as a **reusable template** for multiple agentic projects while maintaining the EstimateFlow project documentation.

---

## Two-Repository Strategy

### Strategy Overview

```
┌─────────────────────────────────────────────────────────────┐
│  claudecode-agentic-skills (THIS REPO)                      │
│  = Template Repository (Reusable)                           │
│                                                              │
│  ├── .claude/skills/          ← Core skills (reusable)      │
│  ├── .claude/agents/          ← Agent templates             │
│  ├── project-docs/            ← EstimateFlow docs + templates
│  ├── .github/workflows/       ← Workflow templates          │
│  └── scripts/                 ← Helper scripts              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Use as GitHub Template
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  estimateflow (NEW PROJECT REPO)                            │
│  = Specific Project Repository                              │
│                                                              │
│  ├── .claude/                                                │
│  │   ├── skills/            ← Copied from template          │
│  │   └── agents/            ← EstimateFlow-specific agents  │
│  ├── project-docs/          ← EstimateFlow-only docs        │
│  ├── backend/               ← Actual code                   │
│  ├── mobile/                ← Actual code                   │
│  └── .github/workflows/     ← Project-specific CI/CD        │
└─────────────────────────────────────────────────────────────┘
```

---

## Current Situation: EstimateFlow Docs in Template Repo

Right now, your EstimateFlow documentation is in the **template repository**. You have two options:

### Option 1: Keep Everything Here (Simpler for Now)

**Structure**:
```
claudecode-agentic-skills/
├── .claude/skills/              # Reusable skills ✓
├── project-docs/
│   ├── templates/               # Reusable templates ✓
│   ├── technical-specs.md       # EstimateFlow-specific
│   ├── github-issues.md         # EstimateFlow-specific
│   ├── features.md              # EstimateFlow-specific
│   └── PROJECT-SUMMARY.md       # EstimateFlow-specific
└── README.md                    # Explains dual purpose
```

**Pros**:
- Simple - one repo to manage
- EstimateFlow docs are "checkpointed" here
- Easy to reference when creating new projects

**Cons**:
- EstimateFlow code will go elsewhere (backend/mobile)
- EstimateFlow docs separated from code
- Template repo gets cluttered with project-specific docs

**When to use**:
- You're still planning EstimateFlow
- You want to iterate on docs before coding
- You want a "checkpoint" of the design

### Option 2: Separate Repos (Better Long-Term)

**Current Repo** (`claudecode-agentic-skills`):
```
claudecode-agentic-skills/
├── .claude/skills/              # Reusable skills
├── .claude/agents/README.md     # Agent template guide
├── project-docs/templates/      # ONLY templates
├── .github/workflows/
│   └── claude-dev-template.yml  # Reusable workflow
├── scripts/
│   └── init-new-project.sh      # Bootstrap script
└── README.md                    # Template usage guide
```

**New Repo** (`estimateflow`):
```
estimateflow/
├── .claude/
│   ├── skills/                  # Copied from template
│   └── agents/                  # EstimateFlow agents
├── project-docs/                # All EstimateFlow docs
│   ├── technical-specs.md
│   ├── github-issues.md
│   ├── features.md
│   └── PROJECT-SUMMARY.md
├── backend/                     # Node.js backend
├── mobile/                      # React Native app
├── .github/workflows/
│   └── claude-dev.yml
└── README.md
```

**Pros**:
- Clean separation of template vs project
- EstimateFlow docs live with code
- Template repo stays lean
- Can create multiple projects from template

**Cons**:
- Need to manage two repos
- Moving docs from current location

**When to use**:
- Ready to start coding EstimateFlow
- Want clean template for future projects
- Need EstimateFlow docs with code

---

## Recommended Approach: Hybrid (Best of Both)

### Phase 1: Planning (NOW) - Keep in Template Repo
```bash
# Current state - EstimateFlow docs in template repo
claudecode-agentic-skills/
├── project-docs/
│   ├── templates/               # For future projects
│   ├── technical-specs.md       # EstimateFlow (checkpoint)
│   ├── github-issues.md         # EstimateFlow (checkpoint)
│   └── ...
```

**Why**: You're still planning, docs are your "checkpoint"

### Phase 2: Development (SOON) - Create Project Repo
```bash
# Create EstimateFlow repo from template
gh repo create estimateflow --template your-username/claudecode-agentic-skills

# Move EstimateFlow docs to new repo
cd estimateflow
git mv ../claudecode-agentic-skills/project-docs/*.md project-docs/
# Keep templates/ in template repo

# Start coding
mkdir backend mobile
# ... create GitHub issues, begin development
```

**Why**: Code and docs together, template stays clean

### Phase 3: Future Projects - Use Template Again
```bash
# Start new project
gh repo create my-next-project --template your-username/claudecode-agentic-skills

# Fill in templates for new project
cp project-docs/templates/technical-specs-template.md project-docs/technical-specs.md
# Edit for new project...
```

---

## GitHub Template Repository Setup

### 1. Make Current Repo a Template

```bash
# On GitHub.com:
# Settings → Template repository → ✓ Template repository

# Or via gh CLI:
gh api repos/your-username/claudecode-agentic-skills \
  --method PATCH \
  -f is_template=true
```

### 2. Commit Current State (EstimateFlow Checkpoint)

```bash
cd /Users/chris/claudecode-agentic-skills

# Add everything
git add .

# Commit with descriptive message
git commit -m "docs: EstimateFlow project documentation checkpoint

- Complete technical specs (architecture, database, API, agents)
- 39 parallelizable GitHub issues for development
- Detailed feature specifications
- Agent architecture with 8 specialized agents
- Ready for project repository creation"

# Push to GitHub
git push origin main
```

This creates a **checkpoint** - you can always come back to this state.

### 3. Tag This Version (Optional but Recommended)

```bash
# Tag this as EstimateFlow v1 design
git tag -a estimateflow-v1.0-design -m "EstimateFlow MVP design complete"
git push origin estimateflow-v1.0-design

# Now you can always get back to this exact state:
# git checkout estimateflow-v1.0-design
```

---

## Creating EstimateFlow Project Repository

### Option A: Use GitHub Template Feature

```bash
# On GitHub.com:
# Go to: github.com/your-username/claudecode-agentic-skills
# Click: "Use this template" → "Create a new repository"
# Name: estimateflow
# Click: "Create repository"

# Clone locally
git clone https://github.com/your-username/estimateflow.git
cd estimateflow

# Clean up - remove template-only files
rm -rf project-docs/templates/
mv project-docs/technical-specs.md project-docs/technical-specs.md  # Keep
# ... keep EstimateFlow docs, remove templates

# Start building
mkdir backend mobile
```

### Option B: Manual Clone and Clean

```bash
# Clone template
git clone https://github.com/your-username/claudecode-agentic-skills.git estimateflow
cd estimateflow

# Remove git history, start fresh
rm -rf .git
git init
git remote add origin https://github.com/your-username/estimateflow.git

# Clean up for project
rm -rf project-docs/templates/

# Commit
git add .
git commit -m "Initial commit from agentic template"
git push -u origin main
```

---

## Keeping Template in Sync with EstimateFlow Changes

If you improve skills or workflows in EstimateFlow and want to update the template:

### Update Template from EstimateFlow

```bash
# In estimateflow repo
cd /path/to/estimateflow

# If you improved a skill
git format-patch main -- .claude/skills/sub-agent-orchestration/

# Apply to template repo
cd /path/to/claudecode-agentic-skills
git am /path/to/estimateflow/*.patch
```

### Or manually copy:

```bash
# Copy improved skill back to template
cp -r /path/to/estimateflow/.claude/skills/new-skill \
      /path/to/claudecode-agentic-skills/.claude/skills/

cd /path/to/claudecode-agentic-skills
git add .claude/skills/new-skill
git commit -m "feat: add new-skill from EstimateFlow project"
git push
```

---

## Git Workflow Examples

### Scenario 1: Checkpoint Current EstimateFlow Docs

```bash
cd /Users/chris/claudecode-agentic-skills

git add project-docs/
git commit -m "docs(estimateflow): update GitHub issues with new dependencies"
git push

# Create checkpoint tag
git tag -a estimateflow-v1.1-design -m "Updated issue dependencies"
git push --tags
```

### Scenario 2: Start EstimateFlow Development

```bash
# Create new repo from template
gh repo create estimateflow --template your-username/claudecode-agentic-skills --private

# Clone
git clone https://github.com/your-username/estimateflow.git
cd estimateflow

# Move docs to proper location (if needed)
mkdir -p docs
mv project-docs/*.md docs/  # Keep project docs
rm -rf project-docs/templates/  # Remove templates

# Add code structure
mkdir -p backend/src mobile/src

# Commit
git add .
git commit -m "feat: initialize EstimateFlow project structure"
git push
```

### Scenario 3: Start Another Project from Template

```bash
# 6 months later...
gh repo create my-new-saas --template your-username/claudecode-agentic-skills

cd my-new-saas

# Use templates for new project
cp project-docs/templates/technical-specs-template.md project-docs/technical-specs.md

# Edit for new project
vim project-docs/technical-specs.md

# Remove EstimateFlow-specific docs
rm project-docs/features.md project-docs/github-issues.md

# Commit new project docs
git add .
git commit -m "docs: initial technical specifications for MyNewSaaS"
git push
```

---

## Recommended Next Steps for You

### Immediate (Today):

1. **Commit current state as checkpoint**:
   ```bash
   cd /Users/chris/claudecode-agentic-skills
   git add .
   git commit -m "docs: EstimateFlow MVP documentation complete"
   git push origin main
   git tag -a estimateflow-v1.0-design -m "Complete MVP design"
   git push --tags
   ```

2. **Make this a template repository**:
   - Go to GitHub.com settings
   - Enable "Template repository"

### When Ready to Code (Next Week?):

3. **Create EstimateFlow project repository**:
   ```bash
   gh repo create estimateflow --template your-username/claudecode-agentic-skills --private
   ```

4. **Move EstimateFlow-specific docs**:
   - Keep: technical-specs.md, github-issues.md, features.md
   - Remove: templates/ (those stay in template)

5. **Set up project structure**:
   - Create backend/ and mobile/ directories
   - Initialize npm workspaces
   - Begin INFRA-001 issue

### Future Projects:

6. **Use template for new projects**:
   - Click "Use this template" on GitHub
   - Fill in template docs for new project
   - Leverage skills and workflows

---

## Summary: Two Repos, One Workflow

### `claudecode-agentic-skills` (Template)
- **Purpose**: Reusable foundation for ALL agentic projects
- **Contains**: Skills, agent templates, doc templates, workflows
- **Updates**: When you create new reusable skills/patterns
- **Checkpoints**: Tag EstimateFlow design versions

### `estimateflow` (Project)
- **Purpose**: Specific EstimateFlow application
- **Contains**: EstimateFlow docs, code, project-specific agents
- **Updates**: Day-to-day development
- **Checkpoints**: Normal git commits, releases

### The Flow:
```
Template Repo → Create Project → Develop → Extract Learnings → Update Template
      ↑                                                               |
      └───────────────────────────────────────────────────────────────┘
```

---

## Questions?

- **"Can I keep EstimateFlow docs here?"** Yes! Commit as checkpoint, move later when coding.
- **"Will I lose my docs?"** No! Git keeps all history. Tags let you return to any point.
- **"How do I update the template?"** Make changes, commit, push. Future projects get updates.
- **"What if I want to change EstimateFlow docs?"** Edit, commit, push. Your checkpoint updates.

---

**Ready to commit your checkpoint?**

```bash
cd /Users/chris/claudecode-agentic-skills
git status  # See what's changed
git add .
git commit -m "docs: EstimateFlow MVP documentation complete

- Complete technical architecture
- 39 parallelizable GitHub issues
- Feature specifications
- Ready for project repository creation"
git push origin main

# Optional but recommended
git tag -a v1.0-estimateflow-design -m "EstimateFlow MVP design checkpoint"
git push --tags
```

You now have a **safe checkpoint** and can proceed with either:
- **Option 1**: Keep working here (simple)
- **Option 2**: Create EstimateFlow project repo (clean separation)
