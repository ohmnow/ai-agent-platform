#!/usr/bin/env python3
"""
Interactive sub-agent creator for Claude Code

Creates properly formatted sub-agent configuration files with
templates, tool selection, and model configuration.
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Dict, Optional

# Available agent templates
TEMPLATES = {
    "code-reviewer": "assets/agent-templates/code-reviewer.md",
    "test-engineer": "assets/agent-templates/test-engineer.md",
    "documentation-writer": "assets/agent-templates/documentation-writer.md",
    "refactoring-expert": "assets/agent-templates/refactoring-expert.md",
    "security-analyst": "assets/agent-templates/security-analyst.md",
    "custom": None
}

# Available tools
AVAILABLE_TOOLS = [
    "Read", "Write", "Edit", "Grep", "Glob", "Bash",
    "Task", "WebFetch", "WebSearch", "TodoWrite",
    "NotebookEdit", "SlashCommand", "Skill"
]

# Available models
MODELS = ["sonnet", "opus", "haiku", "inherit"]


def get_skill_root() -> Path:
    """Find the sub-agent-orchestration skill root directory"""
    current = Path(__file__).resolve()
    while current.parent != current:
        if (current / "SKILL.md").exists():
            return current
        current = current.parent
    raise FileNotFoundError("Could not find SKILL.md in parent directories")


def get_project_root() -> Path:
    """Find the project root (contains .claude directory)"""
    current = Path.cwd()
    while current.parent != current:
        if (current / ".claude").exists():
            return current
        current = current.parent
    raise FileNotFoundError("Could not find .claude directory in parent directories")


def prompt_template() -> tuple[str, Optional[Path]]:
    """Prompt user to select agent template"""
    print("\nAvailable Agent Templates:")
    print("1. code-reviewer - Specialized code review agent")
    print("2. test-engineer - Comprehensive testing agent")
    print("3. documentation-writer - Technical documentation agent")
    print("4. refactoring-expert - Code refactoring specialist")
    print("5. security-analyst - Security vulnerability scanner")
    print("6. custom - Create from scratch")

    while True:
        choice = input("\nSelect template (1-6): ").strip()
        template_map = {
            "1": "code-reviewer",
            "2": "test-engineer",
            "3": "documentation-writer",
            "4": "refactoring-expert",
            "5": "security-analyst",
            "6": "custom"
        }

        if choice in template_map:
            template_name = template_map[choice]
            template_path = TEMPLATES[template_name]
            if template_path:
                skill_root = get_skill_root()
                full_path = skill_root / template_path
                if not full_path.exists():
                    print(f"Warning: Template file not found at {full_path}")
                    print("Creating custom agent instead.")
                    return "custom", None
                return template_name, full_path
            return "custom", None

        print("Invalid choice. Please select 1-6.")


def prompt_agent_name() -> str:
    """Prompt for agent name (lowercase, hyphens)"""
    while True:
        name = input("\nAgent name (lowercase, hyphens only): ").strip().lower()
        if name and all(c.isalnum() or c == '-' for c in name):
            return name
        print("Invalid name. Use lowercase letters, numbers, and hyphens only.")


def prompt_description() -> str:
    """Prompt for agent description"""
    print("\nAgent description (what it does and when to use it):")
    print("Be specific about triggering conditions for automatic delegation.")
    description = input("> ").strip()
    return description


def prompt_tools() -> List[str]:
    """Prompt for tool selection"""
    print("\nSelect tools (comma-separated numbers, or 'all' for all tools):")
    for i, tool in enumerate(AVAILABLE_TOOLS, 1):
        print(f"{i:2d}. {tool}")

    while True:
        choice = input("\nTools (e.g., '1,2,3' or 'all'): ").strip()

        if choice.lower() == 'all':
            return []  # Empty list means inherit all tools

        try:
            indices = [int(x.strip()) for x in choice.split(',')]
            if all(1 <= i <= len(AVAILABLE_TOOLS) for i in indices):
                return [AVAILABLE_TOOLS[i - 1] for i in indices]
            print("Invalid tool numbers. Please try again.")
        except ValueError:
            print("Invalid format. Use comma-separated numbers or 'all'.")


def prompt_model() -> str:
    """Prompt for model selection"""
    print("\nSelect model:")
    print("1. sonnet (recommended for most tasks)")
    print("2. opus (complex reasoning, highest quality)")
    print("3. haiku (fast, simple tasks)")
    print("4. inherit (use same model as main conversation)")

    model_map = {"1": "sonnet", "2": "opus", "3": "haiku", "4": "inherit"}

    while True:
        choice = input("\nModel (1-4, default: 1): ").strip() or "1"
        if choice in model_map:
            return model_map[choice]
        print("Invalid choice. Please select 1-4.")


def create_agent_file(
    name: str,
    description: str,
    tools: List[str],
    model: str,
    template_path: Optional[Path],
    output_dir: Path
) -> Path:
    """Create the agent markdown file"""
    output_file = output_dir / f"{name}.md"

    # Build frontmatter
    frontmatter = f"""---
