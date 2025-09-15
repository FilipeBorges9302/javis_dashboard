# Quickstart Guide: AI Agent Dashboard

**Date**: 2025-09-14
**Feature**: Spec Kit Dashboard
**Purpose**: Validate implementation against acceptance criteria

## Prerequisites

- Node.js 18+ installed
- TypeScript knowledge
- Basic understanding of Next.js and React
- Access to AI agent microservices (for integration testing)

## Development Setup

### 1. Project Initialization
```bash
# Clone or navigate to project directory
cd /path/to/dashboard

# Install dependencies
npm install

# Verify TypeScript compilation
npm run type-check

# Start development server
npm run dev
```

Expected result: Dashboard accessible at `http://localhost:3000`

### 2. Data Directory Setup
```bash
# Create data storage directories
mkdir -p data/{chat/{messages,attachments},memory,agents,mcp,logs}

# Initialize empty data files
echo '[]' > data/chat/sessions.json
echo '[]' > data/memory/entries.json
echo '[]' > data/agents/agents.json
echo '[]' > data/mcp/tools.json
```

Expected result: File-based storage structure ready for development

### 3. Environment Configuration
```bash
# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NODE_ENV=development
EOF
```

Expected result: Local environment configured for development

## Core Feature Validation

### Test Scenario 1: Dashboard Overview (FR-001)
**Given**: Fresh dashboard installation
**When**: Navigate to main dashboard (`/`)
**Then**: Should display:
- Active agent count (initially 0)
- Memory database size (initially 0 entries)
- System health indicators (all green)
- Recent activity feed (empty state)

**Validation Steps**:
```bash
# Start the application
npm run dev

# Navigate to http://localhost:3000
# Verify dashboard elements are present
# Check system metrics API endpoint
curl http://localhost:3000/api/agents/system-metrics
```

**Expected API Response**:
```json
{
  "timestamp": "2025-09-14T...",
  "agents": {"total": 0, "online": 0, "offline": 0, "error": 0},
  "memory": {"totalEntries": 0, "totalSize": 0, "averageAccessTime": 0},
  "mcp": {"activeTools": 0, "totalExecutions": 0},
  "system": {"uptime": 0, "memoryUsage": 0, "diskUsage": 0}
}
```

### Test Scenario 2: Chat Interface (FR-002, FR-003, FR-004)
**Given**: Dashboard is loaded
**When**: Navigate to chat page (`/chat`)
**Then**: Should display:
- Agent selector sidebar (empty state)
- Chat interface placeholder
- File upload capability
- Message history area

**Validation Steps**:
```bash
# Test chat sessions API
curl -X POST http://localhost:3000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test-agent","name":"Test Session"}'

# Test message creation
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session-id","role":"user","content":"Hello"}'
```

### Test Scenario 3: Memory Hub (FR-006, FR-007, FR-008)
**Given**: Dashboard is running
**When**: Navigate to memory page (`/memory`)
**Then**: Should display:
- Memory entries list (empty state)
- Search functionality
- Add/Edit/Delete buttons
- Category organization
- Memory statistics

**Validation Steps**:
```bash
# Create test memory entry
curl -X POST http://localhost:3000/api/memory/entries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fact",
    "content": "Test memory entry",
    "category": "test/category",
    "tags": ["test", "validation"],
    "priority": 3
  }'

# Test search functionality
curl "http://localhost:3000/api/memory/search?query=test"

# Get memory statistics
curl http://localhost:3000/api/memory/stats
```

### Test Scenario 4: MCP Integration (FR-009, FR-010, FR-011)
**Given**: Dashboard is operational
**When**: Navigate to MCP page (`/mcp`)
**Then**: Should display:
- MCP server status
- Available tools list
- Execution logs with filtering
- Real-time activity monitoring

**Validation Steps**:
```bash
# Register test MCP tool
curl -X POST http://localhost:3000/api/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-tool",
    "description": "Test MCP tool",
    "category": "testing",
    "parameters": [
      {
        "name": "input",
        "type": "string",
        "required": true,
        "description": "Test input parameter"
      }
    ]
  }'

# Test tool execution
curl -X POST http://localhost:3000/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "toolId": "test-tool-id",
    "agentId": "test-agent",
    "parameters": {"input": "test value"}
  }'
```

### Test Scenario 5: Agent Management (FR-012, FR-013, FR-014)
**Given**: Dashboard is running
**When**: Navigate to agents page (`/agents`)
**Then**: Should display:
- Agent list with status indicators
- Configuration options for each agent
- Performance metrics
- Permission settings

