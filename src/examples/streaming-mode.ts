/**
 * Streaming Mode Example
 * 
 * Demonstrates how to stream prompts to Claude incrementally,
 * useful for chat interfaces or real-time interactions.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';

async function* createStreamingPrompt(): AsyncGenerator<SDKUserMessage> {
  // Simulate streaming user messages
  const messages = [
    'Hello! I need help with a task.',
    'Can you list the files in this directory?',
    'Then tell me what this project is about based on the files.',
  ];

  for (const content of messages) {
    console.log(`\n[User streaming]: ${content}`);
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: content,
      },
    };
    
    // Simulate delay between messages
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function streamingModeExample() {
  console.log('=== Streaming Mode Example ===\n');

  try {
    // Example 1: Simple string prompt (non-streaming)
    console.log('Example 1: Simple string prompt\n');
    const abortController1 = new AbortController();
    
    const result1 = query({
      prompt: 'What is 2 + 2?',
      options: {
        allowedTools: [], // No tools, just text response
        abortController: abortController1,
      }
    });

    for await (const message of result1) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      }
    }

    console.log('\n---\n');

    // Example 2: Streaming prompt using async generator
    // This is the RECOMMENDED way to use the SDK per the documentation
    console.log('Example 2: Streaming user messages (Recommended)\n');
    
    const abortController2 = new AbortController();
    const streamingPrompt = createStreamingPrompt();
    const result2 = query({
      prompt: streamingPrompt,
      options: {
        allowedTools: ['Glob', 'Read'],
        abortController: abortController2,
        maxTurns: 10,
      }
    });

    for await (const message of result2) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant response:', message.text);
      } else if (message.type === 'tool_use') {
        console.log(`[Tool: ${message.name}]`);
      } else if (message.type === 'result') {
        console.log('[Tool Result received]');
      } else if (message.type === 'partial_assistant') {
        // Partial messages show the assistant thinking in real-time
        process.stdout.write('.');
      }
    }

    console.log('\n\n✓ Streaming mode example completed');
  } catch (error) {
    console.error('Error:', error);
    throw error; // Re-throw to ensure proper cleanup
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  streamingModeExample();
}

export { streamingModeExample };


