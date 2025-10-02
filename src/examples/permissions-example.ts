/**
 * Permissions Example
 * 
 * Demonstrates how to control tool permissions and implement
 * custom permission logic with the canUseTool callback.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { PermissionResult, ToolInput } from '@anthropic-ai/claude-agent-sdk';

// Custom permission function that implements fine-grained control
async function customPermissionCheck(tool: ToolInput): Promise<PermissionResult> {
  console.log(`\n[Permission Check] Tool: ${tool.name}`);
  
  // Example 1: Block all bash commands
  if (tool.name === 'Bash') {
    console.log('❌ Bash commands are blocked in this session');
    return {
      allowed: false,
      reason: 'Bash commands are not allowed for security reasons',
    };
  }

  // Example 2: Restrict file writes to specific directories
  if (tool.name === 'Write' || tool.name === 'Edit') {
    const filePath = (tool as any).file_path || (tool as any).path;
    
    if (filePath && !filePath.startsWith('/tmp/') && !filePath.startsWith('./temp/')) {
      console.log(`❌ Write operation blocked: ${filePath}`);
      return {
        allowed: false,
        reason: 'Write operations only allowed in /tmp/ or ./temp/',
      };
    }
  }

  // Example 3: Limit read operations to specific file types
  if (tool.name === 'Read') {
    const filePath = (tool as any).target_file || (tool as any).path;
    const allowedExtensions = ['.txt', '.md', '.json', '.ts', '.js'];
    
    if (filePath && !allowedExtensions.some(ext => filePath.endsWith(ext))) {
      console.log(`❌ Read operation blocked: ${filePath}`);
      return {
        allowed: false,
        reason: `Only ${allowedExtensions.join(', ')} files can be read`,
      };
    }
  }

  // Example 4: Allow with confirmation for certain tools
  if (tool.name === 'WebSearch') {
    console.log('⚠️  Web search requires confirmation (auto-allowed in this example)');
    // In a real app, you might prompt the user here
    return {
      allowed: true,
      requiresConfirmation: true,
    };
  }

  // Allow by default
  console.log('✅ Tool allowed');
  return { allowed: true };
}

async function permissionsExample() {
  console.log('=== Permissions Example ===\n');
  console.log('⚠️  Note: This example requires an Anthropic API key set in ANTHROPIC_API_KEY');
  console.log('    The SDK needs the API key for permission management features.\n');

  // Check if API key exists
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('📚 Permission Control Concepts:\n');
    
    console.log('1️⃣  allowedTools - Restrict which tools the agent can use:');
    console.log('   allowedTools: ["Read", "Glob"]  // Only allow read operations\n');
    
    console.log('2️⃣  permissionMode - Control permission behavior:');
    console.log('   - "strict"     : Only explicitly allowed tools');
    console.log('   - "permissive" : Most tools allowed, some need confirmation');
    console.log('   - "ask"        : Prompt user for each tool use\n');
    
    console.log('3️⃣  canUseTool - Custom permission logic:');
    console.log('   canUseTool: async (tool) => {');
    console.log('     if (tool.name === "Bash") return { allowed: false };');
    console.log('     return { allowed: true };');
    console.log('   }\n');
    
    console.log('4️⃣  additionalDirectories - Restrict file access:');
    console.log('   additionalDirectories: ["/safe/directory"]\n');
    
    console.log('📖 Example usage:');
    console.log('```typescript');
    console.log('const result = query({');
    console.log('  prompt: "Read package.json",');
    console.log('  options: {');
    console.log('    allowedTools: ["Read", "Glob"],');
    console.log('    permissionMode: "strict",');
    console.log('    canUseTool: customPermissionCheck,');
    console.log('  }');
    console.log('});');
    console.log('```\n');
    
    console.log('✓ Permissions concepts explained');
    console.log('💡 Set ANTHROPIC_API_KEY to run live permission examples');
    return;
  }

  // If API key exists, run actual examples
  const abortController = new AbortController();

  try {
    console.log('Running live permission examples...\n');

    const result1 = query({
      prompt: 'List files in the current directory',
      options: {
        allowedTools: ['Glob'],
        permissionMode: 'strict',
        abortController,
        maxTurns: 2,
      }
    });

    for await (const message of result1) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      }
    }

    console.log('\n✓ Permissions example completed');
  } catch (error) {
    console.error('Error:', error);
    abortController.abort();
    throw error;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  permissionsExample();
}

export { permissionsExample };