name: {name}
description: {description}"""

    if tools:  # If specific tools selected
        frontmatter += f"\ntools: {', '.join(tools)}"

    if model != "inherit":
        frontmatter += f"\nmodel: {model}"

    frontmatter += "\n---\n\n"

    # Build content
    if template_path and template_path.exists():
        # Use template content (skip frontmatter)
        with open(template_path, 'r') as f:
            content = f.read()
            # Skip template frontmatter
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    content = parts[2].strip()

        full_content = frontmatter + content
    else:
        # Create basic custom agent
        full_content = frontmatter + f"""# {name.replace('-', ' ').title()} Agent

## Purpose

[Describe what this agent does]

## When to Use

[Describe when this agent should be invoked]

## Methodology

[Describe how this agent approaches tasks]

## Output Format

[Describe expected output format]
"""

    # Write file
    with open(output_file, 'w') as f:
        f.write(full_content)

    return output_file


def create_subagent_interactive():
    """Interactive sub-agent creation wizard"""
    print("=" * 60)
    print("Claude Code Sub-Agent Creator")
    print("=" * 60)

    # Get project root and agents directory
    try:
        project_root = get_project_root()
        agents_dir = project_root / ".claude" / "agents"
        agents_dir.mkdir(parents=True, exist_ok=True)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)

    print(f"\nAgents will be created in: {agents_dir}")

    # Collect agent configuration
    template_name, template_path = prompt_template()
    agent_name = prompt_agent_name()
    description = prompt_description()

    # For templates, offer to use default settings
    if template_name != "custom":
        use_defaults = input("\nUse default tools and model from template? (y/n, default: y): ").strip().lower()
        if use_defaults in ['', 'y', 'yes']:
            tools = []  # Inherit all
            model = "sonnet"
            print("Using template defaults (all tools, sonnet model)")
        else:
            tools = prompt_tools()
            model = prompt_model()
    else:
        tools = prompt_tools()
        model = prompt_model()

    # Create the agent
    print("\nCreating agent...")
    output_file = create_agent_file(
        name=agent_name,
        description=description,
        tools=tools,
        model=model,
        template_path=template_path,
        output_dir=agents_dir
    )

    print(f"\n✅ Agent created successfully: {output_file}")
    print(f"\nNext steps:")
    print(f"1. Review and customize the agent file")
    print(f"2. Test the agent with: 'Use the {agent_name} agent to...'")
    print(f"3. Iterate based on performance")


def create_subagent_cli(
    name: str,
    description: str,
    template: Optional[str] = None,
    tools: Optional[List[str]] = None,
    model: str = "sonnet"
):
    """Create sub-agent via CLI arguments"""
    try:
        project_root = get_project_root()
        agents_dir = project_root / ".claude" / "agents"
        agents_dir.mkdir(parents=True, exist_ok=True)

        # Resolve template path
        template_path = None
        if template and template in TEMPLATES:
            skill_root = get_skill_root()
            template_path = skill_root / TEMPLATES[template]

        # Create the agent
        output_file = create_agent_file(
            name=name,
            description=description,
            tools=tools or [],
            model=model,
            template_path=template_path,
            output_dir=agents_dir
        )

        print(f"✅ Agent created: {output_file}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Create Claude Code sub-agents from templates"
    )
    parser.add_argument("--name", help="Agent name (lowercase, hyphens)")
    parser.add_argument("--description", help="Agent description")
    parser.add_argument("--template", choices=list(TEMPLATES.keys()), help="Template to use")
    parser.add_argument("--tools", help="Comma-separated tool list")
    parser.add_argument("--model", choices=MODELS, default="sonnet", help="Model to use")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")

    args = parser.parse_args()

    if args.interactive or not (args.name and args.description):
        create_subagent_interactive()
    else:
        tools = args.tools.split(',') if args.tools else None
        create_subagent_cli(
            name=args.name,
            description=args.description,
            template=args.template,
            tools=tools,
            model=args.model
        )


if __name__ == "__main__":
    main()
