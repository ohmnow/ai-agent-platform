/**
 * Hooks Example
 * 
 * Demonstrates how to use hooks to intercept and modify
 * agent behavior at different lifecycle points.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { HookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';

// Hook to log all tool usage
function toolUsageLogger(input: HookInput): HookJSONOutput | void {
  if (input.event === 'preToolUse') {
    console.log(`\n[Hook: preToolUse]`);
    console.log(`Tool: ${input.tool.name}`);
    console.log(`Args: ${JSON.stringify(input.tool.input, null, 2)}`);
    
    // You can modify the tool input here
    // return { tool: { ...input.tool, input: modifiedInput } };
  } else if (input.event === 'postToolUse') {
    console.log(`\n[Hook: postToolUse]`);
    console.log(`Tool: ${input.tool.name}`);
    console.log(`Success: ${input.result.isError !== true}`);
  }
}

// Hook to track session lifecycle
function sessionTracker(input: HookInput): void {
  if (input.event === 'sessionStart') {
    console.log('\n[Hook: sessionStart]');
    console.log('Session started with initial prompt');
  } else if (input.event === 'sessionEnd') {
    console.log('\n[Hook: sessionEnd]');
    console.log('Session completed');
  }
}

// Hook to intercept and modify user prompts
function promptModifier(input: HookInput): HookJSONOutput | void {
  if (input.event === 'userPromptSubmit') {
    console.log('\n[Hook: userPromptSubmit]');
    console.log(`Original prompt: ${input.prompt}`);
    
    // Add context or modify the prompt
    const enhancedPrompt = `${input.prompt}\n\nPlease be concise in your response.`;
    console.log(`Enhanced prompt: ${enhancedPrompt}`);
    
    return { prompt: enhancedPrompt };
  }
}

// Hook to implement custom safety checks
function safetyChecker(input: HookInput): HookJSONOutput | void {
  if (input.event === 'preToolUse') {
    const dangerousTools = ['Bash', 'Write', 'Edit'];
    
    if (dangerousTools.includes(input.tool.name)) {
      console.log(`\n[Hook: safetyChecker] Warning: Using potentially dangerous tool ${input.tool.name}`);
      
      // You could block the tool by returning an error
      // return {
      //   result: {
      //     content: [{ type: 'text', text: 'Tool blocked by safety policy' }],
      //     isError: true
      //   }
      // };
    }
  }
}

// Hook to collect usage statistics
const stats = {
  toolCalls: 0,
  totalTokens: 0,
};

function usageTracker(input: HookInput): void {
  if (input.event === 'postToolUse') {
    stats.toolCalls++;
  } else if (input.event === 'sessionEnd') {
    console.log('\n[Hook: usageTracker]');
    console.log(`Total tool calls: ${stats.toolCalls}`);
  }
}

async function hooksExample() {
  console.log('=== Hooks Example ===\n');

  const abortController = new AbortController();

  try {
    // Reset stats
    stats.toolCalls = 0;

    const result = query({
      prompt: 'List the files in the current directory and read the package.json file',
      options: {
        allowedTools: ['Glob', 'Read'],
        abortController,
        // Register hooks
        hooks: [
          toolUsageLogger,
          sessionTracker,
          promptModifier,
          safetyChecker,
          usageTracker,
        ],
      }
    });

    console.log('Starting query with hooks enabled...\n');

    for await (const message of result) {
      if (message.type === 'assistant' && message.text) {
        console.log('\nAssistant:', message.text);
      }
    }

    console.log('\n✓ Hooks example completed');
  } catch (error) {
    console.error('Error:', error);
    abortController.abort();
    throw error; // Re-throw to ensure proper cleanup
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  hooksExample();
}

export { hooksExample };


