import { NextRequest, NextResponse } from 'next/server';
import { MemoryEntryStorage, createApiResponse, createApiError } from '@/lib/storage';
import { validateAndTransform } from '@/lib/validation';
import { createMemoryEntrySchema, paginationSchema, sortingSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';
import { MemoryType } from '@/lib/types';

// GET /api/memory/entries - List memory entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const category = searchParams.get('category');
    const type = searchParams.get('type') as MemoryType;
    const tags = searchParams.get('tags');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Validate pagination parameters
    const paginationResult = validateAndTransform(paginationSchema, { limit, offset });
    if (!paginationResult.success) {
      return NextResponse.json(createApiError(paginationResult.error), { status: 400 });
    }

    // Get all entries and apply filters
    let entries = await MemoryEntryStorage.getAll();

    // Filter by category
    if (category) {
      entries = entries.filter(entry => entry.category.includes(category));
    }

    // Filter by type
    if (type && Object.values(MemoryType).includes(type)) {
      entries = entries.filter(entry => entry.type === type);
    }

    // Filter by tags
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
      entries = entries.filter(entry =>
        tagList.some(tag => entry.tags.some(entryTag => entryTag.toLowerCase().includes(tag)))
      );
    }

    // Sort entries
    entries.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'accessCount':
          aValue = a.accessCount;
          bValue = b.accessCount;
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    // Apply pagination
    const total = entries.length;
    const paginatedEntries = entries.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    // Get category counts
    const stats = await MemoryEntryStorage.getStats();

    return NextResponse.json(createApiResponse({
      entries: paginatedEntries,
      total,
      hasMore,
      categories: stats.categoryBreakdown,
    }));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST /api/memory/entries - Create new memory entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = validateAndTransform(createMemoryEntrySchema, body);
    if (!validationResult.success) {
      return NextResponse.json(createApiError(validationResult.error), { status: 400 });
    }

    const entryData = validationResult.data;

    // Create new entry
    const newEntry = await MemoryEntryStorage.create(entryData);

    return NextResponse.json(createApiResponse(newEntry), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}