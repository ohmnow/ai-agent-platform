#!/usr/bin/env python3
"""
Validate sub-agent configurations for Claude Code

Checks agent files for:
- Valid YAML frontmatter
- Required fields (name, description)
- Tool availability
- Model validity
- File structure
- PROACTIVE trigger hints
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import yaml


# Valid tools in Claude Code
VALID_TOOLS = {
    "Read", "Write", "Edit", "Grep", "Glob", "Bash",
    "Task", "WebFetch", "WebSearch", "TodoWrite",
    "NotebookEdit", "SlashCommand", "Skill", "ExitPlanMode"
}

# Valid models
VALID_MODELS = {"sonnet", "opus", "haiku", "inherit"}


class ValidationError:
    def __init__(self, severity: str, file: str, message: str):
        self.severity = severity  # 'error', 'warning', 'info'
        self.file = file
        self.message = message

    def __str__(self):
        emoji = {"error": "❌", "warning": "⚠️", "info": "ℹ️"}
        return f"{emoji[self.severity]} [{self.severity.upper()}] {self.file}: {self.message}"


def find_agents_dir() -> Optional[Path]:
    """Find .claude/agents directory"""
    current = Path.cwd()
    while current.parent != current:
        agents_dir = current / ".claude" / "agents"
        if agents_dir.exists():
            return agents_dir
        current = current.parent
    return None


def extract_frontmatter(content: str) -> Tuple[Optional[Dict], str]:
    """Extract YAML frontmatter from markdown file"""
    if not content.startswith('---'):
        return None, content

    parts = content.split('---', 2)
    if len(parts) < 3:
        return None, content

    try:
        frontmatter = yaml.safe_load(parts[1])
        body = parts[2].strip()
        return frontmatter, body
    except yaml.YAMLError as e:
        return None, content


def validate_agent_file(file_path: Path) -> List[ValidationError]:
    """Validate a single agent file"""
    errors = []
    file_name = file_path.name

    # Read file
    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except Exception as e:
        errors.append(ValidationError('error', file_name, f"Could not read file: {e}"))
        return errors

    # Check frontmatter exists
    frontmatter, body = extract_frontmatter(content)
    if frontmatter is None:
        errors.append(ValidationError('error', file_name, "Missing or invalid YAML frontmatter"))
        return errors

    # Validate required fields
    if 'name' not in frontmatter:
        errors.append(ValidationError('error', file_name, "Missing required field: 'name'"))
    else:
        # Validate name format
        name = frontmatter['name']
        if not re.match(r'^[a-z0-9-]+$', name):
            errors.append(ValidationError('error', file_name,
                "Name must be lowercase with hyphens only"))

        # Check file name matches agent name
        expected_filename = f"{name}.md"
        if file_name != expected_filename:
            errors.append(ValidationError('warning', file_name,
                f"File name should be '{expected_filename}' to match agent name"))

    if 'description' not in frontmatter:
        errors.append(ValidationError('error', file_name, "Missing required field: 'description'"))
    else:
        description = frontmatter['description']

        # Check description length
        if len(description) < 20:
            errors.append(ValidationError('warning', file_name,
                "Description is very short (< 20 chars). Add more detail."))

        if len(description) > 500:
            errors.append(ValidationError('warning', file_name,
                "Description is very long (> 500 chars). Consider shortening."))

        # Check for PROACTIVE hint
        if 'PROACTIVELY' in description or 'proactively' in description:
            errors.append(ValidationError('info', file_name,
                "Contains PROACTIVE trigger hint - good for automatic delegation"))

        # Check description format (should use "Use when...")
        if not any(phrase in description.lower() for phrase in [
            'use when', 'use this', 'invoke when', 'trigger when', 'should be used'
        ]):
            errors.append(ValidationError('warning', file_name,
                "Description should include usage guidance (e.g., 'Use when...')"))

    # Validate optional fields
    if 'tools' in frontmatter:
        tools = frontmatter['tools']
        if isinstance(tools, str):
            tool_list = [t.strip() for t in tools.split(',')]
        elif isinstance(tools, list):
            tool_list = tools
        else:
            errors.append(ValidationError('error', file_name,
                "'tools' must be a string or list"))
            tool_list = []

        # Check each tool is valid
        for tool in tool_list:
            if tool not in VALID_TOOLS:
                errors.append(ValidationError('warning', file_name,
                    f"Unknown tool: '{tool}'. Available: {', '.join(sorted(VALID_TOOLS))}"))

        # Warn about potentially unsafe tools
        dangerous_tools = {'Bash', 'Write', 'Edit'}
        if any(tool in tool_list for tool in dangerous_tools):
            errors.append(ValidationError('info', file_name,
                f"Uses powerful tools ({', '.join(dangerous_tools & set(tool_list))}). "
                "Ensure agent instructions are clear."))

    if 'model' in frontmatter:
        model = frontmatter['model']
        if model not in VALID_MODELS:
            errors.append(ValidationError('error', file_name,
                f"Invalid model: '{model}'. Valid: {', '.join(VALID_MODELS)}"))

    # Validate body content
    if not body.strip():
        errors.append(ValidationError('error', file_name, "Agent body is empty"))
    else:
        # Check for common sections
        sections = {
            '# ': 'Main heading',
            '## ': 'Subsections',
        }

        for marker, desc in sections.items():
            if marker not in body:
                errors.append(ValidationError('warning', file_name,
                    f"Missing {desc}. Add structure to agent instructions."))

        # Check body length
        if len(body) < 100:
            errors.append(ValidationError('warning', file_name,
                "Agent body is short (< 100 chars). Add more guidance."))

        # Check for example section
        if '## Example' not in body and '## Usage' not in body:
            errors.append(ValidationError('info', file_name,
                "Consider adding example or usage section"))

    return errors


def validate_all_agents(agents_dir: Path) -> Dict[str, List[ValidationError]]:
    """Validate all agent files in directory"""
    results = {}

    # Find all .md files
    for file_path in agents_dir.glob('*.md'):
        errors = validate_agent_file(file_path)
        if errors:
            results[file_path.name] = errors

    return results


def print_results(results: Dict[str, List[ValidationError]]):
    """Print validation results"""
    total_errors = sum(
        len([e for e in errors if e.severity == 'error'])
        for errors in results.values()
    )
    total_warnings = sum(
        len([e for e in errors if e.severity == 'warning'])
        for errors in results.values()
    )
    total_info = sum(
        len([e for e in errors if e.severity == 'info'])
        for errors in results.values()
    )

    print("\n" + "=" * 60)
    print("Sub-Agent Validation Results")
    print("=" * 60 + "\n")

    if not results:
        print("✅ All agents valid!")
        return True

    # Print issues by file
    for file_name in sorted(results.keys()):
        print(f"\n📄 {file_name}")
        for error in results[file_name]:
            print(f"   {error}")

    # Summary
    print("\n" + "=" * 60)
    print(f"Total: {total_errors} errors, {total_warnings} warnings, {total_info} info")
    print("=" * 60)

    return total_errors == 0


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Validate Claude Code sub-agent configurations"
    )
    parser.add_argument("path", nargs='?', help="Path to agents directory or specific agent file")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")

    args = parser.parse_args()

    # Determine what to validate
    if args.path:
        path = Path(args.path)
        if path.is_file():
            # Validate single file
            errors = validate_agent_file(path)
            results = {path.name: errors} if errors else {}
        elif path.is_dir():
            # Validate directory
            results = validate_all_agents(path)
        else:
            print(f"Error: Path not found: {path}")
            sys.exit(1)
    else:
        # Find agents directory
        agents_dir = find_agents_dir()
        if not agents_dir:
            print("Error: Could not find .claude/agents directory")
            print("Run this from your project root or provide a path")
            sys.exit(1)

        results = validate_all_agents(agents_dir)

    # Output results
    if args.json:
        import json
        output = {
            file_name: [
                {
                    'severity': e.severity,
                    'message': e.message
                }
                for e in errors
            ]
            for file_name, errors in results.items()
        }
        print(json.dumps(output, indent=2))
    else:
        success = print_results(results)

        # Exit code
        if not success:
            sys.exit(1)
        if args.strict and any(results.values()):
            sys.exit(1)


if __name__ == "__main__":
    main()
