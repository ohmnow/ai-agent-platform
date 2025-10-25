# EstimateFlow - Project Documentation

AI-powered construction estimating platform that transforms field assessments into professional estimates in minutes.

## Documentation Index

### Core Documentation

1. **[Technical Specifications](./technical-specs.md)** - Complete system architecture, tech stack, database schema, API specs, agent architecture
2. **[GitHub Issues Breakdown](./github-issues.md)** - 30+ parallelizable issues ready for `parallel-dev-automation`
3. **[Feature Specifications](./features.md)** - Detailed feature requirements and user workflows
4. **[Development Workflow](./development-workflow.md)** - Git strategy, CI/CD, testing, deployment
5. **[Project Structure](./project-structure.md)** - Directory layout, file organization
6. **[Agent Specifications](./agents/)** - Individual agent prompt specs and responsibilities

### Quick Start

```bash
# Review all documentation
ls -la project-docs/

# Start with technical specs
open project-docs/technical-specs.md

# Then review GitHub issues for parallel development
open project-docs/github-issues.md
```

### Project Overview

**What**: Mobile-first AI estimating app for small construction contractors
**Why**: Estimators waste 40 min per estimate doing manual data entry
**How**: Photo + voice → 8 specialized AI agents → professional PDF estimate in 3 minutes

### Key Features

- ✅ Flexible data capture (voice-first, photo-first, or combined)
- ✅ 8 specialized AI agents (photo analysis, voice transcription, classification, pricing, formatting)
- ✅ Full edit capabilities with AI text rewrite + rollback
- ✅ Materials display toggle (detailed vs rolled-up)
- ✅ Custom branding (logo, colors, templates)
- ✅ Professional PDF generation
- ✅ Email delivery to clients
- 🔜 Jobber API integration (Phase II)

### Technology Stack

- **Mobile**: React Native (Expo)
- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL (Supabase)
- **Agents**: Claude 3.5 Sonnet + Haiku
- **Storage**: Cloudflare R2
- **Queue**: BullMQ + Redis
- **Deployment**: Railway + Expo EAS

### Development Approach

Using **parallel-dev-automation skill** to orchestrate autonomous development:

1. Break down project into GitHub issues
2. Label issues with `claude-task`
3. GitHub Actions triggers Claude Code instance per issue
4. Each instance creates feature branch, implements, tests, creates PR
5. Auto-merge on passing tests
6. Issues close automatically

### Timeline

- **Week 1-2**: Backend API + Database + Agents
- **Week 3-4**: Mobile app UI/UX
- **Week 5-6**: Integration + Testing + Polish
- **Week 7**: Internal dogfooding + iteration
- **Week 8**: Beta launch to friendly contractors

### Getting Started

1. ✅ Review all documentation in this folder
2. Initialize git repository
3. Create GitHub issues from `github-issues.md`
4. Set up development environment
5. Configure `parallel-dev-automation` workflow
6. Begin parallel implementation

### Questions?

Contact: [Your contact info]

---

**Last Updated**: January 25, 2025
**Version**: 1.0.0 (MVP)
