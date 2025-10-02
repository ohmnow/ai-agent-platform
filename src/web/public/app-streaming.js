/**
 * Streaming App JavaScript
 *
 * Handles real-time streaming with SSE, markdown rendering, and in-chat permissions
 */

// Session management
let currentSessionId = localStorage.getItem('sessionId') || null;
let eventSource = null;

// Agent status tracking with timestamps
const agentStatus = {
  'Finance Agent': { status: 'ready', startTime: null, lastActivity: Date.now() },
  'Research Agent': { status: 'ready', startTime: null, lastActivity: Date.now() },
  'Notes Agent': { status: 'ready', startTime: null, lastActivity: Date.now() }
};

// Markdown configuration
if (typeof marked !== 'undefined') {
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
  });
}

// Send message with streaming
async function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();

  if (!message) return;

  // Show user message
  addMessage(message, 'user');
  input.value = '';

  // Detect which agent should handle this
  const activeAgent = detectActiveAgent(message);
  updateAgentStatus(activeAgent, 'running');

  // Create placeholder for assistant response
  const assistantMsgId = 'msg-' + Date.now();
  addMessage('', 'assistant', assistantMsgId);

  // Set up SSE connection
  const url = new URL('/api/agents/query/stream', window.location.origin);
  url.searchParams.set('prompt', message);
  if (currentSessionId) {
    url.searchParams.set('sessionId', currentSessionId);
  }

  eventSource = new EventSource(url);
  let accumulatedText = '';

  // Handle session ID
  eventSource.addEventListener('session', (e) => {
    const data = JSON.parse(e.data);
    currentSessionId = data.sessionId;
    localStorage.setItem('sessionId', currentSessionId);
    console.log('📋 Session ID:', currentSessionId);
  });

  // Handle streaming text
  eventSource.addEventListener('text', (e) => {
    const data = JSON.parse(e.data);
    accumulatedText += data.text;

    // Render markdown in real-time
    const msgElement = document.getElementById(assistantMsgId);
    if (msgElement) {
      if (typeof marked !== 'undefined') {
        msgElement.innerHTML = marked.parse(accumulatedText);
      } else {
        msgElement.textContent = accumulatedText;
      }
    }
  });

  // Enhanced activity tracking for different event types
  eventSource.addEventListener('tool_use', (e) => {
    const data = JSON.parse(e.data);
    const activeAgent = detectActiveAgent(message);
    addAgentActivity(`${activeAgent} using ${data.toolName}`);
    addToolUsage(data.toolName);
  });

  eventSource.addEventListener('thinking', (e) => {
    const activeAgent = detectActiveAgent(message);
    addAgentActivity(`${activeAgent} analyzing request`);
  });

  eventSource.addEventListener('searching', (e) => {
    const data = JSON.parse(e.data);
    const activeAgent = detectActiveAgent(message);
    const query = data.query ? data.query.substring(0, 40) + '...' : '';
    addAgentActivity(`${activeAgent} searching: ${query}`);
  });

  // Additional SSE event listeners for better tracking
  eventSource.addEventListener('tool_start', (e) => {
    const data = JSON.parse(e.data);
    const activeAgent = detectActiveAgent(message);
    addAgentActivity(`${activeAgent} starting ${data.toolName}`);
  });

  eventSource.addEventListener('tool_end', (e) => {
    const data = JSON.parse(e.data);
    const activeAgent = detectActiveAgent(message);
    addAgentActivity(`${activeAgent} finished ${data.toolName}`);
  });

  eventSource.addEventListener('error_occurred', (e) => {
    const data = JSON.parse(e.data);
    const activeAgent = detectActiveAgent(message);
    addAgentActivity(`${activeAgent} error: ${data.error}`);
  });

  // Handle final result
  eventSource.addEventListener('result', (e) => {
    const data = JSON.parse(e.data);
    accumulatedText = data.result;

    // Final render with markdown
    const msgElement = document.getElementById(assistantMsgId);
    if (msgElement) {
      if (typeof marked !== 'undefined') {
        msgElement.innerHTML = marked.parse(accumulatedText);
      } else {
        msgElement.textContent = accumulatedText;
      }
    }
  });

  // Handle permission requests
  eventSource.addEventListener('permission_request', (e) => {
    const data = JSON.parse(e.data);
    console.log('🔐 Permission requested:', data);

    // Show permission request in chat
    addPermissionRequest(data.toolName, data.description, data.input);
  });

  // Handle completion
  eventSource.addEventListener('done', (e) => {
    console.log('✅ Streaming complete');
    eventSource.close();
    eventSource = null;

    // Reset agent status to ready
    const activeAgent = detectActiveAgent(message);
    updateAgentStatus(activeAgent, 'ready');

    // If no text received, show placeholder
    const msgElement = document.getElementById(assistantMsgId);
    if (msgElement && !accumulatedText) {
      msgElement.innerHTML = '<span style="color: #645F5A;">Response completed</span>';
    }
  });

  // Handle errors
  eventSource.addEventListener('error', (e) => {
    console.error('❌ SSE error:', e);

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    // Set agent status to error
    const activeAgent = detectActiveAgent(message);
    updateAgentStatus(activeAgent, 'error');

    const msgElement = document.getElementById(assistantMsgId);
    if (msgElement && !accumulatedText) {
      msgElement.innerHTML = '<span style="color: #BF4D43;">Error processing request. Please try again.</span>';
    }
  });
}

