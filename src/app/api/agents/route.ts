import { NextRequest, NextResponse } from 'next/server';
import { AgentStorage, createApiResponse, createApiError } from '@/lib/storage';
import { validateAndTransform } from '@/lib/validation';
import { createAgentSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';
import { AgentStatus, PermissionLevel } from '@/lib/types';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as AgentStatus;
    const limitParam = searchParams.get('limit');

    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 200) {
      return NextResponse.json(createApiError('Limit must be between 1 and 200'), { status: 400 });
    }

    // Get all agents
    let agents = await AgentStorage.getAll();

    // Filter by status if specified
    if (statusFilter && Object.values(AgentStatus).includes(statusFilter)) {
      agents = agents.filter(agent => agent.status === statusFilter);
    }

    // Apply limit
    const limitedAgents = agents.slice(0, limit);

    // Calculate status counts
    const statusCounts = {
      online: agents.filter(a => a.status === AgentStatus.ONLINE).length,
      offline: agents.filter(a => a.status === AgentStatus.OFFLINE).length,
      error: agents.filter(a => a.status === AgentStatus.ERROR).length,
      maintenance: agents.filter(a => a.status === AgentStatus.MAINTENANCE).length,
    };

    return NextResponse.json(createApiResponse({
      agents: limitedAgents,
      total: agents.length,
      statusCounts,
    }));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST /api/agents - Register new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Add default permissions if not provided
    const agentData = {
      ...body,
      permissions: body.permissions || {
        memoryAccess: PermissionLevel.READ,
        toolAccess: [],
        rateLimitRpm: 60,
        maxMemorySize: 100,
      },
      status: AgentStatus.OFFLINE,
    };

    // Validate request body
    const validationResult = validateAndTransform(createAgentSchema, agentData);
    if (!validationResult.success) {
      return NextResponse.json(createApiError(validationResult.error), { status: 400 });
    }

    const newAgent = await AgentStorage.create({
      ...validationResult.data,
      status: AgentStatus.OFFLINE,
    });

    return NextResponse.json(createApiResponse(newAgent), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}