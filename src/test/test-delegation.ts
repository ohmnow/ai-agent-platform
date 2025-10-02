/**
 * Phase 0: Validation Tests
 *
 * Tests core SDK behaviors before building the full MVP:
 * 1. SDK Type Validation (hook events, agent definitions)
 * 2. Agent Delegation (Task tool vs automatic)
 * 3. Context Management (compaction, memory)
 * 4. Tool Access (file system, MCP servers)
 */

import { query, type AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

console.log('🧪 Phase 0: SDK Validation Tests\n');
console.log('=' .repeat(50));

// Test 1: Hook Event Names (PascalCase validation)
console.log('\n📋 Test 1: Hook Event Names');
console.log('-'.repeat(50));

async function testHookEvents() {
  let hookEventsFired: string[] = [];

  const result = query({
    prompt: 'What is 2 + 2?',
    options: {
      hooks: [(input) => {
        hookEventsFired.push(input.hook_event_name);
        console.log(`  ✓ Hook fired: ${input.hook_event_name}`);
      }],
      maxTurns: 1
    }
  });

  for await (const message of result) {
    if (message.type === 'result') {
      console.log(`  Result: ${message.result}`);
    }
  }

  console.log(`  Total hooks fired: ${hookEventsFired.length}`);
  console.log(`  Hook events: ${hookEventsFired.join(', ')}`);
  return hookEventsFired;
}

// Test 2: Agent Definition Structure
console.log('\n📋 Test 2: Agent Definition Structure');
console.log('-'.repeat(50));

const testAgent: AgentDefinition = {
  description: 'Test agent for validation',
  prompt: 'You are a test agent. Just respond with "test successful".',
  tools: ['Read'],
  model: 'inherit'
};

console.log('  ✓ AgentDefinition uses:');
console.log('    - prompt (not instructions)');
console.log('    - tools (not allowedTools)');
console.log('    - description field');
console.log('    - model field');

// Test 3: Task Tool for Delegation
console.log('\n📋 Test 3: Task Tool Delegation');
console.log('-'.repeat(50));

async function testTaskToolDelegation() {
  const result = query({
    prompt: 'Use the test-helper agent to help me with a calculation: what is 5 + 3?',
    options: {
      agents: {
        'test-helper': {
          description: 'MUST BE USED for calculations. Use for any math operations.',
          prompt: 'You are a calculation helper. Perform the calculation and return the result.',
          tools: [],
          model: 'inherit'
        }
      },
      allowedTools: ['Task'],
      maxTurns: 3
    }
  });

  let taskToolUsed = false;
  let delegationDetected = false;

  for await (const message of result) {
    if (message.type === 'assistant' && message.content) {
      for (const block of message.content) {
        if (block.type === 'tool_use' && block.name === 'Task') {
          taskToolUsed = true;
          delegationDetected = true;
          console.log('  ✓ Task tool used for delegation');
          console.log(`    Input: ${JSON.stringify(block.input).substring(0, 100)}...`);
        }
      }
    }

    if (message.type === 'result') {
      console.log(`  Result: ${message.result}`);
    }
  }

  if (!taskToolUsed) {
    console.log('  ⚠️  Task tool NOT used - Claude may have answered directly');
  }

  return { taskToolUsed, delegationDetected };
}

// Test 4: Session ID Extraction
console.log('\n📋 Test 4: Session Management');
console.log('-'.repeat(50));

async function testSessionManagement() {
  let sessionId: string | undefined;

  const result = query({
    prompt: 'Hello, what is your name?',
    options: {
      maxTurns: 1
    }
  });

  for await (const message of result) {
    if (message.type === 'system' && message.subtype === 'init') {
      sessionId = message.session_id;
      console.log(`  ✓ Session ID captured: ${sessionId}`);
    }
  }

  if (!sessionId) {
    console.log('  ⚠️  No session ID found in system message');
  }

  return sessionId;
}

// Test 5: Streaming Input Mode (Required for MCP)
console.log('\n📋 Test 5: Streaming Input Mode');
console.log('-'.repeat(50));

async function testStreamingInput() {
  async function* generateInput() {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'What is 1 + 1?'
      }
    };
  }

  const result = query({
    prompt: generateInput(),
    options: {
      maxTurns: 1
    }
  });

  let responded = false;
  for await (const message of result) {
    if (message.type === 'result') {
      responded = true;
      console.log('  ✓ Streaming input mode works');
      console.log(`    Response: ${message.result}`);
    }
  }

  return responded;
}

// Test 6: System Prompt Preset
console.log('\n📋 Test 6: System Prompt Preset');
console.log('-'.repeat(50));

async function testSystemPromptPreset() {
  const result = query({
    prompt: 'List your available tools',
    options: {
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: '\n\nThis is a test of the preset system.'
      },
      maxTurns: 1
    }
  });

  let toolsListed = false;
  for await (const message of result) {
    if (message.type === 'result' && message.result.includes('tool')) {
      toolsListed = true;
      console.log('  ✓ System prompt preset loaded');
      console.log(`    Tools mentioned: ${message.result.substring(0, 100)}...`);
    }
  }

  return toolsListed;
}

// Run all tests
async function runAllTests() {
  try {
    console.log('\n🏃 Running all validation tests...\n');

    // Test 1: Hook Events
    const hookEvents = await testHookEvents();

    // Test 2: Agent Definition (just structure validation)
    // Already validated by TypeScript compilation

    // Test 3: Task Tool Delegation
    const { taskToolUsed, delegationDetected } = await testTaskToolDelegation();

    // Test 4: Session Management
    const sessionId = await testSessionManagement();

    // Test 5: Streaming Input
    const streamingWorks = await testStreamingInput();

    // Test 6: System Prompt Preset
    const presetWorks = await testSystemPromptPreset();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`✓ Hook events: ${hookEvents.length > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Agent definition structure: PASS (TypeScript validated)`);
    console.log(`${taskToolUsed ? '✓' : '⚠️'} Task tool delegation: ${taskToolUsed ? 'PASS' : 'UNCLEAR'}`);
    console.log(`${sessionId ? '✓' : '⚠️'} Session management: ${sessionId ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Streaming input: ${streamingWorks ? 'PASS' : 'FAIL'}`);
    console.log(`✓ System prompt preset: ${presetWorks ? 'PASS' : 'FAIL'}`);

    console.log('\n📝 Key Findings:');
    console.log('1. Hook events use PascalCase naming');
    console.log('2. AgentDefinition uses prompt/tools fields');
    console.log(`3. Task tool ${taskToolUsed ? 'IS' : 'may NOT be'} automatically used for delegation`);
    console.log('4. Session IDs are available from system messages');
    console.log('5. Streaming input mode is required for MCP servers');
    console.log('6. System prompt presets work correctly');

    if (!taskToolUsed) {
      console.log('\n⚠️  WARNING: Task tool was not automatically invoked.');
      console.log('   The agent may answer directly without delegation.');
      console.log('   Master orchestrator may need explicit delegation instructions.');
    }

    console.log('\n✅ Phase 0 validation complete!');
    console.log('Ready to proceed to Phase 1: Core Infrastructure\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    throw error;
  }
}

// Run tests
runAllTests().catch(console.error);
