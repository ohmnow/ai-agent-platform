/**
 * Advanced Features Example
 * 
 * Demonstrates advanced SDK features like abort control,
 * usage tracking, subagents, and conversation continuation.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

// Example 1: Abort Controller
async function abortExample() {
  console.log('=== Abort Controller Example ===\n');
  
  const controller = new AbortController();
  
  // Set a timeout to abort after 3 seconds
  const timeout = setTimeout(() => {
    console.log('\n⏱️  Timeout reached, aborting query...');
    controller.abort();
  }, 3000);

  try {
    const result = query({
      prompt: 'Tell me a very long story about space exploration',
      options: {
        abortController: controller,
        allowedTools: [],
      }
    });

    for await (const message of result) {
      if (message.type === 'assistant' && message.text) {
        process.stdout.write(message.text);
      }
    }
  } catch (error: any) {
    if (error.message?.includes('aborted') || error.constructor.name === 'AbortError') {
      console.log('\n✓ Query successfully aborted');
      return; // Exit early on expected abort
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
}

// Example 2: Usage Tracking
async function usageTrackingExample() {
  console.log('\n=== Usage Tracking Example ===\n');

  const result = query({
    prompt: 'What is 2 + 2? Please explain your answer.',
    options: {
      allowedTools: [],
    }
  });

  let inputTokens = 0;
  let outputTokens = 0;
  let cacheRead = 0;
  let cacheWrite = 0;

  for await (const message of result) {
    if (message.type === 'assistant' && message.text) {
      console.log('Assistant:', message.text);
    }
    
    // Track usage from messages that include usage data
    if ((message as any).usage) {
      const usage = (message as any).usage;
      inputTokens = usage.input_tokens || inputTokens;
      outputTokens = usage.output_tokens || outputTokens;
      cacheRead = usage.cache_read_input_tokens || cacheRead;
      cacheWrite = usage.cache_creation_input_tokens || cacheWrite;
    }
  }
  
  console.log('\n📊 Usage Statistics (if available):');
  console.log(`Input tokens: ${inputTokens}`);
  console.log(`Output tokens: ${outputTokens}`);
  console.log(`Cache read: ${cacheRead}`);
  console.log(`Cache write: ${cacheWrite}`);
  console.log(`Total: ${inputTokens + outputTokens} tokens`);
  console.log('\n💡 Note: Usage tracking requires an Anthropic API key');
}

// Example 3: Subagents
async function subagentsExample() {
  console.log('\n=== Subagents Example ===\n');

  const result = query({
    prompt: 'Review the code quality of package.json and provide suggestions',
    options: {
      // Define specialized subagents
      agents: {
        'code-reviewer': {
          name: 'Code Quality Reviewer',
          instructions: `You are a code quality expert. Review code for:
            - Best practices
            - Potential bugs
            - Performance issues
            - Security concerns
            Provide specific, actionable feedback.`,
          allowedTools: ['Read', 'Grep'],
        },
        'security-auditor': {
          name: 'Security Auditor',
          instructions: `You are a security expert. Focus on:
            - Dependency vulnerabilities
            - Insecure patterns
            - Data exposure risks
            - Authentication issues`,
          allowedTools: ['Read'],
        }
      },
    }
  });

  for await (const message of result) {
    if (message.type === 'assistant' && message.text) {
      console.log('Assistant:', message.text);
    } else if (message.type === 'subagent_start') {
      console.log(`\n[Subagent Started: ${(message as any).agent_name}]`);
    } else if (message.type === 'subagent_stop') {
      console.log(`[Subagent Stopped]\n`);
    }
  }
}

// Example 4: Conversation Continuation
async function conversationContinuationExample() {
  console.log('\n=== Conversation Continuation Example ===\n');

  // First query
  console.log('First query:');
  const result1 = query({
    prompt: 'What is the capital of France?',
    options: {
      allowedTools: [],
    }
  });

  for await (const message of result1) {
    if (message.type === 'assistant' && message.text) {
      console.log('Assistant:', message.text);
    }
  }

  // Continue the conversation
  console.log('\nFollow-up query (continuing conversation):');
  const result2 = query({
    prompt: 'What is the population of that city?',
    options: {
      continue: true,  // Continue the previous conversation
      allowedTools: [],
    }
  });

  for await (const message of result2) {
    if (message.type === 'assistant' && message.text) {
      console.log('Assistant:', message.text);
    }
  }
}

// Example 5: Custom Model and Temperature
async function modelConfigExample() {
  console.log('\n=== Model Configuration Example ===\n');

  const models = [
    { name: 'Sonnet (balanced)', model: 'claude-sonnet-4-20250514', temp: 0.7 },
    { name: 'Opus (powerful)', model: 'claude-opus-4-20250514', temp: 0.5 },
    { name: 'Haiku (fast)', model: 'claude-haiku-4-20250514', temp: 0.8 },
  ];

  for (const config of models) {
    console.log(`\nUsing ${config.name}:`);
    
    const result = query({
      prompt: 'Write a haiku about programming',
      options: {
        model: config.model,
        temperature: config.temp,
        allowedTools: [],
      }
    });

    for await (const message of result) {
      if (message.type === 'assistant' && message.text) {
        console.log(message.text);
      }
    }
  }
}

// Main function to run all examples
async function advancedFeaturesExample() {
  console.log('\n' + '='.repeat(60));
  console.log('Advanced Features Example');
  console.log('='.repeat(60));

  try {
    await abortExample();
    console.log('\n' + '-'.repeat(60));
    
    await usageTrackingExample();
    console.log('\n' + '-'.repeat(60));
    
    await subagentsExample();
    console.log('\n' + '-'.repeat(60));
    
    await conversationContinuationExample();
    console.log('\n' + '-'.repeat(60));
    
    // Comment out to save API calls
    // await modelConfigExample();
    
    console.log('\n✓ All advanced features examples completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  advancedFeaturesExample();
}

export { advancedFeaturesExample };


