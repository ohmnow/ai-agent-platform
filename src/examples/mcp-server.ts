/**
 * MCP Server Integration Example
 * 
 * Demonstrates how to configure and use different types of MCP servers
 * (stdio, SSE, HTTP, and SDK-based servers).
 */

import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

// Create a simple SDK-based MCP server
const noteTool = tool(
  'create_note',
  'Create a note with a title and content',
  {
    title: z.string().describe('Note title'),
    content: z.string().describe('Note content'),
  },
  async (args) => {
    // In a real app, this would save to a database or file
    const note = {
      id: Date.now(),
      title: args.title,
      content: args.content,
      created: new Date().toISOString(),
    };

    return {
      content: [{
        type: 'text',
        text: `Note created:\nID: ${note.id}\nTitle: ${note.title}\nContent: ${note.content}\nCreated: ${note.created}`,
      }],
    };
  }
);

const searchNoteTool = tool(
  'search_notes',
  'Search notes by keyword',
  {
    keyword: z.string().describe('Keyword to search for'),
  },
  async (args) => {
    // Simulated search results
    const results = [
      { id: 1, title: 'Meeting Notes', content: `Found keyword: ${args.keyword}` },
      { id: 2, title: 'Project Ideas', content: `Related to: ${args.keyword}` },
    ];

    return {
      content: [{
        type: 'text',
        text: `Found ${results.length} notes matching "${args.keyword}":\n` +
              results.map(r => `- [${r.id}] ${r.title}: ${r.content}`).join('\n'),
      }],
    };
  }
);

async function mcpServerExample() {
  console.log('=== MCP Server Integration Example ===\n');

  try {
    // Example 1: SDK-based MCP server (runs in-process)
    const noteServer = createSdkMcpServer({
      name: 'note-manager',
      version: '1.0.0',
      tools: [noteTool, searchNoteTool],
    });

    console.log('Testing SDK-based MCP server...\n');
    
    const result1 = query({
      prompt: 'Create a note with title "Test Note" and content "This is a test of the MCP server"',
      options: {
        mcpServers: [noteServer],
        allowedTools: ['create_note', 'search_notes'],
      }
    });

    for await (const message of result1) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      } else if (message.type === 'tool_use') {
        console.log(`[Tool: ${message.name}]`);
      }
    }

    console.log('\n---\n');

    // Example 2: Configuration for external MCP servers (stdio)
    // Note: This is just configuration - actual server must be running
    console.log('Example stdio MCP server configuration:\n');
    console.log(JSON.stringify({
      command: 'node',
      args: ['path/to/mcp-server.js'],
      env: {
        'API_KEY': 'your-api-key'
      }
    }, null, 2));

    console.log('\n---\n');

    // Example 3: Configuration for SSE MCP server
    console.log('Example SSE MCP server configuration:\n');
    console.log(JSON.stringify({
      url: 'https://example.com/mcp/sse',
      apiKey: 'your-api-key'
    }, null, 2));

    console.log('\n---\n');

    // Example 4: Configuration for HTTP MCP server  
    console.log('Example HTTP MCP server configuration:\n');
    console.log(JSON.stringify({
      url: 'https://example.com/mcp/http',
      apiKey: 'your-api-key'
    }, null, 2));

    console.log('\n✓ MCP server examples completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mcpServerExample();
}

export { mcpServerExample };


