/**
 * Minimal Hooks Test
 *
 * Test hooks with CORRECT format from permissions.md guide
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

async function testHooks() {
  console.log('🧪 Testing hook functionality with CORRECT format...\n');

  let hooksFired = 0;

  // Query that requires tool usage to trigger hooks
  const result = query({
    prompt: 'Use the Read tool to read the package.json file',
    options: {
      allowedTools: ['Read'],
      hooks: {
        PreToolUse: [{
          hooks: [async (input: any, toolUseId: any, context: any) => {
            hooksFired++;
            console.log('🔥 PRE TOOL HOOK FIRED!');
            console.log('   Tool:', input.tool_name);
            console.log('   Input:', JSON.stringify(input.tool_input, null, 2));
            return { continue: true };
          }]
        }],
        PostToolUse: [{
          hooks: [async (input: any, toolUseId: any, context: any) => {
            hooksFired++;
            console.log('🔥 POST TOOL HOOK FIRED!');
            console.log('   Tool:', input.tool_name);
            return { continue: true };
          }]
        }]
      },
      maxTurns: 5,
    }
  });

  for await (const message of result) {
    console.log('Message type:', message.type);
  }

  console.log('\n✅ Test complete');
  console.log(`Hooks fired: ${hooksFired}`);

  if (hooksFired === 0) {
    console.log('❌ PROBLEM: Hooks did not fire at all!');
  } else {
    console.log('✅ SUCCESS: Hooks are working!');
  }
}

testHooks().catch(console.error);
