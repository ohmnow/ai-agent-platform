/**
 * Streaming App JavaScript
 *
 * Handles real-time streaming with SSE, markdown rendering, and in-chat permissions
 */

// Session management
let currentSessionId = localStorage.getItem('sessionId') || null;
let eventSource = null;

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

// Add agent activity
function addAgentActivity(text) {
  const activity = document.getElementById('agent-activity');
  if (!activity) return;

  const item = document.createElement('div');
  item.className = 'activity-item';
  item.textContent = text;

  activity.appendChild(item);

  // Keep only last 10 items
  while (activity.children.length > 10) {
    activity.removeChild(activity.firstChild);
  }
}

// Add tool usage
function addToolUsage(toolName) {
  const tools = document.getElementById('tools-used');
  if (!tools) return;

  // Check if tool already exists
  const existing = Array.from(tools.children).find(el => el.textContent.includes(toolName));
  if (existing) return;

  const item = document.createElement('div');
  item.className = 'tool-item';
  item.textContent = `🔧 ${toolName}`;

  tools.appendChild(item);

  // Keep only last 10 items
  while (tools.children.length > 10) {
    tools.removeChild(tools.firstChild);
  }
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
});
