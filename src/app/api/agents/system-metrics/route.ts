import { NextRequest, NextResponse } from 'next/server';
import { AgentStorage, MemoryEntryStorage, MCPToolStorage, createApiResponse } from '@/lib/storage';
import { handleApiError } from '@/lib/errors';
import { AgentStatus } from '@/lib/types';

// GET /api/agents/system-metrics - Get system-wide metrics
export async function GET(request: NextRequest) {
  try {
    // Get all agents
    const agents = await AgentStorage.getAll();

    // Calculate agent metrics
    const agentMetrics = {
      total: agents.length,
      online: agents.filter(a => a.status === AgentStatus.ONLINE).length,
      offline: agents.filter(a => a.status === AgentStatus.OFFLINE).length,
      error: agents.filter(a => a.status === AgentStatus.ERROR).length,
    };

    // Get memory statistics
    const memoryStats = await MemoryEntryStorage.getStats();

    // Get MCP tools
    const mcpTools = await MCPToolStorage.getAll();
    const activeTools = mcpTools.filter(tool => tool.isActive).length;

    // Calculate MCP metrics
    const mcpMetrics = {
      activeTools,
      totalExecutions: mcpTools.reduce((sum, tool) => sum + tool.usageStats.totalExecutions, 0),
      averageExecutionTime: mcpTools.length > 0
        ? mcpTools.reduce((sum, tool) => sum + tool.usageStats.averageExecutionTime, 0) / mcpTools.length
        : 0,
      errorRate: mcpTools.length > 0
        ? mcpTools.reduce((sum, tool) => sum + (1 - tool.usageStats.successRate), 0) / mcpTools.length
        : 0,
    };

    // System metrics (simplified for MVP)
    const systemMetrics = {
      uptime: process.uptime() * 1000, // Convert to milliseconds
      memoryUsage: process.memoryUsage().heapUsed / (1024 * 1024), // Convert to MB
      diskUsage: 0, // Would require additional calculation in production
    };

    const metrics = {
      timestamp: new Date(),
      agents: agentMetrics,
      memory: {
        totalEntries: memoryStats.totalEntries,
        totalSize: memoryStats.totalSize,
        averageAccessTime: 0, // Would be calculated from access logs in production
        topCategories: memoryStats.categoryBreakdown.slice(0, 5),
      },
      mcp: mcpMetrics,
      system: systemMetrics,
    };

    return NextResponse.json(createApiResponse(metrics));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}