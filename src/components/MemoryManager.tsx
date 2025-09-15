'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import { MemoryEntry, MemoryType } from '@/lib/types'
import { formatDateTime, formatRelativeTime, capitalize } from '@/lib/utils'

export function MemoryManager() {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<MemoryType | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state for creating new memory
  const [newMemory, setNewMemory] = useState({
    type: MemoryType.FACT,
    content: '',
    category: '',
    tags: '',
    priority: 3,
  })

  useEffect(() => {
    loadMemories()
    loadStats()
  }, [selectedType, selectedCategory])

  const loadMemories = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })

      if (selectedType !== 'all') {
        params.set('type', selectedType)
      }
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }

      const response = await fetch(`/api/memory/entries?${params}`)
      const data = await response.json()

      if (data.success) {
        setMemories(data.data.entries)
        const uniqueCategories = Array.from(
          new Set(data.data.categories.map((c: any) => c.category))
        ).sort()
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Failed to load memories:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/memory/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      loadMemories()
      return
    }

    try {
      setSearching(true)
      const params = new URLSearchParams({
        query: searchQuery.trim(),
        limit: '50',
      })

      if (selectedType !== 'all') {
        params.set('type', selectedType)
      }
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }

      const response = await fetch(`/api/memory/search?${params}`)
      const data = await response.json()

      if (data.success) {
        setMemories(data.data.results.map((r: any) => r.entry))
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  const createMemory = async () => {
    if (!newMemory.content.trim() || !newMemory.category.trim()) return

    try {
      const response = await fetch('/api/memory/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newMemory.type,
          content: newMemory.content,
          category: newMemory.category,
          tags: newMemory.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          priority: newMemory.priority,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMemories(prev => [data.data, ...prev])
        setNewMemory({
          type: MemoryType.FACT,
          content: '',
          category: '',
          tags: '',
          priority: 3,
        })
        setShowCreateForm(false)
        loadStats()
      }
    } catch (error) {
      console.error('Failed to create memory:', error)
    }
  }

  const deleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return

    try {
      const response = await fetch(`/api/memory/entries/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMemories(prev => prev.filter(m => m.id !== id))
        loadStats()
      }
    } catch (error) {
      console.error('Failed to delete memory:', error)
    }
  }

  const getTypeColor = (type: MemoryType) => {
    const colors = {
      [MemoryType.FACT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [MemoryType.PREFERENCE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [MemoryType.CONTEXT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [MemoryType.INSTRUCTION]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [MemoryType.CONVERSATION]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Memory Hub</h1>
          <p className="text-muted-foreground mt-1">
            Manage and search through AI agent memories
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? '✕ Cancel' : '+ Add Memory'}
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">Total Memories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{Math.round(stats.averageAccessCount)}</div>
              <p className="text-xs text-muted-foreground">Avg Access Count</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.categoryBreakdown.length}</div>
              <p className="text-xs text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{(stats.totalSize / 1024).toFixed(1)}K</div>
              <p className="text-xs text-muted-foreground">Total Size (chars)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Memory</CardTitle>
            <CardDescription>Add a new entry to the memory system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label">Type</label>
                <select
                  value={newMemory.type}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, type: e.target.value as MemoryType }))}
                  className="form-input"
                >
                  {Object.values(MemoryType).map(type => (
                    <option key={type} value={type}>{capitalize(type)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Priority (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={newMemory.priority}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, priority: parseInt(e.target.value) || 3 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label">Category</label>
                <Input
                  value={newMemory.category}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., personal/preferences"
                />
              </div>
              <div>
                <label className="form-label">Tags (comma-separated)</label>
                <Input
                  value={newMemory.tags}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., important, work, project"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label">Content</label>
              <textarea
                value={newMemory.content}
                onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
                className="form-input min-h-[100px] resize-y"
                placeholder="Enter the memory content..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createMemory}
                disabled={!newMemory.content.trim() || !newMemory.category.trim()}
              >
                Create Memory
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                onKeyPress={(e) => e.key === 'Enter' && searchMemories()}
              />
            </div>
            <Button onClick={searchMemories} disabled={searching}>
              {searching ? '🔍' : 'Search'}
            </Button>
          </div>

          <div className="flex gap-4">
            <div>
              <label className="form-label text-xs">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as MemoryType | 'all')}
                className="form-input text-sm h-8"
              >
                <option value="all">All Types</option>
                {Object.values(MemoryType).map(type => (
                  <option key={type} value={type}>{capitalize(type)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input text-sm h-8"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : memories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl mb-4 block">🧠</span>
              <p>No memories found</p>
              <p className="text-sm mt-2">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first memory to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {memories.map((memory) => (
            <Card key={memory.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(memory.type)}>
                      {capitalize(memory.type)}
                    </Badge>
                    <Badge variant="outline">
                      Priority {memory.priority}
                    </Badge>
                    {memory.accessCount > 0 && (
                      <Badge variant="secondary">
                        {memory.accessCount} access{memory.accessCount !== 1 ? 'es' : ''}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMemory(memory.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {memory.category}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{memory.content}</p>
                </div>

                {memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {memory.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Created {formatRelativeTime(memory.createdAt)}</span>
                  <span>Modified {formatRelativeTime(memory.updatedAt)}</span>
                  {memory.lastAccessed && (
                    <span>Last accessed {formatRelativeTime(memory.lastAccessed)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}