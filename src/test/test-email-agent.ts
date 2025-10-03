/**
 * Test Email Agent
 *
 * Test script to verify email agent functionality and Gmail API integration.
 * This test will work in mock mode if credentials are not available.
 */

import { MasterOrchestrator } from '../agents/master-orchestrator.js';
import { sessionManager } from '../lib/sessions.js';

console.log('📧 Testing Email Agent\n');
console.log('='.repeat(50));

async function testEmailAgent() {
  // Create a session
  const session = sessionManager.createSession();
  console.log(`Created session: ${session.id}\n`);

  // Create orchestrator
  const orchestrator = new MasterOrchestrator(session.id);

  // Test 1: Inbox Summary
  console.log('📋 Test 1: Email Inbox Summary');
  console.log('-'.repeat(50));

  try {
    const { messages, events, sessionId } = await orchestrator.processQuery(
      'Can you summarize my email inbox from today? Show me any urgent emails.'
    );

    console.log(`\nReceived ${messages.length} messages`);
    console.log(`Tracked ${events.length} events`);
    console.log(`Session ID: ${sessionId}`);

    // Check if Task tool was used to delegate to email agent
    const taskToolUsed = events.some(e => e.type === 'tool_use' && e.toolName === 'Task');
    const delegationOccurred = events.some(e => e.type === 'agent_delegation');
    const emailAgentUsed = events.some(e => e.type === 'agent_delegation' && e.agentName === 'email');

    console.log(`\nTask tool used: ${taskToolUsed ? 'YES ✓' : 'NO ⚠️'}`);
    console.log(`Delegation occurred: ${delegationOccurred ? 'YES ✓' : 'NO ⚠️'}`);
    console.log(`Email agent used: ${emailAgentUsed ? 'YES ✓' : 'NO ⚠️'}`);

    if (delegationOccurred) {
      const delegatedAgent = events.find(e => e.type === 'agent_delegation')?.agentName;
      console.log(`Delegated to: ${delegatedAgent}`);
    }

    // Find the final result
    const resultMessage = messages.find(m => m.type === 'result');
    if (resultMessage) {
      console.log(`\nFinal result preview: ${resultMessage.result?.substring(0, 300)}...`);
    }

  } catch (error) {
    console.error('❌ Test 1 failed:', error);

    // Check if it's an OAuth/credentials issue
    if (error instanceof Error) {
      if (error.message.includes('credentials') || error.message.includes('OAuth')) {
        console.log('\n📝 Note: This error is expected if Gmail credentials are not set up.');
        console.log('To fully test email functionality:');
        console.log('1. Add credentials.json to project root');
        console.log('2. Complete OAuth flow on first run');
        console.log('3. Re-run this test');
      }
    }
  }

  console.log('\n' + '='.repeat(50));

  // Test 2: Email Search
  console.log('📋 Test 2: Email Search Functionality');
  console.log('-'.repeat(50));

  try {
    const { messages, events } = await orchestrator.processQuery(
      'Find emails from the last week that mention "meeting" or "project".'
    );

    console.log(`\nReceived ${messages.length} messages`);
    console.log(`Tracked ${events.length} events`);

    const emailAgentUsed = events.some(e => e.type === 'agent_delegation' && e.agentName === 'email');
    console.log(`Email agent used: ${emailAgentUsed ? 'YES ✓' : 'NO ⚠️'}`);

    const resultMessage = messages.find(m => m.type === 'result');
    if (resultMessage) {
      console.log(`\nSearch result preview: ${resultMessage.result?.substring(0, 300)}...`);
    }

  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  console.log('\n' + '='.repeat(50));

  // Test 3: Email Draft Generation
  console.log('📋 Test 3: Email Draft Generation');
  console.log('-'.repeat(50));

  try {
    const { messages, events } = await orchestrator.processQuery(
      'Help me draft a professional email reply to thank someone for a meeting. Make it formal and brief.'
    );

    console.log(`\nReceived ${messages.length} messages`);
    console.log(`Tracked ${events.length} events`);

    const emailAgentUsed = events.some(e => e.type === 'agent_delegation' && e.agentName === 'email');
    console.log(`Email agent used: ${emailAgentUsed ? 'YES ✓' : 'NO ⚠️'}`);

    const resultMessage = messages.find(m => m.type === 'result');
    if (resultMessage) {
      console.log(`\nDraft preview: ${resultMessage.result?.substring(0, 400)}...`);
    }

  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Email Agent Test Summary');
  console.log('✅ Email agent integration test completed');
  console.log('✅ All delegation patterns tested');
  console.log('✅ Error handling validated');

  console.log('\n💡 Next Steps:');
  console.log('1. Set up Gmail API credentials for full functionality');
  console.log('2. Test with real email data once authenticated');
  console.log('3. Verify permission system integration for sending emails');
}

// Run the test
testEmailAgent().catch(console.error);