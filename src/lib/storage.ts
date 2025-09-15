import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  ChatSession,
  ChatMessage,
  MemoryEntry,
  Agent,
  MCPTool,
  AccessLog,
  ApiResponse,
  PaginatedResponse,
} from './types';

// Storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const CHAT_SESSIONS_FILE = path.join(DATA_DIR, 'chat', 'sessions.json');
const MEMORY_ENTRIES_FILE = path.join(DATA_DIR, 'memory', 'entries.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents', 'agents.json');
const MCP_TOOLS_FILE = path.join(DATA_DIR, 'mcp', 'tools.json');

// Helper function to ensure directory exists
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Helper function to read JSON file safely
async function readJsonFile<T>(filePath: string, defaultValue: T[] = []): Promise<T[]> {
  try {
    await ensureDir(path.dirname(filePath));
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data, (_, value) => {
      // Convert date strings back to Date objects
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value);
      }
      return value;
    });
  } catch (error) {
    console.warn(`Could not read file ${filePath}, returning default:`, error);
    return defaultValue as T[];
  }
}

// Helper function to write JSON file safely
async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  try {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw new Error(`Failed to write data to ${filePath}`);
  }
}

// Helper function to get message file path
function getMessageFilePath(sessionId: string): string {
  return path.join(DATA_DIR, 'chat', 'messages', `${sessionId}.json`);
}

// Helper function to get access log file path (daily rotation)
function getAccessLogFilePath(date?: Date): string {
  const logDate = date || new Date();
  const dateStr = logDate.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(DATA_DIR, 'logs', `access-${dateStr}.json`);
}

// Chat Session Storage
export class ChatSessionStorage {
  static async getAll(): Promise<ChatSession[]> {
    return readJsonFile<ChatSession>(CHAT_SESSIONS_FILE);
  }

  static async getById(id: string): Promise<ChatSession | null> {
    const sessions = await this.getAll();
    return sessions.find(session => session.id === id) || null;
  }

  static async create(sessionData: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt' | 'messageCount'>): Promise<ChatSession> {
    const sessions = await this.getAll();
    const newSession: ChatSession = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      ...sessionData,
    };

    sessions.push(newSession);
    await writeJsonFile(CHAT_SESSIONS_FILE, sessions);
    return newSession;
  }

  static async update(id: string, updates: Partial<ChatSession>): Promise<ChatSession | null> {
    const sessions = await this.getAll();
    const index = sessions.findIndex(session => session.id === id);

    if (index === -1) return null;

    sessions[index] = {
      ...sessions[index],
      ...updates,
      updatedAt: new Date(),
    };

    await writeJsonFile(CHAT_SESSIONS_FILE, sessions);
    return sessions[index];
  }

  static async delete(id: string): Promise<boolean> {
    const sessions = await this.getAll();
    const filteredSessions = sessions.filter(session => session.id !== id);

    if (filteredSessions.length === sessions.length) return false;

    await writeJsonFile(CHAT_SESSIONS_FILE, filteredSessions);

    // Also delete associated messages
    try {
      const messageFile = getMessageFilePath(id);
      await fs.unlink(messageFile);
    } catch {
      // Message file might not exist
    }

    return true;
  }

  static async deleteAll(): Promise<number> {
    const sessions = await this.getAll();
    const sessionCount = sessions.length;

    if (sessionCount === 0) return 0;

    // Clear the sessions file
    await writeJsonFile(CHAT_SESSIONS_FILE, []);

    // Delete all message files
    let deletedMessageFiles = 0;
    for (const session of sessions) {
      try {
        const messageFile = getMessageFilePath(session.id);
        await fs.unlink(messageFile);
        deletedMessageFiles++;
      } catch {
        // Message file might not exist, continue
      }
    }

    return sessionCount;
  }

  static async getPaginated(limit: number = 50, offset: number = 0, agentId?: string): Promise<PaginatedResponse<ChatSession>> {
    let sessions = await this.getAll();

    if (agentId) {
      sessions = sessions.filter(session => session.agentId === agentId);
    }

    // Sort by updatedAt descending
    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = sessions.length;
    const items = sessions.slice(offset, offset + limit);

    return {
      items,
      total,
      hasMore: offset + limit < total,
      offset,
      limit,
    };
  }
}

// Chat Message Storage
export class ChatMessageStorage {
  static async getBySession(sessionId: string, limit: number = 50, before?: Date): Promise<ChatMessage[]> {
    const messageFile = getMessageFilePath(sessionId);
    let messages = await readJsonFile<ChatMessage>(messageFile);

    if (before) {
      messages = messages.filter(msg => new Date(msg.timestamp) < before);
    }

    // Sort by timestamp descending
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return messages.slice(0, limit);
  }