**Validation Steps**:
```bash
# Register test agent
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "description": "Agent for validation testing",
    "configuration": {
      "model": "test-model",
      "temperature": 0.7,
      "maxTokens": 2000
    },
    "permissions": {
      "memoryAccess": "read",
      "toolAccess": ["test-tool"],
      "rateLimitRpm": 60,
      "maxMemorySize": 100
    }
  }'

# Get agent metrics
curl http://localhost:3000/api/agents/{agentId}/metrics
```

## Real-time Features Validation

### Server-Sent Events Testing
```bash
# Test chat event stream
curl -N http://localhost:3000/api/chat/stream

# Test MCP event stream
curl -N http://localhost:3000/api/mcp/stream
```

Expected: Event stream connection established with proper headers

## Error Handling Validation (FR-019)

### API Connection Failures
```bash
# Test with invalid agent ID
curl -X GET http://localhost:3000/api/agents/invalid-id

# Test with malformed data
curl -X POST http://localhost:3000/api/memory/entries \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

Expected: Proper error responses with clear messages and retry options

### File System Errors
```bash
# Test with read-only data directory
chmod 444 data/memory/entries.json
# Attempt to create memory entry - should show graceful error

# Restore permissions
chmod 644 data/memory/entries.json
```

## Performance Validation (FR-020)

### Page Load Testing
```bash
# Install lighthouse CLI
npm install -g lighthouse

# Test page load performance
lighthouse http://localhost:3000 --only-categories=performance
```

Expected: Performance score >90, page load <2s

### Interaction Responsiveness
```bash
# Test API response times
time curl http://localhost:3000/api/memory/entries
time curl http://localhost:3000/api/agents
time curl http://localhost:3000/api/mcp/tools
```

Expected: All API calls <200ms

## UI/UX Validation (FR-017, FR-018)

### Responsive Design Testing
```bash
# Test with different viewport sizes
# Use browser dev tools to simulate:
# - Desktop (1920x1080)
# - Laptop (1366x768)
# - Tablet landscape (1024x768)
```

Expected: Clean layout at all supported screen sizes

### Dark Mode Testing
```bash
# Toggle dark mode in browser
# Verify all components adapt properly
# Test persistence across page reloads
```

Expected: Consistent dark theme across all pages with browser preference storage

## Integration Testing

### End-to-End Workflow
```bash
# 1. Start fresh dashboard
npm run dev

# 2. Create agent
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"E2E Agent","description":"End-to-end test agent","configuration":{"model":"test","temperature":0.5,"maxTokens":1000},"permissions":{"memoryAccess":"write","toolAccess":[],"rateLimitRpm":30,"maxMemorySize":50}}'

# 3. Create chat session
curl -X POST http://localhost:3000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"agentId":"e2e-agent-id","name":"E2E Test Session"}'

# 4. Send message
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session-id","role":"user","content":"Test message"}'

# 5. Create memory from conversation
curl -X POST http://localhost:3000/api/memory/entries \
  -H "Content-Type: application/json" \
  -d '{"type":"conversation","content":"User said: Test message","category":"chat/e2e","tags":["test","e2e"],"source":"session-id","priority":2}'

# 6. Verify data persistence
curl http://localhost:3000/api/memory/search?query=e2e
```

Expected: Complete workflow successful with data properly stored and retrievable

## Cleanup

```bash
# Stop development server
# Ctrl+C or kill process

# Clean test data
rm -rf data/
mkdir -p data/{chat/{messages,attachments},memory,agents,mcp,logs}
echo '[]' > data/chat/sessions.json
echo '[]' > data/memory/entries.json
echo '[]' > data/agents/agents.json
echo '[]' > data/mcp/tools.json
```

## Success Criteria

✅ **All API endpoints respond correctly**
✅ **UI components render without errors**
✅ **Real-time features establish connections**
✅ **Error handling shows user-friendly messages**
✅ **Performance meets <2s page load requirement**
✅ **Responsive design works on desktop/laptop**
✅ **Dark mode functions properly**
✅ **File-based storage operates correctly**
✅ **End-to-end workflow completes successfully**

## Troubleshooting

### Common Issues

**Port 3000 already in use**:
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9
# Or use different port
npm run dev -- -p 3001
```

**File permissions errors**:
```bash
# Fix data directory permissions
chmod -R 755 data/
```

**TypeScript compilation errors**:
```bash
# Clear Next.js cache
rm -rf .next/
npm run build
```

**API 404 errors**:
```bash
# Verify API routes exist in app/api/ directory
# Check Next.js routing configuration
```

This quickstart guide validates all functional requirements and ensures the dashboard works correctly for personal development use.