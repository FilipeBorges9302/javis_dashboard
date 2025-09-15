import { NextRequest, NextResponse } from 'next/server';
import { ChatSessionStorage, createApiResponse, createApiError } from '@/lib/storage';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { isValidUUID } from '@/lib/utils';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

// GET /api/chat/sessions/[sessionId] - Get specific session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = params;

    if (!isValidUUID(sessionId)) {
      return NextResponse.json(createApiError('Invalid session ID format'), { status: 400 });
    }

    const session = await ChatSessionStorage.getById(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session', sessionId);
    }

    return NextResponse.json(createApiResponse(session));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT /api/chat/sessions/[sessionId] - Update session
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = params;
    const body = await request.json();

    if (!isValidUUID(sessionId)) {
      return NextResponse.json(createApiError('Invalid session ID format'), { status: 400 });
    }

    const updatedSession = await ChatSessionStorage.update(sessionId, body);
    if (!updatedSession) {
      throw new NotFoundError('Chat session', sessionId);
    }

    return NextResponse.json(createApiResponse(updatedSession));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE /api/chat/sessions/[sessionId] - Delete session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = params;

    if (!isValidUUID(sessionId)) {
      return NextResponse.json(createApiError('Invalid session ID format'), { status: 400 });
    }

    const deleted = await ChatSessionStorage.delete(sessionId);
    if (!deleted) {
      throw new NotFoundError('Chat session', sessionId);
    }

    return NextResponse.json(createApiResponse(null, 'Session deleted successfully'), { status: 204 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}