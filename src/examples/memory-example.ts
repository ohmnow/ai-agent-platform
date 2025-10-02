/**
 * Memory Example
 * 
 * Demonstrates how to maintain persistent context and memory
 * across multiple interactions using session management and continuation.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

// Simulate a simple in-memory store for persistent data
const memoryStore = new Map<string, any>();

async function memoryExample() {
  console.log('=== Memory and Session Management Example ===\n');

  try {
    // Example 1: Session continuation - maintain context across queries
    console.log('Example 1: Session Continuation\n');
    console.log('First interaction:');
    
    const result1 = query({
      prompt: 'My name is Alice and I am working on a TypeScript project. Remember this.',
      options: {
        allowedTools: [],
        maxTurns: 1,
      }
    });

    for await (const message of result1) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      }
    }

    console.log('\nSecond interaction (continuing session):');
    
    const result2 = query({
      prompt: 'What is my name and what am I working on?',
      options: {
        continue: true,  // Continue the previous conversation
        allowedTools: [],
        maxTurns: 1,
      }
    });

    for await (const message of result2) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      }
    }

    console.log('\n---\n');

    // Example 2: Using custom memory store with MCP tools
    console.log('Example 2: Custom Memory with Context\n');

    const result3 = query({
      prompt: `I'm building a task management app. The main features are:
      1. Create tasks with titles and descriptions
      2. Mark tasks as complete
      3. Filter tasks by status
      
      Ask me questions about the implementation and remember the decisions we make.`,
      options: {
        allowedTools: [],
        maxTurns: 2,
      }
    });

    for await (const message of result3) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
        
        // Store important information in our memory store
        memoryStore.set('project_context', {
          type: 'task_management_app',
          features: ['create', 'complete', 'filter'],
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log('\n[Memory Store Updated]');
    console.log('Stored context:', memoryStore.get('project_context'));

    console.log('\n---\n');

    // Example 3: Long-running session with memory accumulation
    console.log('Example 3: Accumulating Context Over Multiple Turns\n');

    let turnCount = 0;
    const facts: string[] = [];

    const result4 = query({
      prompt: 'Let\'s build up some context. First fact: TypeScript has strict typing.',
      options: {
        allowedTools: [],
        maxTurns: 1,
      }
    });

    for await (const message of result4) {
      if (message.type === 'assistant' && message.text) {
        console.log(`Turn ${++turnCount} - Assistant:`, message.text);
        facts.push('TypeScript has strict typing');
      }
    }

    // Continue adding information
    const followUpFacts = [
      'React uses JSX for templating',
      'Node.js runs JavaScript on the server',
    ];

    for (const fact of followUpFacts) {
      const result = query({
        prompt: `Add this fact: ${fact}. Now summarize all the facts I've told you.`,
        options: {
          continue: true,
          allowedTools: [],
          maxTurns: 1,
        }
      });

      for await (const message of result) {
        if (message.type === 'assistant' && message.text) {
          console.log(`Turn ${++turnCount} - Assistant:`, message.text);
          facts.push(fact);
        }
      }
    }

    console.log('\n[Facts accumulated in memory]:', facts);

    console.log('\n---\n');

    // Example 4: Working directory context as memory
    console.log('Example 4: Using Project Context as Memory\n');

    const result5 = query({
      prompt: 'Analyze the package.json file and remember the key dependencies',
      options: {
        allowedTools: ['Read'],
        maxTurns: 3,
      }
    });

    const dependencies: string[] = [];

    for await (const message of result5) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
        
        // Extract dependencies from the response (simplified)
        if (message.text.includes('dependency') || message.text.includes('dependencies')) {
          dependencies.push('claude-agent-sdk', 'zod', 'typescript');
        }
      }
    }

    // Now ask a follow-up question that relies on that context
    console.log('\nFollow-up using remembered context:');
    
    const result6 = query({
      prompt: 'Based on what you just learned from package.json, what kind of project is this?',
      options: {
        continue: true,
        allowedTools: [],
        maxTurns: 2,
      }
    });

    for await (const message of result6) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      }
    }

    console.log('\n✓ Memory example completed');
    console.log('\n💡 Key takeaways:');
    console.log('   - Use `continue: true` to maintain context across queries');
    console.log('   - Session state persists between queries in the same process');
    console.log('   - File operations create implicit "memory" of project structure');
    console.log('   - Combine with custom stores for explicit memory management');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  memoryExample();
}

export { memoryExample };

