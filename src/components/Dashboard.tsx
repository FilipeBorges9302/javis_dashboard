'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { SystemMetrics } from '@/lib/types'
import { formatNumber, formatBytes, formatRelativeTime } from '@/lib/utils'

export function Dashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/agents/system-metrics')
        const data = await response.json()

        if (data.success) {
          setMetrics(data.data)
          setError(null)
        } else {
          setError(data.error || 'Failed to load metrics')
        }
      } catch (err) {
        setError('Failed to connect to the server')
        console.error('Error fetching metrics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <span>⚠️</span>
              <div>
                <p className="font-medium">Failed to load dashboard</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Agent Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage your AI ecosystem
        </p>
        <p className="text-sm text-muted-foreground">
          Last updated: {formatRelativeTime(metrics.timestamp)}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Agent Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.agents.total}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="status-online text-xs">
                {metrics.agents.online} online
              </Badge>
              <Badge variant="outline" className="text-xs">
                {metrics.agents.offline} offline
              </Badge>
              {metrics.agents.error > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.agents.error} error
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Memory Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.memory.totalEntries)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatBytes(metrics.memory.totalSize)} total size
            </p>
          </CardContent>
        </Card>

        {/* MCP Tools */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MCP Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mcp.activeTools}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatNumber(metrics.mcp.totalExecutions)} executions
            </p>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Healthy</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatBytes(metrics.system.memoryUsage * 1024 * 1024)} memory used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Memory Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Memory Categories</CardTitle>
            <CardDescription>Most used memory categories</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.memory.topCategories.length > 0 ? (
              <div className="space-y-3">
                {metrics.memory.topCategories.slice(0, 5).map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{category.category}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {category.count} entries
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <span>📝</span>
                <p className="mt-2 text-sm">No memory entries yet</p>
                <p className="text-xs">Create some memories to see categories here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">MCP Success Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(1 - metrics.mcp.errorRate) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {((1 - metrics.mcp.errorRate) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Avg Execution Time</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.mcp.averageExecutionTime.toFixed(0)}ms
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">System Uptime</span>
                <span className="text-sm text-muted-foreground">
                  {Math.floor(metrics.system.uptime / (1000 * 60 * 60))}h {Math.floor((metrics.system.uptime % (1000 * 60 * 60)) / (1000 * 60))}m
                </span>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-green-600">
                      {metrics.agents.online}
                    </p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-yellow-600">
                      {metrics.memory.totalEntries}
                    </p>
                    <p className="text-xs text-muted-foreground">Memories</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-blue-600">
                      {metrics.mcp.activeTools}
                    </p>
                    <p className="text-xs text-muted-foreground">Tools</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}