---
name: conventional-commits
description: Generate git commit messages following the Conventional Commits specification. This skill should be used when creating git commits, especially when the user asks to commit changes, write a commit message, or follow conventional commit standards.
---

# Conventional Commits

## Overview

Generate clear, standardized commit messages following the [Conventional Commits specification](https://www.conventionalcommits.org/). This skill helps create semantic, machine-readable commit messages that integrate well with automated changelogs and versioning tools.

## Conventional Commits Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (white-space, formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes affecting build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Examples

**Simple feature:**
```
feat: add user authentication system
```

**Bug fix with scope:**
```
fix(auth): resolve token expiration issue
```

**Breaking change:**
```
feat(api)!: redesign authentication endpoints

BREAKING CHANGE: The /login endpoint now requires email instead of username
```

**With body and footer:**
```
fix(parser): handle edge case in JSON parsing

Previously, the parser would fail when encountering deeply nested objects.
This commit adds a depth limit check and proper error handling.

Closes #123
```

## Workflow

When generating commit messages:

1. **Analyze changes**: Review git diff or status to understand what changed
2. **Determine type**: Select the most appropriate commit type
3. **Identify scope** (optional): Add scope if changes affect a specific component
4. **Write description**: Create a concise summary (50-72 characters recommended)
5. **Add body** (if needed): Provide additional context for complex changes
6. **Add footers** (if needed): Include breaking changes, issue references, co-authors

## Guidelines

### Description
- Use imperative mood ("add feature" not "added feature")
- Don't capitalize first letter
- No period at the end
- Keep under 72 characters

### Body
- Separate from description with a blank line
- Explain *what* and *why*, not *how*
- Wrap at 72 characters

### Footer
- Use for breaking changes: `BREAKING CHANGE: description`
- Reference issues: `Closes #123`, `Fixes #456`
- Multiple footers are allowed

### Breaking Changes
- Add `!` after type/scope: `feat(api)!: ...`
- Always include `BREAKING CHANGE:` footer with explanation

## Common Patterns

**Multiple related changes:**
```
feat(ui): redesign dashboard layout

- Reorganize widget placement
- Add drag-and-drop support
- Improve mobile responsiveness

Closes #234
```

**Dependency update:**
```
build(deps): upgrade React to v18.2.0
```

**Documentation:**
```
docs(api): update authentication examples
```

**Reverting:**
```
revert: feat(auth): add OAuth support

This reverts commit abc123def456.
Reason: OAuth integration causing deployment issues
```

## When Creating Commits

1. Run `git diff --staged` to see changes
2. Analyze the scope and impact
3. Generate appropriate conventional commit message
4. Include Co-Authored-By trailer if applicable
5. Ensure the message follows the format above
