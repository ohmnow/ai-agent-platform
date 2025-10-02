/**
 * Session Management
 *
 * Handles session creation, retrieval, and cleanup for agent conversations.
 * Sessions store conversation history and are cleaned up after 1 hour of inactivity.
 */

import { randomUUID } from 'crypto';

export interface Session {
  id: string;
  userId: string;
  conversationHistory: any[];
  createdAt: Date;
  lastActivity: Date;
}

class SessionManager {
  private sessions = new Map<string, Session>();

  createSession(userId: string = 'user-001'): Session {
    const session: Session = {
      id: randomUUID(),
      userId,
      conversationHistory: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.sessions.set(session.id, session);
    console.log(`📋 Created session: ${session.id}`);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  updateHistory(sessionId: string, messages: any[]): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.conversationHistory.push(...messages);
      session.lastActivity = new Date();
    }
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`🗑️  Cleared session: ${sessionId}`);
  }

  // Cleanup old sessions (>1 hour inactive)
  cleanupStale(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.lastActivity < oneHourAgo) {
        this.sessions.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} stale sessions`);
    }
  }

  getActiveSessions(): number {
    return this.sessions.size;
  }
}

export const sessionManager = new SessionManager();

// Run cleanup every 15 minutes
setInterval(() => sessionManager.cleanupStale(), 15 * 60 * 1000);
