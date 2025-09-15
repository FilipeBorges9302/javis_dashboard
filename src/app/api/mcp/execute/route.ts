import { NextRequest, NextResponse } from 'next/server';
import { MCPToolStorage, AgentStorage, AccessLogStorage, createApiResponse, createApiError } from '@/lib/storage';
import { validateAndTransform } from '@/lib/validation';
import { executeMCPToolSchema } from '@/lib/validation';
import { handleApiError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { LogOperation, LogStatus } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// POST /api/mcp/execute - Execute MCP tool
export async function POST(request: NextRequest) {
  const executionId = uuidv4();
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Validate request body
    const validationResult = validateAndTransform(executeMCPToolSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(createApiError(validationResult.error), { status: 400 });
    }

    const { toolId, agentId, parameters, timeout } = validationResult.data;

    // Get tool and agent
    const tool = await MCPToolStorage.getById(toolId);
    if (!tool) {
      throw new NotFoundError('MCP tool', toolId);
    }

    const agent = await AgentStorage.getById(agentId);
    if (!agent) {
      throw new NotFoundError('Agent', agentId);
    }

    // Check if tool is active
    if (!tool.isActive) {
      throw new ForbiddenError('Tool is not active');
    }

    // Check agent permissions (simplified for MVP)
    if (!agent.permissions.toolAccess.includes(toolId) && agent.permissions.toolAccess.length > 0) {
      throw new ForbiddenError('Agent does not have permission to use this tool');
    }

    // Log the execution attempt
    await AccessLogStorage.create({
      agentId,
      operation: LogOperation.EXECUTE,
      resource: 'mcp_tool',
      resourceId: toolId,
      responseTime: 0, // Will be updated after execution
      status: LogStatus.SUCCESS, // Will be updated based on result
    });

    // Simulate tool execution (in a real system, this would call the actual tool)
    const executionTime = Date.now() - startTime;

    // For MVP, simulate a successful execution
    const mockResult = {
      message: `Tool ${tool.name} executed successfully`,
      parameters,
      timestamp: new Date(),
    };

    // Update tool usage statistics
    await MCPToolStorage.recordExecution(toolId, executionTime, true);

    // Return execution result
    const result = {
      executionId,
      status: 'success' as const,
      result: mockResult,
      executionTime,
      timestamp: new Date(),
    };

    return NextResponse.json(createApiResponse(result));
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Update tool usage statistics for failed execution
    try {
      const body = await request.json();
      if (body.toolId) {
        await MCPToolStorage.recordExecution(body.toolId, executionTime, false);
      }
    } catch {
      // Ignore errors in error handling
    }

    const { status, body: errorBody } = handleApiError(error);

    // Return error result in execution format
    const errorResult = {
      executionId,
      status: 'error' as const,
      executionTime,
      timestamp: new Date(),
      error: {
        code: errorBody.code || 'EXECUTION_ERROR',
        message: errorBody.error || 'Tool execution failed',
        details: errorBody.details,
      },
    };

    return NextResponse.json(createApiResponse(errorResult), { status });
  }
}