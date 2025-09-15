'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Agent, AgentStatus, PermissionLevel } from '@/lib/types'
import { formatRelativeTime, formatPercentage, getStatusColor } from '@/lib/utils'

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [statusCounts, setStatusCounts] = useState({
    online: 0,
    offline: 0,
    error: 0,
    maintenance: 0,
  })
  const [selectedStatus, setSelectedStatus] = useState<AgentStatus | 'all'>('all')

  useEffect(() => {
    loadAgents()
  }, [selectedStatus])

  const loadAgents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50',
      })

      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus)
      }

      const response = await fetch(`/api/agents?${params}`)
      const data = await response.json()

      if (data.success) {
        setAgents(data.data.agents)
        setStatusCounts(data.data.statusCounts)
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAgentStatus = async (agentId: string, status: AgentStatus) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()
      if (data.success) {
        setAgents(prev => prev.map(agent =>
          agent.id === agentId ? { ...agent, status } : agent
        ))
        loadAgents() // Reload to update counts
      }
    } catch (error) {
      console.error('Failed to update agent status:', error)
    }
  }

  const getStatusIcon = (status: AgentStatus) => {
    const icons = {
      [AgentStatus.ONLINE]: '🟢',
      [AgentStatus.OFFLINE]: '🔴',
      [AgentStatus.ERROR]: '❌',
      [AgentStatus.MAINTENANCE]: '🟡',
    }
    return icons[status]
  }

  const getPermissionColor = (level: PermissionLevel) => {
    const colors = {
      [PermissionLevel.NONE]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      [PermissionLevel.READ]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [PermissionLevel.WRITE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [PermissionLevel.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[level]
  }

  const filteredAgents = selectedStatus === 'all'
    ? agents
    : agents.filter(agent => agent.status === selectedStatus)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage AI agents in your ecosystem
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card
          className={`cursor-pointer transition-all ${
            selectedStatus === 'all' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setSelectedStatus('all')}
        >
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{statusCounts.online + statusCounts.offline + statusCounts.error}</div>
            <p className="text-xs text-muted-foreground">Total Agents</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            selectedStatus === AgentStatus.ONLINE ? 'ring-2 ring-green-500' : ''
          }`}
          onClick={() => setSelectedStatus(AgentStatus.ONLINE)}
        >
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.online}</div>
            <p className="text-xs text-muted-foreground">Online</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            selectedStatus === AgentStatus.OFFLINE ? 'ring-2 ring-gray-500' : ''
          }`}
          onClick={() => setSelectedStatus(AgentStatus.OFFLINE)}
        >
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{statusCounts.offline}</div>
            <p className="text-xs text-muted-foreground">Offline</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            selectedStatus === AgentStatus.ERROR ? 'ring-2 ring-red-500' : ''
          }`}
          onClick={() => setSelectedStatus(AgentStatus.ERROR)}
        >
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{statusCounts.error}</div>
            <p className="text-xs text-muted-foreground">Error</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl mb-4 block">🤖</span>
              <p>
                {selectedStatus === 'all'
                  ? 'No agents found'
                  : `No ${selectedStatus} agents`}
              </p>
              <p className="text-sm mt-2">
                {selectedStatus === 'all'
                  ? 'Agents will appear here when they connect to the system'
                  : `Switch to "All" to see agents with other statuses`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStatusIcon(agent.status)}</span>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {agent.status !== AgentStatus.ONLINE && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAgentStatus(agent.id, AgentStatus.ONLINE)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Start
                      </Button>
                    )}
                    {agent.status !== AgentStatus.OFFLINE && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAgentStatus(agent.id, AgentStatus.OFFLINE)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        Stop
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Status and Last Seen */}
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </Badge>
                  {agent.lastSeen && (
                    <span className="text-sm text-muted-foreground">
                      Last seen {formatRelativeTime(agent.lastSeen)}
                    </span>
                  )}
                </div>

                {/* Configuration */}
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Model Configuration</p>
                    <div className="text-sm text-muted-foreground">
                      <p>Model: {agent.configuration.model}</p>
                      <p>Temperature: {agent.configuration.temperature}</p>
                      <p>Max Tokens: {agent.configuration.maxTokens.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getPermissionColor(agent.permissions.memoryAccess)}>
                        Memory: {agent.permissions.memoryAccess}
                      </Badge>
                      <Badge variant="outline">
                        {agent.permissions.rateLimitRpm} RPM
                      </Badge>
                      <Badge variant="outline">
                        {agent.permissions.maxMemorySize}MB limit
                      </Badge>
                    </div>
                    {agent.permissions.toolAccess.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tool access: {agent.permissions.toolAccess.length} tools
                      </p>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Performance Metrics</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Requests</p>
                      <p className="font-medium">{agent.metrics.totalRequests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Response</p>
                      <p className="font-medium">{Math.round(agent.metrics.averageResponseTime)}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Error Rate</p>
                      <p className={`font-medium ${
                        agent.metrics.errorRate > 0.1 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatPercentage(agent.metrics.errorRate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Uptime</p>
                      <p className="font-medium">{agent.metrics.uptime.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}