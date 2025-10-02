/**
 * Basic Query Example
 * 
 * Demonstrates the simplest way to use the Claude Agent SDK
 * with a single query and response.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

async function basicQueryExample() {
  console.log('=== Basic Query Example ===\n');

  const abortController = new AbortController();

  try {
    // Simple string prompt
    const result = query({
      prompt: 'What files are in the current directory? List them briefly.',
      options: {
        // Allow only safe read operations
        allowedTools: ['Glob', 'Read'],
        // Set a custom model (optional)
        model: 'claude-sonnet-4-20250514',
        abortController,
      }
    });

    // Iterate through streaming messages
    for await (const message of result) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      } else if (message.type === 'tool_use') {
        console.log(`\n[Tool Used: ${message.name}]`);
      } else if (message.type === 'result') {
        console.log('[Tool Result received]');
      }
    }

    console.log('\n✓ Query completed successfully');
  } catch (error) {
    console.error('Error:', error);
    abortController.abort();
    throw error;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  basicQueryExample();
}

export { basicQueryExample };


