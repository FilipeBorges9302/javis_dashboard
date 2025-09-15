import { NextRequest, NextResponse } from 'next/server';
import { MCPToolStorage, createApiResponse, createApiError } from '@/lib/storage';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { isValidUUID } from '@/lib/utils';

interface RouteParams {
  params: {
    toolId: string;
  };
}

// GET /api/mcp/tools/[toolId] - Get specific MCP tool
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { toolId } = params;

    if (!isValidUUID(toolId)) {
      return NextResponse.json(createApiError('Invalid tool ID format'), { status: 400 });
    }

    const tool = await MCPToolStorage.getById(toolId);
    if (!tool) {
      throw new NotFoundError('MCP tool', toolId);
    }

    return NextResponse.json(createApiResponse(tool));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT /api/mcp/tools/[toolId] - Update MCP tool
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { toolId } = params;
    const body = await request.json();

    if (!isValidUUID(toolId)) {
      return NextResponse.json(createApiError('Invalid tool ID format'), { status: 400 });
    }

    // For MVP, allow updating description, isActive, and permissions
    const allowedUpdates = {
      description: body.description,
      isActive: body.isActive,
      permissions: body.permissions,
    };

    // Remove undefined values
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );

    const updatedTool = await MCPToolStorage.update(toolId, updates);

    if (!updatedTool) {
      throw new NotFoundError('MCP tool', toolId);
    }

    return NextResponse.json(createApiResponse(updatedTool));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE /api/mcp/tools/[toolId] - Delete MCP tool
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { toolId } = params;

    if (!isValidUUID(toolId)) {
      return NextResponse.json(createApiError('Invalid tool ID format'), { status: 400 });
    }

    const deleted = await MCPToolStorage.delete(toolId);
    if (!deleted) {
      throw new NotFoundError('MCP tool', toolId);
    }

    return NextResponse.json(createApiResponse(null, 'MCP tool deleted successfully'), { status: 204 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}