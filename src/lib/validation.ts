import { z } from 'zod';
import { MemoryType, AgentStatus, PermissionLevel, ParameterType, LogOperation, LogStatus } from './types';

// Chat validation schemas
export const chatSessionSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().min(1),
  name: z.string().max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean(),
  messageCount: z.number().min(0),
  lastMessage: z.string().optional(),
});

export const createChatSessionSchema = z.object({
  agentId: z.string().min(1),
  name: z.string().max(100),
});

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(50000),
  timestamp: z.date(),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    mimeType: z.string(),
    size: z.number(),
    path: z.string(),
  })).optional(),
  metadata: z.object({
    processingTime: z.number().optional(),
    tokenCount: z.number().optional(),
    modelUsed: z.string().optional(),
  }).optional(),
});

export const createChatMessageSchema = z.object({
  sessionId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(50000),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    mimeType: z.string(),
    size: z.number(),
    path: z.string(),
  })).optional(),
});

// Memory validation schemas
export const memoryEntrySchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(MemoryType),
  content: z.string().max(10000),
  tags: z.array(z.string().max(50)).max(20),
  category: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  accessCount: z.number().min(0),
  lastAccessed: z.date().optional(),
  source: z.string().optional(),
  priority: z.number().min(1).max(5),
});

export const createMemoryEntrySchema = z.object({
  type: z.nativeEnum(MemoryType),
  content: z.string().max(10000),
  tags: z.array(z.string().max(50)).max(20).default([]),
  category: z.string(),
  priority: z.number().min(1).max(5).default(3),
  source: z.string().optional(),
});

export const updateMemoryEntrySchema = z.object({
  content: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  category: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
});

export const memorySearchSchema = z.object({
  query: z.string().min(1).max(500),
  category: z.string().optional(),
  type: z.nativeEnum(MemoryType).optional(),
  minPriority: z.number().min(1).max(5).optional(),
  limit: z.number().min(1).max(100).default(20),
});

// Agent validation schemas
export const agentConfigSchema = z.object({
  model: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(1).max(100000),
  systemPrompt: z.string().max(10000).optional(),
});

export const agentPermissionsSchema = z.object({
  memoryAccess: z.nativeEnum(PermissionLevel),
  toolAccess: z.array(z.string()),
  rateLimitRpm: z.number().min(1).max(10000),
  maxMemorySize: z.number().min(1).max(10000),
});

export const agentMetricsSchema = z.object({
  totalRequests: z.number().min(0),
  averageResponseTime: z.number().min(0),
  errorRate: z.number().min(0).max(1),
  uptime: z.number().min(0).max(100),
});

export const agentSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  description: z.string().max(500),
  status: z.nativeEnum(AgentStatus),
  permissions: agentPermissionsSchema,
  configuration: agentConfigSchema,
  metrics: agentMetricsSchema,
  lastSeen: z.date().optional(),
});

export const createAgentSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(500),
  configuration: agentConfigSchema,
  permissions: agentPermissionsSchema.optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(AgentStatus).optional(),
  configuration: agentConfigSchema.optional(),
  permissions: agentPermissionsSchema.optional(),
});

// MCP Tool validation schemas
export const toolParameterSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(ParameterType),
  required: z.boolean(),
  description: z.string(),
  defaultValue: z.any().optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
});

export const toolUsageStatsSchema = z.object({
  totalExecutions: z.number().min(0),
  successRate: z.number().min(0).max(1),
  averageExecutionTime: z.number().min(0),
});

export const mcpToolSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  description: z.string().max(500),
  category: z.string(),
  parameters: z.array(toolParameterSchema),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
  usageStats: toolUsageStatsSchema,
  lastUsed: z.date().optional(),
});

export const createMCPToolSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(500),
  category: z.string(),
  parameters: z.array(toolParameterSchema),
  permissions: z.array(z.string()).default([]),
});

export const executeMCPToolSchema = z.object({
  toolId: z.string(),
  agentId: z.string(),
  parameters: z.record(z.any()),
  timeout: z.number().min(1).max(300).default(30),
});

// Access log validation schemas
export const accessLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.date(),
  agentId: z.string(),
  operation: z.nativeEnum(LogOperation),
  resource: z.string(),
  resourceId: z.string(),
  responseTime: z.number().min(0),
  status: z.nativeEnum(LogStatus),
  details: z.object({
    query: z.string().optional(),
    resultCount: z.number().optional(),
    errorMessage: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
});

// System metrics validation schema
export const systemMetricsSchema = z.object({
  timestamp: z.date(),
  agents: z.object({
    total: z.number().min(0),
    online: z.number().min(0),
    offline: z.number().min(0),
    error: z.number().min(0),
  }),
  memory: z.object({
    totalEntries: z.number().min(0),
    totalSize: z.number().min(0),
    averageAccessTime: z.number().min(0),
    topCategories: z.array(z.object({
      category: z.string(),
      count: z.number().min(0),
    })),
  }),
  mcp: z.object({
    activeTools: z.number().min(0),
    totalExecutions: z.number().min(0),
    averageExecutionTime: z.number().min(0),
    errorRate: z.number().min(0).max(1),
  }),
  system: z.object({
    uptime: z.number().min(0),
    memoryUsage: z.number().min(0),
    diskUsage: z.number().min(0),
  }),
});

// Generic pagination schema
export const paginationSchema = z.object({
  limit: z.number().min(1).max(200).default(50),
  offset: z.number().min(0).default(0),
});

// UUID validation helper
export const validateUUID = (id: string): boolean => {
  return z.string().uuid().safeParse(id).success;
};

// Common query parameter schemas
export const timestampFilterSchema = z.object({
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
});

export const sortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Validation helper functions
export function validateAndTransform<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

export function validatePartial<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: Partial<T> } | { success: false; error: string } {
  try {
    const result = schema.partial().parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}