// Core data types for the AI Dashboard application

export interface ChatSession {
  id: string;
  agentId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  messageCount: number;
  lastMessage?: string;
}

export interface FileAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface MessageMetadata {
  processingTime?: number;
  tokenCount?: number;
  modelUsed?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  metadata?: MessageMetadata;
}

export enum MemoryType {
  FACT = 'fact',
  PREFERENCE = 'preference',
  CONTEXT = 'context',
  INSTRUCTION = 'instruction',
  CONVERSATION = 'conversation'
}

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  lastAccessed?: Date;
  source?: string;
  priority: number;
}

export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export enum PermissionLevel {
  NONE = 'none',
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

export interface AgentPermissions {
  memoryAccess: PermissionLevel;
  toolAccess: string[];
  rateLimitRpm: number;
  maxMemorySize: number;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface AgentMetrics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  permissions: AgentPermissions;
  configuration: AgentConfig;
  metrics: AgentMetrics;
  lastSeen?: Date;
}

export enum ParameterType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object'
}

export interface ParameterValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface ToolParameter {
  name: string;
  type: ParameterType;
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ParameterValidation;
}

export interface ToolUsageStats {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: ToolParameter[];
  permissions: string[];
  isActive: boolean;
  usageStats: ToolUsageStats;
  lastUsed?: Date;
}

export enum LogOperation {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SEARCH = 'search',
  EXECUTE = 'execute'
}

export enum LogStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  DENIED = 'denied'
}

export interface LogDetails {
  query?: string;
  resultCount?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface AccessLog {
  id: string;
  timestamp: Date;
  agentId: string;
  operation: LogOperation;
  resource: string;
  resourceId: string;
  responseTime: number;
  status: LogStatus;
  details?: LogDetails;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface SystemMetrics {
  timestamp: Date;
  agents: {
    total: number;
    online: number;
    offline: number;
    error: number;
  };
  memory: {
    totalEntries: number;
    totalSize: number;
    averageAccessTime: number;
    topCategories: CategoryCount[];
  };
  mcp: {
    activeTools: number;
    totalExecutions: number;
    averageExecutionTime: number;
    errorRate: number;
  };
  system: {
    uptime: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  offset?: number;
  limit?: number;
}

// Search and filter types
export interface SearchResult<T> {
  entry: T;
  score: number;
  matches: Array<{
    field: string;
    snippet: string;
  }>;
}

// Event types for Server-Sent Events
export interface SSEEvent {
  type: string;
  data: any;
  id?: string;
  timestamp: Date;
}

// Deletion types for chat history removal feature
export interface DeletionConfirmation {
  sessionId: string | null; // Session being deleted (null for bulk delete)
  type: 'single' | 'bulk'; // Type of deletion operation
  isOpen: boolean; // Confirmation dialog state
  isDeleting: boolean; // Operation in progress state
}

export interface DeletionError {
  type: 'session-not-found' | 'deletion-failed' | 'network-error';
  message: string;
  sessionId?: string;
}