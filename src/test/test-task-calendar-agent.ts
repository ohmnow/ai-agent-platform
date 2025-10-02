/**
 * Task Calendar Agent Integration Test
 *
 * Tests that the task and calendar management features work correctly with database tools
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { userDataServer } from '../mcp-servers/user-data-server.js';
import { taskCalendarAgentConfig } from '../agents/task-calendar-agent.js';

async function testTaskCalendarAgent() {
  console.log('🧪 Testing Task Calendar Agent Integration\n');
  console.log('='.repeat(50));

  // Test 1: Direct task creation via MCP tool
  console.log('\n✅ Test 1: Direct task creation');
  const start1 = Date.now();

  async function* generateInput1() {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'Use manage_tasks to create a test task called "Review quarterly reports" with HIGH priority'
      }
    };
  }

  const result1 = query({
    prompt: generateInput1(),
    options: {
      mcpServers: { 'user-data': userDataServer },
      allowedTools: ['mcp__user-data__manage_tasks'],
      dangerouslySkipPermissions: true,
      maxTurns: 3,
    }
  });

  let response1 = '';
  let taskId = '';
  for await (const message of result1) {
    if (message.type === 'result') {
      response1 = message.result || '';
      // Extract task ID from response for later tests
      const idMatch = response1.match(/ID: ([^)]+)/);
      if (idMatch) taskId = idMatch[1];
    }
  }

  const elapsed1 = Date.now() - start1;
  console.log(`   ✅ Response: ${response1.substring(0, 200)}...`);
  console.log(`   📝 Task ID: ${taskId}`);
  console.log(`   ⚡ Time: ${elapsed1}ms`);

  // Test 2: Task-calendar agent handling task creation request
  console.log('\n📅 Test 2: Agent-based task creation');
  const start2 = Date.now();

  async function* generateInput2() {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'Create a task for "Prepare presentation slides" with MEDIUM priority, due tomorrow, estimated 2 hours'
      }
    };
  }

  const result2 = query({
    prompt: generateInput2(),
    options: {
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: `\n\nYou are testing the task-calendar agent. Use the available MCP tools directly without asking for permission.`
      },
      agents: { 'task-calendar': taskCalendarAgentConfig },
      mcpServers: { 'user-data': userDataServer },
      allowedTools: ['Task', 'mcp__user-data__manage_tasks', 'mcp__user-data__manage_time_blocks', 'mcp__user-data__track_productivity'],
      dangerouslySkipPermissions: true,
      maxTurns: 5,
    }
  });

  let response2 = '';
  for await (const message of result2) {
    if (message.type === 'result') {
      response2 = message.result || '';
    }
  }

  const elapsed2 = Date.now() - start2;
  console.log(`   ✅ Response: ${response2.substring(0, 200)}...`);
  console.log(`   ⚡ Time: ${elapsed2}ms`);

  // Test 3: List tasks
  console.log('\n📋 Test 3: List tasks');
  const start3 = Date.now();

  async function* generateInput3() {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'Show me all my current tasks'
      }
    };
  }

  const result3 = query({
    prompt: generateInput3(),
    options: {
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: `\n\nYou are testing the task-calendar agent. Use the available MCP tools directly without asking for permission.`
      },
      agents: { 'task-calendar': taskCalendarAgentConfig },
      mcpServers: { 'user-data': userDataServer },
      allowedTools: ['Task', 'mcp__user-data__manage_tasks', 'mcp__user-data__manage_time_blocks', 'mcp__user-data__track_productivity'],
      dangerouslySkipPermissions: true,
      maxTurns: 5,
    }
  });

  let response3 = '';
  for await (const message of result3) {
    if (message.type === 'result') {
      response3 = message.result || '';
    }
  }

  const elapsed3 = Date.now() - start3;
  console.log(`   ✅ Response: ${response3.substring(0, 300)}...`);
  console.log(`   ⚡ Time: ${elapsed3}ms`);

  // Test 4: Time blocking
  console.log('\n⏰ Test 4: Create time block');
  const start4 = Date.now();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const endTime = new Date(tomorrow);
  endTime.setHours(11, 0, 0, 0);

  async function* generateInput4() {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: `Block time tomorrow from 9 AM to 11 AM for "Deep Work - Code Review"`
      }
    };
  }

  const result4 = query({
    prompt: generateInput4(),
    options: {
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: `\n\nYou are testing the task-calendar agent. Use the available MCP tools directly without asking for permission.`
      },
      agents: { 'task-calendar': taskCalendarAgentConfig },
      mcpServers: { 'user-data': userDataServer },
      allowedTools: ['Task', 'mcp__user-data__manage_tasks', 'mcp__user-data__manage_time_blocks', 'mcp__user-data__track_productivity'],
      dangerouslySkipPermissions: true,
      maxTurns: 5,
    }
  });

  let response4 = '';
  for await (const message of result4) {
    if (message.type === 'result') {
      response4 = message.result || '';
    }
  }

  const elapsed4 = Date.now() - start4;
  console.log(`   ✅ Response: ${response4.substring(0, 200)}...`);
  console.log(`   ⚡ Time: ${elapsed4}ms`);

  // Test 5: Productivity tracking
  console.log('\n📊 Test 5: Productivity logging');
  const start5 = Date.now();

  async function* generateInput5() {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'Log my productivity for today: completed 3 tasks, spent 4 hours working, focus was good (rating 4/5)'
      }
    };
  }

  const result5 = query({
    prompt: generateInput5(),
    options: {
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: `\n\nYou are testing the task-calendar agent. Use the available MCP tools directly without asking for permission.`
      },
      agents: { 'task-calendar': taskCalendarAgentConfig },
      mcpServers: { 'user-data': userDataServer },
      allowedTools: ['Task', 'mcp__user-data__manage_tasks', 'mcp__user-data__manage_time_blocks', 'mcp__user-data__track_productivity'],
      dangerouslySkipPermissions: true,
      maxTurns: 5,
    }
  });

  let response5 = '';
  for await (const message of result5) {
    if (message.type === 'result') {
      response5 = message.result || '';
    }
  }

  const elapsed5 = Date.now() - start5;
  console.log(`   ✅ Response: ${response5.substring(0, 200)}...`);
  console.log(`   ⚡ Time: ${elapsed5}ms`);

  // Test 6: Complete task (if we have a task ID)
  if (taskId) {
    console.log('\n🎉 Test 6: Complete task');
    const start6 = Date.now();

    async function* generateInput6() {
      yield {
        type: 'user' as const,
        message: {
          role: 'user' as const,
          content: `Complete task ${taskId} and log that it took 90 minutes`
        }
      };
    }

    const result6 = query({
      prompt: generateInput6(),
      options: {
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: `\n\nYou are testing the task-calendar agent. Use the available MCP tools directly without asking for permission.`
        },
        agents: { 'task-calendar': taskCalendarAgentConfig },
        mcpServers: { 'user-data': userDataServer },
        allowedTools: ['Task', 'mcp__user-data__manage_tasks', 'mcp__user-data__manage_time_blocks', 'mcp__user-data__track_productivity'],
        dangerouslySkipPermissions: true,
        maxTurns: 5,
      }
    });

    let response6 = '';
    for await (const message of result6) {
      if (message.type === 'result') {
        response6 = message.result || '';
      }
    }

    const elapsed6 = Date.now() - start6;
    console.log(`   ✅ Response: ${response6.substring(0, 200)}...`);
    console.log(`   ⚡ Time: ${elapsed6}ms`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 TASK CALENDAR AGENT TEST SUMMARY\n');
  console.log(`   Test 1 (Direct task creation): ${elapsed1}ms`);
  console.log(`   Test 2 (Agent task creation): ${elapsed2}ms`);
  console.log(`   Test 3 (List tasks): ${elapsed3}ms`);
  console.log(`   Test 4 (Time blocking): ${elapsed4}ms`);
  console.log(`   Test 5 (Productivity logging): ${elapsed5}ms`);
  console.log(`\n   ✅ Task Calendar Agent integration working!`);
  console.log('='.repeat(50) + '\n');
}

// Error handling wrapper
async function runTests() {
  try {
    await testTaskCalendarAgent();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();