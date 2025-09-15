import { NextRequest, NextResponse } from 'next/server';
import { MemoryEntryStorage, createApiResponse, createApiError } from '@/lib/storage';
import { validateAndTransform } from '@/lib/validation';
import { updateMemoryEntrySchema } from '@/lib/validation';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { isValidUUID } from '@/lib/utils';

interface RouteParams {
  params: {
    entryId: string;
  };
}

// GET /api/memory/entries/[entryId] - Get specific memory entry
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { entryId } = params;

    if (!isValidUUID(entryId)) {
      return NextResponse.json(createApiError('Invalid entry ID format'), { status: 400 });
    }

    const entry = await MemoryEntryStorage.getById(entryId);
    if (!entry) {
      throw new NotFoundError('Memory entry', entryId);
    }

    return NextResponse.json(createApiResponse(entry));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT /api/memory/entries/[entryId] - Update memory entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { entryId } = params;
    const body = await request.json();

    if (!isValidUUID(entryId)) {
      return NextResponse.json(createApiError('Invalid entry ID format'), { status: 400 });
    }

    // Validate request body
    const validationResult = validateAndTransform(updateMemoryEntrySchema, body);
    if (!validationResult.success) {
      return NextResponse.json(createApiError(validationResult.error), { status: 400 });
    }

    const updates = validationResult.data;
    const updatedEntry = await MemoryEntryStorage.update(entryId, updates);

    if (!updatedEntry) {
      throw new NotFoundError('Memory entry', entryId);
    }

    return NextResponse.json(createApiResponse(updatedEntry));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE /api/memory/entries/[entryId] - Delete memory entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { entryId } = params;

    if (!isValidUUID(entryId)) {
      return NextResponse.json(createApiError('Invalid entry ID format'), { status: 400 });
    }

    const deleted = await MemoryEntryStorage.delete(entryId);
    if (!deleted) {
      throw new NotFoundError('Memory entry', entryId);
    }

    return NextResponse.json(createApiResponse(null, 'Memory entry deleted successfully'), { status: 204 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}