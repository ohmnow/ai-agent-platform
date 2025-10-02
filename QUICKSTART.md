# Quick Start Guide

Get started with the Claude Agent SDK in 5 minutes!

## Step 1: Prerequisites

Make sure you have:
- Node.js 18+ installed
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure API Key

Copy the example environment file:
```bash
cp env.example .env
```

Edit `.env` and add your API key:
```
ANTHROPIC_API_KEY=your-actual-api-key-here
```

## Step 4: Run Your First Example

```bash
npm run example:basic
```

This will run a simple query that lists files in the current directory.

## Step 5: Try Other Examples

```bash
# Custom tools
npm run example:tools

# Streaming mode
npm run example:streaming

# Hooks
npm run example:hooks

# Permissions
npm run example:permissions

# Advanced features
npm run example:advanced
```

## Step 6: Write Your Own Code

Create a new file `my-first-agent.ts`:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  const result = query({
    prompt: 'Hello! What can you help me with?',
    options: {
      allowedTools: ['Read', 'Glob'],
    }
  });

  for await (const message of result) {
    if (message.type === 'assistant' && message.text) {
      console.log('Claude:', message.text);
    }
  }
}

main().catch(console.error);
```

Run it:
```bash
npx tsx my-first-agent.ts
```

## Next Steps

- Read the full [README.md](./README.md) for comprehensive documentation
- Explore the example files in `src/examples/`
- Check out the [official documentation](https://docs.claude.com/en/api/agent-sdk/typescript)
- Join the [Discord community](https://discord.gg/anthropic)

## Common Issues

### "API key not found"
Make sure your `.env` file is in the project root and contains `ANTHROPIC_API_KEY=...`

### "Module not found"
Run `npm install` to install all dependencies

### TypeScript errors
Run `npm run build` to check for type errors

## Getting Help

- Check the examples in `src/examples/`
- Read the [full documentation](./README.md)
- Visit [Claude Docs](https://docs.claude.com)
- Ask on [Discord](https://discord.gg/anthropic)

Happy coding! 🚀


