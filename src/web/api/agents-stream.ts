/**
 * Streaming Agents API
 *
 * Handles real-time streaming with Server-Sent Events (SSE)
 * Based on streaming-vs-single-mode.md and sessions.md guides
 */

import type { Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { userDataServer } from '../../mcp-servers/user-data-server.js';
import { financeAgentConfig, budgetAnalyzerConfig } from '../../agents/finance-agent.js';
import { researchAgentConfig } from '../../agents/research-agent.js';
import { notesAgentConfig } from '../../agents/notes-agent.js';
import { permissionManager } from '../../lib/permissions.js';

// Track permission decisions per session
const permissionDecisions = new Map<string, { approve: boolean; always: boolean }>();

export async function handleStreamingQuery(req: Request, res: Response) {
  const { prompt: userPrompt, sessionId: resumeSessionId } = req.query;

  if (!userPrompt || typeof userPrompt !== 'string') {
    return res.status(400).json({ error: 'Prompt required' });
  }

  console.log(`\n📥 Streaming query: "${userPrompt.substring(0, 50)}..."`);
  if (resumeSessionId) {
    console.log(`📋 Resuming session: ${resumeSessionId}`);
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  let currentSessionId: string | undefined = resumeSessionId as string | undefined;

  // Set up permission handler that communicates via SSE
  permissionManager.setPermissionRequestHandler(async (toolName, input) => {
    console.log(`🔐 Permission requested for: ${toolName}`);

    // Send permission request to client
    res.write(`event: permission_request\n`);
    res.write(`data: ${JSON.stringify({
      toolName,
      input,
      description: getToolDescription(toolName, input)
    })}\n\n`);

    // Wait for client response
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const decision = permissionDecisions.get(currentSessionId || 'unknown');
        if (decision) {
          clearInterval(checkInterval);
          permissionDecisions.delete(currentSessionId || 'unknown');
          resolve(decision);
        }
      }, 100);

      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve({ approve: false, always: false });
      }, 60000);
    });
  });

  try {
    // Create async generator for streaming input mode
    async function* generateInput() {
      yield {
        type: 'user' as const,
        message: {
          role: 'user' as const,
          content: userPrompt
        }
      };
    }

    // Start query with streaming
    const result = query({
      prompt: generateInput(),
      options: {
        // Use resume to continue previous session
        resume: resumeSessionId as string | undefined,

        // Agent configuration
        agents: {
          'finance': financeAgentConfig,
          'research': researchAgentConfig,
          'notes': notesAgentConfig,
          'budget-analyzer': budgetAnalyzerConfig,
        },

        // MCP servers
        mcpServers: {
          'user-data': userDataServer
        },

        // Tools - Include MCP server tools
        allowedTools: [
          'Task', 'Bash', 'Read', 'Write', 'Grep', 'Glob', 'WebSearch',
          'mcp__user-data__analyze_transactions',
          'mcp__user-data__search_notes',
          'mcp__user-data__get_calendar_events',
        ],

        // Permission handler
        canUseTool: permissionManager.getCanUseToolCallback(),

        // Settings
        settingSources: ['project'],
        maxTurns: 50,
      }
    });

    // Stream messages
    for await (const message of result) {
      // Capture session ID from init message
      if (message.type === 'system' && message.subtype === 'init') {
        currentSessionId = message.session_id;
        console.log(`📋 Session ID: ${currentSessionId}`);

        res.write(`event: session\n`);
        res.write(`data: ${JSON.stringify({ sessionId: currentSessionId })}\n\n`);
        continue;
      }

      // Stream text tokens
      if (message.type === 'text') {
        res.write(`event: text\n`);
        res.write(`data: ${JSON.stringify({ text: message.text })}\n\n`);
        continue;
      }

      // Stream result
      if (message.type === 'result') {
        res.write(`event: result\n`);
        res.write(`data: ${JSON.stringify({ result: message.result })}\n\n`);
        continue;
      }

      // Stream other message types
      res.write(`event: message\n`);
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }

    // Send completion
    res.write(`event: done\n`);
    res.write(`data: ${JSON.stringify({ success: true })}\n\n`);

    console.log(`✅ Streaming completed\n`);

  } catch (error: any) {
    console.error('❌ Streaming error:', error);

    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  } finally {
    res.end();
  }
}

export function handlePermissionResponse(req: Request, res: Response) {
  try {
    const { sessionId, approve, always } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    console.log(`🔐 Permission ${approve ? 'approved' : 'denied'} for session: ${sessionId} (always: ${always})`);

    // Store decision for the permission handler to pick up
    permissionDecisions.set(sessionId, {
      approve: approve === true,
      always: always === true
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Permission response error:', error);
    res.status(500).json({
      error: 'Failed to process permission response',
      message: error.message
    });
  }
}

function getToolDescription(toolName: string, input: any): string {
  const descriptions: Record<string, string> = {
    'mcp__user-data__analyze_transactions': 'Analyze your financial transactions',
    'mcp__user-data__search_notes': 'Search your personal notes',
    'mcp__user-data__get_calendar_events': 'Access your calendar events',
    'WebSearch': 'Search the web for information',
    'WebFetch': `Fetch content from: ${input?.url || 'a website'}`,
    'Bash': `Run command: \`${input?.command || 'unknown'}\``,
    'Read': `Read file: ${input?.file_path || 'unknown'}`,
    'Write': `Write to file: ${input?.file_path || 'unknown'}`,
    'Edit': `Edit file: ${input?.file_path || 'unknown'}`,
  };

  return descriptions[toolName] || `Use tool: ${toolName}`;
}
