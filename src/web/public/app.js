// Session management - persist session across page loads
let sessionId = localStorage.getItem('sessionId');

// Landing page - template selection
document.querySelectorAll('.template-card')?.forEach(card => {
  card.addEventListener('click', () => {
    const agentType = card.dataset.agent;
    const input = document.getElementById('prompt-input');

    if (agentType === 'finance') {
      input.value = 'Analyze my spending from October 2025. Show me a breakdown by category.';
    } else if (agentType === 'research') {
      input.value = 'Research the latest trends in AI agent orchestration';
    } else if (agentType === 'notes') {
      input.value = 'What notes do I have about Q1 planning meetings?';
    }

    input.focus();
  });
});

// Submit query from landing page
document.getElementById('submit-btn')?.addEventListener('click', async () => {
  const prompt = document.getElementById('prompt-input').value;
  if (!prompt) return;

  // Redirect to dashboard with query
  window.location.href = `/dashboard.html?q=${encodeURIComponent(prompt)}`;
});

// Dashboard - handle initial query from URL parameter
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q');

  if (initialQuery && document.getElementById('chat-input')) {
    // Populate input and auto-submit
    document.getElementById('chat-input').value = initialQuery;
    // Clear URL parameter
    window.history.replaceState({}, '', '/dashboard.html');
    // Trigger send
    setTimeout(() => sendMessage(initialQuery), 500);
  }
});

// Dashboard - send message
document.getElementById('send-btn')?.addEventListener('click', async () => {
  const input = document.getElementById('chat-input');
  const prompt = input.value;
  if (!prompt) return;

  input.value = '';
  sendMessage(prompt);
});

// Handle Enter key in chat input (Shift+Enter for new line)
document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    document.getElementById('send-btn').click();
  }
});

// New session button
document.getElementById('new-session-btn')?.addEventListener('click', () => {
  if (confirm('Start a new session? Current conversation will be cleared.')) {
    localStorage.removeItem('sessionId');
    sessionId = null;
    document.getElementById('chat-messages').innerHTML = '';
    document.getElementById('agent-activity').innerHTML = '';
    document.getElementById('tool-usage').innerHTML = '';
  }
});

async function sendMessage(prompt) {
  addMessage('user', prompt);

  // Show loading indicator
  const loadingId = addMessage('assistant', '🤔 Thinking...');

  try {
    const response = await fetch('/api/agents/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, sessionId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('📥 Received data:', data);
    console.log('📥 Events count:', data.events?.length);
    console.log('📥 Events:', data.events);

    // Remove loading indicator
    removeMessage(loadingId);

    // Store session ID for conversation continuity
    if (data.sessionId) {
      sessionId = data.sessionId;
      localStorage.setItem('sessionId', sessionId);
    }

    // Display messages
    data.messages?.forEach(msg => {
      if (msg.type === 'assistant' && msg.text) {
        addMessage('assistant', msg.text);
      }
    });

    // Display result if present
    if (data.result) {
      addMessage('assistant', data.result);
    }

    // Display agent events in sidebar
    if (data.events && data.events.length > 0) {
      console.log('✅ Processing', data.events.length, 'events...');
      data.events.forEach(evt => {
        console.log('  Event:', evt.type, evt);
        if (evt.type === 'agent_delegation') {
          addAgentActivity(`🤖 Using ${evt.agentName} agent`);
        }
        if (evt.type === 'tool_use') {
          addToolUsage(evt.toolName);
        }
        if (evt.type === 'agent_complete' && evt.duration_ms) {
          addAgentActivity(`✅ Completed in ${evt.duration_ms}ms`);
        }
      });
    } else {
      console.warn('⚠️ No events received');
    }

  } catch (error) {
    console.error('Error:', error);
    removeMessage(loadingId);
    addMessage('error', `Failed to process request: ${error.message}`);
  }
}

function addMessage(type, text) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  const messageId = `msg-${Date.now()}`;
  const messageDiv = document.createElement('div');
  messageDiv.id = messageId;
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return messageId;
}

function removeMessage(messageId) {
  const message = document.getElementById(messageId);
  if (message) {
    message.remove();
  }
}

function addAgentActivity(text) {
  const activityLog = document.getElementById('agent-activity');
  if (!activityLog) return;

  const activityDiv = document.createElement('div');
  activityDiv.textContent = text;
  activityLog.appendChild(activityDiv);

  // Keep only last 10 activities
  while (activityLog.children.length > 10) {
    activityLog.removeChild(activityLog.firstChild);
  }
}

function addToolUsage(toolName) {
  const toolLog = document.getElementById('tool-usage');
  if (!toolLog) return;

  const toolDiv = document.createElement('div');
  toolDiv.textContent = `🔧 ${toolName}`;
  toolLog.appendChild(toolDiv);

  // Keep only last 10 tools
  while (toolLog.children.length > 10) {
    toolLog.removeChild(toolLog.firstChild);
  }
}
