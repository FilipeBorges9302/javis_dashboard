import { NextRequest, NextResponse } from 'next/server';
import { ChatMessageStorage, createApiResponse, createApiError } from '@/lib/storage';
import { validateAndTransform } from '@/lib/validation';
import { createChatMessageSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';
import { isValidUUID } from '@/lib/utils';

// GET /api/chat/messages - Get messages for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limitParam = searchParams.get('limit');
    const beforeParam = searchParams.get('before');

    if (!sessionId) {
      return NextResponse.json(createApiError('sessionId is required'), { status: 400 });
    }

    if (!isValidUUID(sessionId)) {
      return NextResponse.json(createApiError('Invalid sessionId format'), { status: 400 });
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const before = beforeParam ? new Date(beforeParam) : undefined;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 200) {
      return NextResponse.json(createApiError('Limit must be between 1 and 200'), { status: 400 });
    }

    const messages = await ChatMessageStorage.getBySession(sessionId, limit, before);
    const hasMore = messages.length === limit;

    return NextResponse.json(createApiResponse({
      messages,
      hasMore,
    }));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST /api/chat/messages - Create new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = validateAndTransform(createChatMessageSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(createApiError(validationResult.error), { status: 400 });
    }

    const messageData = validationResult.data;

    // Create new message
    const newMessage = await ChatMessageStorage.create(messageData);

    return NextResponse.json(createApiResponse(newMessage), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}