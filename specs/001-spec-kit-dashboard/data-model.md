# Data Model: AI Agent Dashboard

**Date**: 2025-09-14
**Feature**: Spec Kit Dashboard

## Core Entities

### ChatSession
Represents a conversation session between user and AI agent.

```typescript
interface ChatSession {
  id: string;                    // Unique identifier (UUID)
  agentId: string;              // Reference to agent
  name: string;                 // Session display name
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last message timestamp
  isActive: boolean;            // Currently active session
  messageCount: number;         // Total messages in session
  lastMessage?: string;         // Preview of last message
}
```

**Validation Rules**:
- `id` must be valid UUID format
- `name` max length 100 characters
- `agentId` must reference existing agent
- `messageCount` must be >= 0

**Storage**: `/data/chat/sessions.json`

### ChatMessage
Individual message within a chat session.

```typescript
interface ChatMessage {
  id: string;                   // Unique identifier (UUID)
  sessionId: string;            // Reference to chat session
  role: 'user' | 'assistant' | 'system'; // Message sender
  content: string;              // Message text content
  timestamp: Date;              // Message timestamp
  attachments?: FileAttachment[]; // Optional file attachments
  metadata?: MessageMetadata;    // Additional message data
}

interface FileAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;                 // Relative path in storage
}

interface MessageMetadata {
  processingTime?: number;      // Response time in ms
  tokenCount?: number;          // Token usage
  modelUsed?: string;           // AI model identifier
}
```

**Validation Rules**:
- `content` max length 50,000 characters
- `role` must be valid enum value
- `attachments` max 10 files per message
- File size limit: 10MB per attachment

**Storage**: `/data/chat/messages/{sessionId}.json`

### MemoryEntry
Persistent memory/context stored by the AI system.

```typescript
interface MemoryEntry {
  id: string;                   // Unique identifier (UUID)
  type: MemoryType;             // Category of memory
  content: string;              // Memory content
  tags: string[];               // Searchable tags
  category: string;             // Hierarchical category
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last modification
  accessCount: number;          // Usage frequency
  lastAccessed?: Date;          // Last access timestamp
  source?: string;              // Origin (e.g., chat session ID)
  priority: number;             // 1-5 importance rating
}

enum MemoryType {
  FACT = 'fact',
  PREFERENCE = 'preference',
  CONTEXT = 'context',
  INSTRUCTION = 'instruction',
  CONVERSATION = 'conversation'
}
```

**Validation Rules**:
- `content` max length 10,000 characters
- `tags` max 20 tags, each max 50 characters
- `category` hierarchical format (e.g., "personal/preferences/ui")
- `priority` range 1-5

**Storage**: `/data/memory/entries.json`

### Agent
Represents an AI agent in the system.

```typescript
interface Agent {
  id: string;                   // Unique identifier
  name: string;                 // Display name
  description: string;          // Agent description
  status: AgentStatus;          // Current operational status
  permissions: AgentPermissions; // Access controls
  configuration: AgentConfig;   // Runtime settings
  metrics: AgentMetrics;        // Performance data
  lastSeen?: Date;              // Last activity timestamp
}

enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

interface AgentPermissions {
  memoryAccess: PermissionLevel;
  toolAccess: string[];         // Array of allowed tool IDs
  rateLimitRpm: number;         // Requests per minute
  maxMemorySize: number;        // Memory usage limit (MB)
}

enum PermissionLevel {
  NONE = 'none',
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

interface AgentConfig {
  model: string;                // AI model identifier
  temperature: number;          // Creativity setting (0-1)
  maxTokens: number;            // Response length limit
  systemPrompt?: string;        // Base instructions
}

interface AgentMetrics {
  totalRequests: number;
  averageResponseTime: number;  // In milliseconds
  errorRate: number;            // 0-1 percentage
  uptime: number;               // Percentage uptime
}
```

**Storage**: `/data/agents/agents.json`

