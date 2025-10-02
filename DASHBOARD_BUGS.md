# Dashboard UI Bugs - Fix Required

## Issues Identified

### 1. Sidebar Activity/Tools Not Updating
**Location:** `src/web/public/app-streaming.js`

**Bug:** ID mismatch on line 277
```javascript
// WRONG:
const tools = document.getElementById('tools-used');

// SHOULD BE:
const tools = document.getElementById('tool-usage');
```

**Impact:** Tool usage sidebar never updates during agent operations

### 2. Agent List Items Not Clickable
**Location:** `src/web/public/dashboard.html` lines 17-30

**Current State:** Static list of agents with no click handlers
```html
<div class="agent-status">
  <span class="status-dot ready"></span>
  <span>Finance Agent</span>
</div>
```

**Needed:**
- Click handlers to filter/focus on specific agent
- Active state styling
- Agent-specific conversation history
- Status updates (idle → running → complete)

### 3. Navigation Missing
**Issue:** Left sidebar has no navigation items at all
**Needed:**
- Dashboard / Home
- Agent Settings
- Task History
- API Usage / Costs
- User Profile

## TODO for Claude Code

### High Priority Fixes

1. **Fix Tool Usage ID (QUICK)**
   - Change line 277 in app-streaming.js
   - Test sidebar updates during tool use

2. **Implement Agent Selection (MEDIUM)**
   - Add click handlers to agent list items
   - Show active agent highlighting
   - Filter chat history by agent
   - Update agent status dots based on activity

3. **Add Navigation (MEDIUM)**
   - Create navigation menu in sidebar
   - Implement routing (or multi-page)
   - Create stub pages for:
     - Dashboard (current)
     - Agent Settings
     - Task History
     - Costs
     - Profile

4. **Real-Time Agent Status (COMPLEX)**
   - Track which agent is currently responding
   - Update status dots: ready (green) → running (yellow) → complete (green)
   - Show elapsed time for running agents
   - Display last activity timestamp

5. **Activity Log Updates (MEDIUM)**
   - Hook into SSE events to populate activity log
   - Show: "Finance Agent analyzing transactions..."
   - Show: "Research Agent searching web..."
   - Timestamp each activity

### Implementation Notes

**For Agent Selection:**
```javascript
// app-streaming.js
let selectedAgent = null;

function selectAgent(agentName) {
  selectedAgent = agentName;

  // Highlight selected agent
  document.querySelectorAll('.agent-status').forEach(el => {
    el.classList.remove('active');
  });
  event.currentTarget.classList.add('active');

  // Filter messages if needed
  filterMessagesByAgent(agentName);
}

// dashboard.html
<div class="agent-status" onclick="selectAgent('Finance Agent')">
```

**For Navigation:**
```html
<!-- Add to sidebar -->
<nav class="sidebar-nav">
  <a href="#dashboard" class="nav-item active">
    <span class="nav-icon">📊</span>
    Dashboard
  </a>
  <a href="#agents" class="nav-item">
    <span class="nav-icon">🤖</span>
    Agents
  </a>
  <a href="#history" class="nav-item">
    <span class="nav-icon">📜</span>
    History
  </a>
  <a href="#costs" class="nav-item">
    <span class="nav-icon">💰</span>
    API Costs
  </a>
  <a href="#settings" class="nav-item">
    <span class="nav-icon">⚙️</span>
    Settings
  </a>
</nav>
```

**For Real-Time Status:**
```javascript
// Track agent status
const agentStatus = {
  'Finance Agent': 'idle',
  'Research Agent': 'idle',
  'Notes Agent': 'idle'
};

function updateAgentStatus(agentName, status) {
  agentStatus[agentName] = status;

  const dot = document.querySelector(`.agent-status[data-agent="${agentName}"] .status-dot`);
  dot.className = `status-dot ${status}`;
}

// Hook into SSE messages
eventSource.addEventListener('message', (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'agent_start') {
    updateAgentStatus(data.agentName, 'running');
    addAgentActivity(`${data.agentName} started task`);
  }
});
```

### CSS Needed

```css
/* Active agent */
.agent-status.active {
  background: rgba(255, 255, 255, 0.1);
  border-left: 3px solid #0066CC;
}

/* Status dots */
.status-dot.idle { background: #645F5A; }
.status-dot.ready { background: #1BC47D; }
.status-dot.running { background: #FFAA00; animation: pulse 1.5s infinite; }
.status-dot.error { background: #BF4D43; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Navigation */
.sidebar-nav {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  margin-top: 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  color: #E3DDD4;
  text-decoration: none;
  transition: background 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.1);
  border-left: 3px solid #0066CC;
}

.nav-icon {
  margin-right: 0.75rem;
}
```

### Testing Checklist

- [ ] Tool usage sidebar updates during agent tool use
- [ ] Clicking agent highlights it
- [ ] Agent status dots change during operations
- [ ] Activity log shows real-time updates
- [ ] Navigation items are clickable
- [ ] Active nav item is highlighted
- [ ] Agent filtering works (if implemented)

## Priority

**P0 - Fix Now:**
- Tool usage ID fix (5 min)

**P1 - This Week:**
- Agent selection/highlighting
- Navigation menu
- Real-time status updates

**P2 - Next Week:**
- Agent-filtered history
- Multi-page routing
- Advanced status indicators
