import { AgentStorage, MemoryEntryStorage, MCPToolStorage } from '@/lib/storage'

describe('Storage Integration Tests', () => {
  it('should load sample agents data', async () => {
    const agents = await AgentStorage.getAll()

    expect(agents).toHaveLength(3)
    expect(agents[0]).toHaveProperty('id')
    expect(agents[0]).toHaveProperty('name')
    expect(agents[0]).toHaveProperty('status')
    expect(agents[0]).toHaveProperty('configuration')
    expect(agents[0]).toHaveProperty('metrics')
  })

  it('should load sample memory data', async () => {
    const memories = await MemoryEntryStorage.getAll()

    expect(memories).toHaveLength(5)
    expect(memories[0]).toHaveProperty('id')
    expect(memories[0]).toHaveProperty('type')
    expect(memories[0]).toHaveProperty('content')
    expect(memories[0]).toHaveProperty('category')
    expect(memories[0]).toHaveProperty('tags')
  })

  it('should load sample MCP tools data', async () => {
    const tools = await MCPToolStorage.getAll()

    expect(tools).toHaveLength(4)
    expect(tools[0]).toHaveProperty('id')
    expect(tools[0]).toHaveProperty('name')
    expect(tools[0]).toHaveProperty('description')
    expect(tools[0]).toHaveProperty('parameters')
    expect(tools[0]).toHaveProperty('usageStats')
  })

  it('should calculate memory stats correctly', async () => {
    const stats = await MemoryEntryStorage.getStats()

    expect(stats).toHaveProperty('totalEntries')
    expect(stats).toHaveProperty('totalSize')
    expect(stats).toHaveProperty('categoryBreakdown')
    expect(stats).toHaveProperty('typeBreakdown')
    expect(stats.totalEntries).toBeGreaterThan(0)
    expect(Array.isArray(stats.categoryBreakdown)).toBe(true)
  })
})