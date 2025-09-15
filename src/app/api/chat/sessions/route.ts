import { NextRequest, NextResponse } from 'next/server';
import { ChatSessionStorage, createApiResponse, createApiError } from '@/lib/storage';
import { validateAndTransform } from '@/lib/validation';
import { createChatSessionSchema, paginationSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';

// GET /api/chat/sessions - List chat sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const agentId = searchParams.get('agentId');

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Validate pagination parameters
    const paginationResult = validateAndTransform(paginationSchema, { limit, offset });
    if (!paginationResult.success) {
      return NextResponse.json(createApiError(paginationResult.error), { status: 400 });
    }

    // Get paginated sessions
    const result = await ChatSessionStorage.getPaginated(
      paginationResult.data.limit,
      paginationResult.data.offset,
      agentId || undefined
    );

    return NextResponse.json(createApiResponse({
      sessions: result.items,
      total: result.total,
      hasMore: result.hasMore,
    }));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST /api/chat/sessions - Create new chat session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = validateAndTransform(createChatSessionSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(createApiError(validationResult.error), { status: 400 });
    }

    const { agentId, name } = validationResult.data;

    // Create new session
    const newSession = await ChatSessionStorage.create({
      agentId,
      name,
      isActive: true,
    });

    return NextResponse.json(createApiResponse(newSession), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE /api/chat/sessions - Bulk delete all chat sessions
export async function DELETE(request: NextRequest) {
  try {
    // Get all sessions to count them before deletion
    const allSessions = await ChatSessionStorage.getPaginated(1000, 0); // Get a large number to ensure we get all
    const totalSessions = allSessions.total;

    if (totalSessions === 0) {
      return NextResponse.json(createApiResponse({
        deletedCount: 0,
        message: 'No sessions to delete'
      }));
    }

    // Delete all sessions (this will cascade delete messages)
    const deletedCount = await ChatSessionStorage.deleteAll();

    return NextResponse.json(createApiResponse({
      deletedCount,
      message: `Successfully deleted ${deletedCount} session${deletedCount !== 1 ? 's' : ''}`
    }));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}