  static async create(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const messageFile = getMessageFilePath(messageData.sessionId);
    const messages = await readJsonFile<ChatMessage>(messageFile);

    const newMessage: ChatMessage = {
      id: uuidv4(),
      timestamp: new Date(),
      ...messageData,
    };

    messages.push(newMessage);
    await writeJsonFile(messageFile, messages);

    // Update session message count and last message
    const session = await ChatSessionStorage.getById(messageData.sessionId);
    if (session) {
      await ChatSessionStorage.update(messageData.sessionId, {
        messageCount: session.messageCount + 1,
        lastMessage: messageData.content.substring(0, 100),
      });
    }

    return newMessage;
  }
}

// Memory Entry Storage
export class MemoryEntryStorage {
  static async getAll(): Promise<MemoryEntry[]> {
    return readJsonFile<MemoryEntry>(MEMORY_ENTRIES_FILE);
  }

  static async getById(id: string): Promise<MemoryEntry | null> {
    const entries = await this.getAll();
    const entry = entries.find(entry => entry.id === id);

    if (entry) {
      // Update access count and last accessed
      entry.accessCount += 1;
      entry.lastAccessed = new Date();
      await this.update(id, { accessCount: entry.accessCount, lastAccessed: entry.lastAccessed });
    }

    return entry || null;
  }

  static async create(entryData: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<MemoryEntry> {
    const entries = await this.getAll();
    const newEntry: MemoryEntry = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
      ...entryData,
    };

    entries.push(newEntry);
    await writeJsonFile(MEMORY_ENTRIES_FILE, entries);
    return newEntry;
  }

