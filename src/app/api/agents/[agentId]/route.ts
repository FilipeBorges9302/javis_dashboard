import { NextRequest, NextResponse } from 'next/server';
import { AgentStorage, createApiResponse, createApiError } from '@/lib/storage';
import { validateAndTransform } from '@/lib/validation';
import { updateAgentSchema } from '@/lib/validation';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { isValidUUID } from '@/lib/utils';

interface RouteParams {
  params: {
    agentId: string;
  };
}

// GET /api/agents/[agentId] - Get specific agent
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { agentId } = params;

    if (!isValidUUID(agentId)) {
      return NextResponse.json(createApiError('Invalid agent ID format'), { status: 400 });
    }

    const agent = await AgentStorage.getById(agentId);
    if (!agent) {
      throw new NotFoundError('Agent', agentId);
    }

    return NextResponse.json(createApiResponse(agent));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT /api/agents/[agentId] - Update agent
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { agentId } = params;
    const body = await request.json();

    if (!isValidUUID(agentId)) {
      return NextResponse.json(createApiError('Invalid agent ID format'), { status: 400 });
    }

    // Validate request body
    const validationResult = validateAndTransform(updateAgentSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(createApiError(validationResult.error), { status: 400 });
    }

    const updates = validationResult.data;
    const updatedAgent = await AgentStorage.update(agentId, updates);

    if (!updatedAgent) {
      throw new NotFoundError('Agent', agentId);
    }

    return NextResponse.json(createApiResponse(updatedAgent));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE /api/agents/[agentId] - Delete agent
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { agentId } = params;

    if (!isValidUUID(agentId)) {
      return NextResponse.json(createApiError('Invalid agent ID format'), { status: 400 });
    }

    const deleted = await AgentStorage.delete(agentId);
    if (!deleted) {
      throw new NotFoundError('Agent', agentId);
    }

    return NextResponse.json(createApiResponse(null, 'Agent deleted successfully'), { status: 204 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}