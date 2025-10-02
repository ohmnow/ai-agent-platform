/**
 * Agents API Endpoints
 *
 * Handles agent query requests and status checks.
 */

import type { Request, Response } from 'express';
import { MasterOrchestrator } from '../../agents/master-orchestrator.js';
import { sessionManager } from '../../lib/sessions.js';
import { permissionManager } from '../../lib/permissions.js';

// Store pending permission requests by session
const pendingPermissions = new Map<string, {
  toolName: string;
  input: any;
  resolve: (decision: { approve: boolean; always: boolean }) => void;
}>();

export async function handleAgentQuery(req: Request, res: Response) {
  try {
    const { prompt, sessionId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    console.log(`\n📥 Query received: "${prompt.substring(0, 50)}..."`);

    // Get or create session
    let session = sessionId ? sessionManager.getSession(sessionId) : null;
    if (!session) {
      session = sessionManager.createSession();
      console.log(`📋 New session created: ${session.id}`);
    } else {
      console.log(`📋 Using existing session: ${session.id}`);
    }

    // Set up permission handler that will pause and return permission request
    permissionManager.setPermissionRequestHandler(async (toolName, input) => {
      console.log(`🔐 Permission requested for: ${toolName}`);

      // This will be resolved when user responds via /api/agents/permission endpoint
      return new Promise((resolve) => {
        pendingPermissions.set(session!.id, {
          toolName,
          input,
          resolve
        });
      });
    });

    // Create orchestrator for this session with conversation history
    const orchestrator = new MasterOrchestrator(
      session.id,
      session.conversationHistory
    );

    // Process query through master orchestrator
    const { messages, events, sessionId: capturedSessionId } = await orchestrator.processQuery(prompt);

    console.log('🔍 API received events:', events.length);
    console.log('🔍 Events:', JSON.stringify(events, null, 2));

    // Update session history
    sessionManager.updateHistory(session.id, messages);

    // Extract result from messages
    const resultMessage = messages.find(m => m.type === 'result');
    const result = resultMessage?.result || null;

    // Return response with agent activity
    res.json({
      success: true,
      sessionId: capturedSessionId || session.id,
      result,
      messages: messages.map(msg => ({
        type: msg.type,
        text: msg.text || msg.result,
        name: msg.name,
      })),
      events: events.map(evt => ({
        type: evt.type,
        timestamp: evt.timestamp,
        agentName: evt.agentName,
        toolName: evt.toolName,
        duration_ms: evt.duration_ms,
        cost_usd: evt.cost_usd,
      })),
    });

    console.log(`✅ Query completed successfully\n`);

  } catch (error: any) {
    console.error('❌ Agent query error:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message
    });
  }
}

export function handleAgentStatus(req: Request, res: Response) {
  const { sessionId } = req.query;

  const session = sessionId ? sessionManager.getSession(sessionId as string) : null;

  res.json({
    agents: [
      { id: 'finance', name: 'Finance Agent', status: 'ready' },
      { id: 'research', name: 'Research Agent', status: 'ready' },
      { id: 'notes', name: 'Notes Agent', status: 'ready' },
      { id: 'shopping', name: 'Shopping Agent', status: 'ready' },
    ],
    conversationLength: session?.conversationHistory.length || 0,
    sessionActive: !!session,
    activeSessions: sessionManager.getActiveSessions(),
  });
}

export function handlePermissionResponse(req: Request, res: Response) {
  try {
    const { sessionId, approve, always } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const pending = pendingPermissions.get(sessionId);
    if (!pending) {
      return res.status(404).json({ error: 'No pending permission request' });
    }

    console.log(`🔐 Permission ${approve ? 'approved' : 'denied'} for: ${pending.toolName} (always: ${always})`);

    // Resolve the promise waiting in the permission handler
    pending.resolve({ approve: approve === true, always: always === true });
    pendingPermissions.delete(sessionId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Permission response error:', error);
    res.status(500).json({
      error: 'Failed to process permission response',
      message: error.message
    });
  }
}

export function checkPendingPermission(req: Request, res: Response) {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const pending = pendingPermissions.get(sessionId as string);

    if (pending) {
      res.json({
        hasPending: true,
        toolName: pending.toolName,
        input: pending.input
      });
    } else {
      res.json({ hasPending: false });
    }
  } catch (error: any) {
    console.error('❌ Check permission error:', error);
    res.status(500).json({
      error: 'Failed to check permission',
      message: error.message
    });
  }
}