  static async update(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null> {
    const entries = await this.getAll();
    const index = entries.findIndex(entry => entry.id === id);

    if (index === -1) return null;

    entries[index] = {
      ...entries[index],
      ...updates,
      updatedAt: new Date(),
    };

    await writeJsonFile(MEMORY_ENTRIES_FILE, entries);
    return entries[index];
  }

  static async delete(id: string): Promise<boolean> {
    const entries = await this.getAll();
    const filteredEntries = entries.filter(entry => entry.id !== id);

    if (filteredEntries.length === entries.length) return false;

    await writeJsonFile(MEMORY_ENTRIES_FILE, filteredEntries);
    return true;
  }

  static async search(query: string, options?: { category?: string; type?: string; limit?: number }): Promise<MemoryEntry[]> {
    const entries = await this.getAll();
    const limit = options?.limit || 20;

    let filteredEntries = entries;

    // Filter by category
    if (options?.category) {
      filteredEntries = filteredEntries.filter(entry => entry.category.includes(options.category!));
    }

    // Filter by type
    if (options?.type) {
      filteredEntries = filteredEntries.filter(entry => entry.type === options.type);
    }

    // Simple text search in content and tags
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const searchResults = filteredEntries.filter(entry => {
      const searchText = `${entry.content} ${entry.tags.join(' ')} ${entry.category}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    });

    // Sort by relevance (simple approach: count of matching terms)
    searchResults.sort((a, b) => {
      const aText = `${a.content} ${a.tags.join(' ')} ${a.category}`.toLowerCase();
      const bText = `${b.content} ${b.tags.join(' ')} ${b.category}`.toLowerCase();

      const aMatches = searchTerms.reduce((count, term) => count + (aText.includes(term) ? 1 : 0), 0);
      const bMatches = searchTerms.reduce((count, term) => count + (bText.includes(term) ? 1 : 0), 0);

      return bMatches - aMatches;
    });

    return searchResults.slice(0, limit);
  }

  static async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    categoryBreakdown: Array<{ category: string; count: number }>;
    typeBreakdown: Array<{ type: string; count: number }>;
    averageAccessCount: number;
  }> {
    const entries = await this.getAll();

    const totalEntries = entries.length;
    const totalSize = entries.reduce((sum, entry) => sum + entry.content.length, 0);
    const averageAccessCount = entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length
      : 0;

    // Category breakdown
    const categoryMap = new Map<string, number>();
    const typeMap = new Map<string, number>();

    entries.forEach(entry => {
      categoryMap.set(entry.category, (categoryMap.get(entry.category) || 0) + 1);
      typeMap.set(entry.type, (typeMap.get(entry.type) || 0) + 1);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));
    const typeBreakdown = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

    return {
      totalEntries,
      totalSize,
      categoryBreakdown,
      typeBreakdown,
      averageAccessCount,
    };
  }
}

// Agent Storage
export class AgentStorage {
  static async getAll(): Promise<Agent[]> {
    return readJsonFile<Agent>(AGENTS_FILE);
  }

  static async getById(id: string): Promise<Agent | null> {
    const agents = await this.getAll();
    const agent = agents.find(agent => agent.id === id);

    if (agent) {
      // Update last seen
      await this.update(id, { lastSeen: new Date() });
    }

    return agent || null;
  }

  static async create(agentData: Omit<Agent, 'id' | 'metrics' | 'lastSeen'>): Promise<Agent> {
    const agents = await this.getAll();
    const newAgent: Agent = {
      id: uuidv4(),
      metrics: {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 100,
      },
      lastSeen: new Date(),
      ...agentData,
    };

    agents.push(newAgent);
    await writeJsonFile(AGENTS_FILE, agents);
    return newAgent;
  }

  static async update(id: string, updates: Partial<Agent>): Promise<Agent | null> {
    const agents = await this.getAll();
    const index = agents.findIndex(agent => agent.id === id);

    if (index === -1) return null;

    agents[index] = {
      ...agents[index],
      ...updates,
    };

    await writeJsonFile(AGENTS_FILE, agents);
    return agents[index];
  }

  static async delete(id: string): Promise<boolean> {
    const agents = await this.getAll();
    const filteredAgents = agents.filter(agent => agent.id !== id);

    if (filteredAgents.length === agents.length) return false;

    await writeJsonFile(AGENTS_FILE, filteredAgents);
    return true;
  }
}

// MCP Tool Storage
export class MCPToolStorage {
  static async getAll(): Promise<MCPTool[]> {
    return readJsonFile<MCPTool>(MCP_TOOLS_FILE);
  }

  static async getById(id: string): Promise<MCPTool | null> {
    const tools = await this.getAll();
    return tools.find(tool => tool.id === id) || null;
  }

  static async create(toolData: Omit<MCPTool, 'id' | 'usageStats' | 'lastUsed'>): Promise<MCPTool> {
    const tools = await this.getAll();
    const newTool: MCPTool = {
      id: uuidv4(),
      usageStats: {
        totalExecutions: 0,
        successRate: 1,
        averageExecutionTime: 0,
      },
      ...toolData,
    };

    tools.push(newTool);
    await writeJsonFile(MCP_TOOLS_FILE, tools);
    return newTool;
  }

  static async update(id: string, updates: Partial<MCPTool>): Promise<MCPTool | null> {
    const tools = await this.getAll();
    const index = tools.findIndex(tool => tool.id === id);

    if (index === -1) return null;

    tools[index] = {
      ...tools[index],
      ...updates,
    };

    await writeJsonFile(MCP_TOOLS_FILE, tools);
    return tools[index];
  }

  static async delete(id: string): Promise<boolean> {
    const tools = await this.getAll();
    const filteredTools = tools.filter(tool => tool.id !== id);

    if (filteredTools.length === tools.length) return false;

    await writeJsonFile(MCP_TOOLS_FILE, filteredTools);
    return true;
  }

  static async recordExecution(id: string, executionTime: number, success: boolean): Promise<void> {
    const tool = await this.getById(id);
    if (!tool) return;

    const newTotalExecutions = tool.usageStats.totalExecutions + 1;
    const newAverageTime = (tool.usageStats.averageExecutionTime * tool.usageStats.totalExecutions + executionTime) / newTotalExecutions;
    const successCount = Math.round(tool.usageStats.successRate * tool.usageStats.totalExecutions) + (success ? 1 : 0);
    const newSuccessRate = successCount / newTotalExecutions;

    await this.update(id, {
      usageStats: {
        totalExecutions: newTotalExecutions,
        averageExecutionTime: newAverageTime,
        successRate: newSuccessRate,
      },
      lastUsed: new Date(),
    });
  }
}

// Access Log Storage
export class AccessLogStorage {
  static async create(logData: Omit<AccessLog, 'id' | 'timestamp'>): Promise<AccessLog> {
    const logFile = getAccessLogFilePath();
    const logs = await readJsonFile<AccessLog>(logFile);

    const newLog: AccessLog = {
      id: uuidv4(),
      timestamp: new Date(),
      ...logData,
    };

    logs.push(newLog);
    await writeJsonFile(logFile, logs);
    return newLog;
  }

  static async getByAgent(agentId: string, limit: number = 100, since?: Date): Promise<AccessLog[]> {
    // For simplicity, we'll check today's log file
    // In a production system, you'd want to check multiple files
    const logFile = getAccessLogFilePath();
    let logs = await readJsonFile<AccessLog>(logFile);

    logs = logs.filter(log => log.agentId === agentId);

    if (since) {
      logs = logs.filter(log => new Date(log.timestamp) >= since);
    }

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return logs.slice(0, limit);
  }
}

// Utility functions
export function createApiResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function createApiError(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message,
  };
}