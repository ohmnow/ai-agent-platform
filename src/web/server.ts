/**
 * Express Web Server
 *
 * Serves the web interface and API endpoints for the agent platform.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAgentQuery, handleAgentStatus, handlePermissionResponse, checkPendingPermission } from './api/agents.js';
import { handleStreamingQuery, handlePermissionResponse as handleStreamPermissionResponse } from './api/agents-stream.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints
app.post('/api/agents/query', handleAgentQuery); // Legacy non-streaming
app.get('/api/agents/query/stream', handleStreamingQuery); // SSE streaming (primary)
app.get('/api/agents/status', handleAgentStatus);
app.post('/api/agents/permission', handleStreamPermissionResponse); // For streaming
app.post('/api/agents/permission/legacy', handlePermissionResponse); // For non-streaming
app.get('/api/agents/permission/check', checkPendingPermission);

// Serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 AI Agent Platform running!`);
  console.log(`${'='.repeat(50)}`);
  console.log(`\n📍 Landing Page: http://localhost:${PORT}`);
  console.log(`📍 Dashboard:    http://localhost:${PORT}/dashboard.html`);
  console.log(`📍 API Status:   http://localhost:${PORT}/api/agents/status`);
  console.log(`\n✨ Ready to orchestrate agents!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});
