/**
 * Test Master Orchestrator
 *
 * Quick test to verify the orchestrator and agent delegation work correctly.
 */

import { MasterOrchestrator } from '../agents/master-orchestrator.js';
import { sessionManager } from '../lib/sessions.js';

console.log('🧪 Testing Master Orchestrator\n');
console.log('='.repeat(50));

async function testOrchestrator() {
  // Create a session
  const session = sessionManager.createSession();
  console.log(`Created session: ${session.id}\n`);

  // Create orchestrator
  const orchestrator = new MasterOrchestrator(session.id);

  // Test 1: Financial query (should delegate to finance agent)
  console.log('📋 Test 1: Financial Query');
  console.log('-'.repeat(50));

  try {
    const { messages, events, sessionId } = await orchestrator.processQuery(
      'How much did I spend on Food in October 2025? Look at the transaction data.'
    );

    console.log(`\nReceived ${messages.length} messages`);
    console.log(`Tracked ${events.length} events`);
    console.log(`Session ID: ${sessionId}`);

    // Check if Task tool was used
    const taskToolUsed = events.some(e => e.type === 'tool_use' && e.toolName === 'Task');
    const delegationOccurred = events.some(e => e.type === 'agent_delegation');

    console.log(`\nTask tool used: ${taskToolUsed ? 'YES ✓' : 'NO ⚠️'}`);
    console.log(`Delegation occurred: ${delegationOccurred ? 'YES ✓' : 'NO ⚠️'}`);

    if (delegationOccurred) {
      const delegatedAgent = events.find(e => e.type === 'agent_delegation')?.agentName;
      console.log(`Delegated to: ${delegatedAgent}`);
    }

    // Find the final result
    const resultMessage = messages.find(m => m.type === 'result');
    if (resultMessage) {
      console.log(`\nFinal result: ${resultMessage.result?.substring(0, 200)}...`);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Orchestrator test complete!\n');
}

testOrchestrator().catch(console.error);