// Add message to chat
function addMessage(text, role, id = null) {
  const messages = document.getElementById('messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;
  if (id) msgDiv.id = id;

  if (role === 'assistant' && typeof marked !== 'undefined') {
    // Render markdown for assistant messages
    msgDiv.innerHTML = marked.parse(text || '...');
  } else {
    msgDiv.textContent = text || '...';
  }

  messages.appendChild(msgDiv);
  messages.scrollTop = messages.scrollHeight;
}

// Add permission request UI
function addPermissionRequest(toolName, description, input) {
  const messages = document.getElementById('messages');
  const permDiv = document.createElement('div');
  permDiv.className = 'message permission-request';
  permDiv.id = 'permission-' + Date.now();

  permDiv.innerHTML = `
    <div class="permission-header">
      <span class="permission-icon">🔐</span>
      <span class="permission-title">Permission Required</span>
    </div>
    <div class="permission-description">${escapeHtml(description)}</div>
    ${formatToolInput(input)}
    <div class="permission-buttons">
      <button class="btn-deny" onclick="respondToPermission(false, false, '${permDiv.id}')">
        Deny
      </button>
      <button class="btn-once" onclick="respondToPermission(true, false, '${permDiv.id}')">
        Approve Once
      </button>
      <button class="btn-always" onclick="respondToPermission(true, true, '${permDiv.id}')">
        Always Approve
      </button>
    </div>
  `;

  messages.appendChild(permDiv);
  messages.scrollTop = messages.scrollHeight;
}

// Respond to permission request
async function respondToPermission(approve, always, permissionId) {
  try {
    // Send permission response
    const response = await fetch('/api/agents/permission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSessionId,
        approve,
        always
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send permission response');
    }

    // Remove permission UI from chat
    const permElement = document.getElementById(permissionId);
    if (permElement) {
      permElement.remove();
    }

    // Show approval status
    const statusMsg = approve
      ? `✅ Permission ${always ? 'always approved' : 'granted'}`
      : '❌ Permission denied';

    addSystemMessage(statusMsg);

  } catch (error) {
    console.error('Error responding to permission:', error);
    addSystemMessage('❌ Failed to send permission response');
  }
}

// Add system message
function addSystemMessage(text) {
  const messages = document.getElementById('messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message system';
  msgDiv.textContent = text;

  messages.appendChild(msgDiv);
  messages.scrollTop = messages.scrollHeight;
}

// Format tool input for display
function formatToolInput(input) {
  if (!input || Object.keys(input).length === 0) return '';

  const entries = Object.entries(input)
    .map(([key, value]) => {
      const displayValue = typeof value === 'string' && value.length > 100
        ? value.substring(0, 100) + '...'
        : value;
      return `<strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(displayValue))}`;
    })
    .join('<br>');

  return `<div class="permission-details">${entries}</div>`;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// New session
function newSession() {
  currentSessionId = null;
  localStorage.removeItem('sessionId');

  // Clear messages
  const messages = document.getElementById('messages');
  messages.innerHTML = '';

  addSystemMessage('🔄 New session started');

  console.log('📋 Session reset');
}

// Add agent activity with timestamp
function addAgentActivity(text) {
  const activity = document.getElementById('agent-activity');
  if (!activity) return;

  const item = document.createElement('div');
  item.className = 'activity-item';

  // Add timestamp
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  item.innerHTML = `<span class="activity-time">${timeStr}</span> ${text}`;

  // Insert at top for most recent first
  activity.insertBefore(item, activity.firstChild);

  // Keep only last 15 items (increased from 10)
  while (activity.children.length > 15) {
    activity.removeChild(activity.lastChild);
  }

  // Auto-scroll to top to show latest activity
  activity.scrollTop = 0;
}

// Add tool usage with timestamp
function addToolUsage(toolName) {
  const tools = document.getElementById('tool-usage');
  if (!tools) return;

  // Check if tool was used recently (within last 30 seconds) to avoid duplicates
  const now = Date.now();
  const existing = Array.from(tools.children).find(el => {
    const toolData = el.dataset.tool;
    const toolTime = parseInt(el.dataset.time) || 0;
    return toolData === toolName && (now - toolTime) < 30000;
  });

  if (existing) return;

  const item = document.createElement('div');
  item.className = 'tool-item';
  item.dataset.tool = toolName;
  item.dataset.time = now.toString();

  // Add timestamp
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  item.innerHTML = `<span class="tool-time">${timeStr}</span> 🔧 ${toolName}`;

  // Insert at top for most recent first
  tools.insertBefore(item, tools.firstChild);

  // Keep only last 12 items
  while (tools.children.length > 12) {
    tools.removeChild(tools.lastChild);
  }

  // Auto-scroll to top to show latest tools
  tools.scrollTop = 0;
}

// Update agent status with timing
function updateAgentStatus(agentName, status) {
  const now = Date.now();
  const agentData = agentStatus[agentName];

  // Update status data
  const previousStatus = agentData.status;
  agentData.status = status;
  agentData.lastActivity = now;

  // Set start time when switching to running
  if (status === 'running' && previousStatus !== 'running') {
    agentData.startTime = now;
  }

  // Clear start time when finishing
  if (status !== 'running') {
    agentData.startTime = null;
  }

  const dot = document.querySelector(`[data-agent="${agentName}"] .status-dot`);
  if (dot) {
    dot.className = `status-dot ${status}`;
  }

  // Log status change with duration if applicable
  if (status !== 'running' && previousStatus === 'running' && agentData.startTime) {
    const duration = Math.round((now - agentData.startTime) / 1000);
    console.log(`🤖 ${agentName} status: ${status} (ran for ${duration}s)`);
  } else {
    console.log(`🤖 ${agentName} status: ${status}`);
  }

  // Add to activity log with better messaging
  const statusMessages = {
    'idle': 'went idle',
    'ready': 'is ready',
    'running': 'started working',
    'error': 'encountered an error'
  };

  if (statusMessages[status]) {
    let message = `${agentName} ${statusMessages[status]}`;

    // Add elapsed time for completion
    if ((status === 'ready' || status === 'idle') && previousStatus === 'running' && agentData.startTime) {
      const duration = Math.round((now - agentData.startTime) / 1000);
      message += ` (${duration}s)`;
    }

    addAgentActivity(message);
  }
}

// Detect agent from message content (simple heuristic)
function detectActiveAgent(messageContent) {
  const content = messageContent.toLowerCase();

  if (content.includes('financ') || content.includes('money') || content.includes('budget') || content.includes('transaction')) {
    return 'Finance Agent';
  } else if (content.includes('research') || content.includes('search') || content.includes('find') || content.includes('web')) {
    return 'Research Agent';
  } else if (content.includes('note') || content.includes('remember') || content.includes('save') || content.includes('document')) {
    return 'Notes Agent';
  }

  // Default to Research Agent for general queries
  return 'Research Agent';
}

// Initialize dashboard
function initializeDashboard() {
  addAgentActivity('Dashboard loaded');
  addAgentActivity('All agents ready');

  // Initialize agent status indicators
  Object.keys(agentStatus).forEach(agent => {
    updateAgentStatus(agent, 'ready');
  });

  // Add elapsed time display updates for running agents
  setInterval(updateRunningAgentTimes, 1000);
}

// Update elapsed time display for running agents
function updateRunningAgentTimes() {
  Object.entries(agentStatus).forEach(([agentName, agentData]) => {
    if (agentData.status === 'running' && agentData.startTime) {
      const elapsed = Math.round((Date.now() - agentData.startTime) / 1000);

      // Find the agent element and update timing display
      const agentEl = document.querySelector(`[data-agent="${agentName}"]`);
      if (agentEl) {
        // Remove any existing time display
        let timeEl = agentEl.querySelector('.elapsed-time');
        if (!timeEl) {
          timeEl = document.createElement('span');
          timeEl.className = 'elapsed-time';
          agentEl.appendChild(timeEl);
        }
        timeEl.textContent = `${elapsed}s`;
      }
    } else {
      // Remove elapsed time display when not running
      const agentEl = document.querySelector(`[data-agent="${agentName}"]`);
      if (agentEl) {
        const timeEl = agentEl.querySelector('.elapsed-time');
        if (timeEl) {
          timeEl.remove();
        }
      }
    }
  });
}

// Handle Enter key
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('user-input');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Initialize dashboard
  setTimeout(initializeDashboard, 100);
});
