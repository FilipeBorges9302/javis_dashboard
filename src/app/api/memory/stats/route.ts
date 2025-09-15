import { NextRequest, NextResponse } from 'next/server';
import { MemoryEntryStorage, createApiResponse } from '@/lib/storage';
import { handleApiError } from '@/lib/errors';

// GET /api/memory/stats - Get memory statistics
export async function GET(request: NextRequest) {
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