### MCPTool
Model Context Protocol tools available to agents.

```typescript
interface MCPTool {
  id: string;                   // Unique identifier
  name: string;                 // Tool name
  description: string;          // Tool purpose
  category: string;             // Tool category
  parameters: ToolParameter[];  // Input schema
  permissions: string[];        // Required permissions
  isActive: boolean;            // Currently enabled
  usageStats: ToolUsageStats;   // Usage metrics
  lastUsed?: Date;              // Last execution time
}

interface ToolParameter {
  name: string;
  type: ParameterType;
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ParameterValidation;
}

enum ParameterType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object'
}

interface ParameterValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;             // Regex pattern
  min?: number;                 // For numbers
  max?: number;                 // For numbers
}

interface ToolUsageStats {
  totalExecutions: number;
  successRate: number;          // 0-1 percentage
  averageExecutionTime: number; // In milliseconds
}
```

**Storage**: `/data/mcp/tools.json`

### AccessLog
Records of agent-memory interactions for monitoring.

```typescript
interface AccessLog {
  id: string;                   // Unique identifier (UUID)
  timestamp: Date;              // When interaction occurred
  agentId: string;              // Which agent
  operation: LogOperation;      // What was done
  resource: string;             // What was accessed
  resourceId: string;           // Specific item ID
  responseTime: number;         // Operation duration (ms)
  status: LogStatus;            // Success/failure
  details?: LogDetails;         // Additional context
}

enum LogOperation {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SEARCH = 'search',
  EXECUTE = 'execute'
}

enum LogStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  DENIED = 'denied'
}

interface LogDetails {
  query?: string;               // Search query or operation details
  resultCount?: number;         // Number of results returned
  errorMessage?: string;        // Error description if failed
  metadata?: Record<string, any>; // Additional operation data
}
```

**Storage**: `/data/logs/access-{YYYY-MM-DD}.json` (daily rotation)

### SystemMetrics
Real-time system health and performance data.

```typescript
interface SystemMetrics {
  timestamp: Date;              // Measurement time
  agents: {
    total: number;
    online: number;
    offline: number;
    error: number;
  };
  memory: {
    totalEntries: number;
    totalSize: number;          // In bytes
    averageAccessTime: number;  // In milliseconds
    topCategories: CategoryCount[];
  };
  mcp: {
    activeTools: number;
    totalExecutions: number;
    averageExecutionTime: number;
    errorRate: number;
  };
  system: {
    uptime: number;             // In milliseconds
    memoryUsage: number;        // In MB
    diskUsage: number;          // In MB
  };
}

interface CategoryCount {
  category: string;
  count: number;
}
```

**Storage**: In-memory only, not persisted (real-time calculation)

## Entity Relationships

```
ChatSession (1) ←→ (n) ChatMessage
Agent (1) ←→ (n) ChatSession
Agent (1) ←→ (n) AccessLog
MemoryEntry (1) ←→ (n) AccessLog
MCPTool (1) ←→ (n) AccessLog
Agent (1) ←→ (n) MemoryEntry (via source)
```

## File Storage Structure

```
data/
├── chat/
│   ├── sessions.json
│   └── messages/
│       ├── {sessionId}.json
│       └── attachments/
│           └── {messageId}/
│               └── {filename}
├── memory/
│   └── entries.json
├── agents/
│   └── agents.json
├── mcp/
│   └── tools.json
└── logs/
    ├── access-2025-09-14.json
    └── access-2025-09-15.json
```

## State Transitions

### Agent Status Flow
```
OFFLINE → ONLINE → ERROR → MAINTENANCE → ONLINE
         ↓        ↓
         ↓        OFFLINE
         OFFLINE
```

### Memory Entry Lifecycle
```
Created → Active → Archived
                ↑
                Updated
```

### Chat Session Flow
```
Created → Active → Inactive → Archived
         ↑                   ↑
         Reactivated ←────────┘
```