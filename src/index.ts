/**
 * Claude Agent SDK Test Suite
 * 
 * Main entry point for running all examples or specific ones.
 */

import { basicQueryExample } from './examples/basic-query.js';
import { customToolsExample } from './examples/custom-tools.js';
import { mcpServerExample } from './examples/mcp-server.js';
import { streamingModeExample } from './examples/streaming-mode.js';
import { hooksExample } from './examples/hooks-example.js';
import { permissionsExample } from './examples/permissions-example.js';
import { advancedFeaturesExample } from './examples/advanced-features.js';
import { memoryExample } from './examples/memory-example.js';

const examples = {
  basic: { name: 'Basic Query', fn: basicQueryExample },
  tools: { name: 'Custom Tools', fn: customToolsExample },
  mcp: { name: 'MCP Server', fn: mcpServerExample },
  streaming: { name: 'Streaming Mode', fn: streamingModeExample },
  hooks: { name: 'Hooks', fn: hooksExample },
  permissions: { name: 'Permissions', fn: permissionsExample },
  advanced: { name: 'Advanced Features', fn: advancedFeaturesExample },
  memory: { name: 'Memory & Sessions', fn: memoryExample },
};

async function runExample(exampleKey: string) {
  const example = examples[exampleKey as keyof typeof examples];
  
  if (!example) {
    console.error(`Unknown example: ${exampleKey}`);
    console.log('\nAvailable examples:');
    Object.entries(examples).forEach(([key, ex]) => {
      console.log(`  - ${key}: ${ex.name}`);
    });
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${example.name}`);
  console.log('='.repeat(60));
  
  await example.fn();
}

async function runAllExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('Claude Agent SDK - Test Suite');
  console.log('='.repeat(60));
  console.log('\nNote: Some examples require an Anthropic API key');
  console.log('Set ANTHROPIC_API_KEY environment variable to run them.\n');

  let successCount = 0;
  let failureCount = 0;

  for (const [key, example] of Object.entries(examples)) {
    try {
      await runExample(key);
      successCount++;
      console.log('\n');
      
      // Add delay between tests to allow process cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failureCount++;
      console.error(`\n❌ Error in ${example.name}:`, error);
      console.log('\nContinuing to next example after cleanup delay...\n');
      
      // Longer delay after failures to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('='.repeat(60));
  console.log('Test Suite Summary');
  console.log('='.repeat(60));
  console.log(`✓ Passed: ${successCount}`);
  console.log(`✗ Failed: ${failureCount}`);
  console.log(`Total: ${successCount + failureCount}`);
  console.log('='.repeat(60));
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  npm start                    # Run all examples');
  console.log('  npm start <example-name>     # Run specific example');
  console.log('\nAvailable examples:');
  Object.entries(examples).forEach(([key, ex]) => {
    console.log(`  - ${key}: ${ex.name}`);
  });
  console.log('\nOr use npm run scripts:');
  Object.keys(examples).forEach(key => {
    console.log(`  npm run example:${key}`);
  });
} else if (args[0] === 'all') {
  runAllExamples().catch(console.error);
} else {
  runExample(args[0]).catch(console.error);
}

export { runExample, runAllExamples };

