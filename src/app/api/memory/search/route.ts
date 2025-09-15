import { NextRequest, NextResponse } from 'next/server';
import { MemoryEntryStorage, createApiResponse, createApiError } from '@/lib/storage';
import { validateAndTransform } from '@/lib/validation';
import { memorySearchSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';
import { MemoryType } from '@/lib/types';

// GET /api/memory/search - Search memory entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const type = searchParams.get('type') as MemoryType;
    const minPriorityParam = searchParams.get('minPriority');
    const limitParam = searchParams.get('limit');

    if (!query) {
      return NextResponse.json(createApiError('Query parameter is required'), { status: 400 });
    }

    const searchData = {
      query,
      category: category || undefined,
      type: type || undefined,
      minPriority: minPriorityParam ? parseInt(minPriorityParam, 10) : undefined,
      limit: limitParam ? parseInt(limitParam, 10) : 20,
    };

    // Validate search parameters
    const validationResult = validateAndTransform(memorySearchSchema, searchData);
    if (!validationResult.success) {
      return NextResponse.json(createApiError(validationResult.error), { status: 400 });
    }

    const searchOptions = validationResult.data;
    const startTime = Date.now();

    // Perform search
    const results = await MemoryEntryStorage.search(searchOptions.query, {
      category: searchOptions.category,
      type: searchOptions.type,
      limit: searchOptions.limit,
    });

    // Filter by minimum priority if specified
    const filteredResults = searchOptions.minPriority
      ? results.filter(entry => entry.priority >= searchOptions.minPriority!)
      : results;

    const searchTime = Date.now() - startTime;

    return NextResponse.json(createApiResponse({
      results: filteredResults.map(entry => ({
        entry,
        score: 1, // Simple implementation - would use actual relevance scoring in production
        matches: [
          {
            field: 'content',
            snippet: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
          },
        ],
      })),
      total: filteredResults.length,
      query: searchOptions.query,
      searchTime,
    }));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// GET /api/memory/stats - Get memory statistics
export async function POST(request: NextRequest) {
  try {
    const stats = await MemoryEntryStorage.getStats();

    // Get top tags
    const entries = await MemoryEntryStorage.getAll();
    const tagCounts = new Map<string, number>();

    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts.set(tag.toLowerCase(), (tagCounts.get(tag.toLowerCase()) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json(createApiResponse({
      ...stats,
      topTags,
    }));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}