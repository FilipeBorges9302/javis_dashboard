import { NextRequest, NextResponse } from 'next/server';
import { MCPToolStorage, createApiResponse, createApiError } from '@/lib/storage';
import { validateAndTransform } from '@/lib/validation';
import { createMCPToolSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';

// GET /api/mcp/tools - List MCP tools
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActiveParam = searchParams.get('isActive');
    const limitParam = searchParams.get('limit');

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : true;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 200) {
      return NextResponse.json(createApiError('Limit must be between 1 and 200'), { status: 400 });
    }

    // Get all tools
    let tools = await MCPToolStorage.getAll();

    // Filter by category
    if (category) {
      tools = tools.filter(tool => tool.category === category);
    }

    // Filter by active status
    tools = tools.filter(tool => tool.isActive === isActive);

    // Apply limit
    const limitedTools = tools.slice(0, limit);

    // Get unique categories
    const allTools = await MCPToolStorage.getAll();
    const categories = [...new Set(allTools.map(tool => tool.category))].sort();

    return NextResponse.json(createApiResponse({
      tools: limitedTools,
      total: tools.length,
      categories,
    }));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST /api/mcp/tools - Register new MCP tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Add default values
    const toolData = {
      ...body,
      isActive: body.isActive !== undefined ? body.isActive : true,
      permissions: body.permissions || [],
    };

    // Validate request body
    const validationResult = validateAndTransform(createMCPToolSchema, toolData);
    if (!validationResult.success) {
      return NextResponse.json(createApiError(validationResult.error), { status: 400 });
    }

    const newTool = await MCPToolStorage.create({
      ...validationResult.data,
      isActive: toolData.isActive,
    });

    return NextResponse.json(createApiResponse(newTool), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}