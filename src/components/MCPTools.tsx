'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import { MCPTool, Agent, ParameterType } from '@/lib/types'
import { formatRelativeTime, formatPercentage } from '@/lib/utils'

export function MCPTools() {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showExecuteForm, setShowExecuteForm] = useState<string | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const [executionParams, setExecutionParams] = useState<Record<string, any>>({})
  const [selectedAgent, setSelectedAgent] = useState<string>('')

  useEffect(() => {
    loadTools()
    loadAgents()
  }, [selectedCategory])

  const loadTools = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50',
        isActive: 'true',
      })

      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }

      const response = await fetch(`/api/mcp/tools?${params}`)
      const data = await response.json()

      if (data.success) {
        setTools(data.data.tools)
        setCategories(data.data.categories)
      }
    } catch (error) {
      console.error('Failed to load tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents?limit=20')
      const data = await response.json()
      if (data.success) {
        setAgents(data.data.agents)
        if (data.data.agents.length > 0 && !selectedAgent) {
          setSelectedAgent(data.data.agents[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const toggleToolStatus = async (toolId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/mcp/tools/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      const data = await response.json()
      if (data.success) {
        setTools(prev => prev.map(tool =>
          tool.id === toolId ? { ...tool, isActive: !isActive } : tool
        ))
      }
    } catch (error) {
      console.error('Failed to toggle tool status:', error)
    }
  }

  const executeTool = async (toolId: string) => {
    if (!selectedAgent) return

    try {
      setExecuting(toolId)
      const response = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          agentId: selectedAgent,
          parameters: executionParams,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert(`Tool executed successfully!\n\nResult: ${JSON.stringify(data.data.result, null, 2)}`)
        setShowExecuteForm(null)
        setExecutionParams({})
        loadTools() // Refresh to update usage stats
      } else {
        alert(`Execution failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to execute tool:', error)
      alert('Failed to execute tool')
    } finally {
      setExecuting(null)
    }
  }

  const handleParameterChange = (paramName: string, value: any, type: ParameterType) => {
    let parsedValue = value

    // Parse value based on type
    if (type === ParameterType.NUMBER) {
      parsedValue = value === '' ? undefined : parseFloat(value)
    } else if (type === ParameterType.BOOLEAN) {
      parsedValue = value === 'true'
    } else if (type === ParameterType.ARRAY) {
      try {
        parsedValue = value ? JSON.parse(value) : []
      } catch {
        parsedValue = value.split(',').map((item: string) => item.trim())
      }
    } else if (type === ParameterType.OBJECT) {
      try {
        parsedValue = value ? JSON.parse(value) : {}
      } catch {
        parsedValue = value
      }
    }

    setExecutionParams(prev => ({
      ...prev,
      [paramName]: parsedValue,
    }))
  }

  const getTypeIcon = (type: ParameterType) => {
    const icons = {
      [ParameterType.STRING]: '📝',
      [ParameterType.NUMBER]: '🔢',
      [ParameterType.BOOLEAN]: '☑️',
      [ParameterType.ARRAY]: '📋',
      [ParameterType.OBJECT]: '📦',
    }
    return icons[type]
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">MCP Tools</h1>
        <p className="text-muted-foreground mt-1">
          Model Context Protocol tools available to agents
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex gap-4 items-end">
            <div>
              <label className="form-label text-sm">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="form-label text-sm">Execute as Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="form-input"
              >
                <option value="">Select an agent...</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl mb-4 block">🔧</span>
              <p>No MCP tools found</p>
              <p className="text-sm mt-2">
                {selectedCategory !== 'all'
                  ? `No tools in the "${selectedCategory}" category`
                  : 'MCP tools will appear here when they are registered'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Card key={tool.id} className={!tool.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      🔧 {tool.name}
                      {!tool.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleToolStatus(tool.id, tool.isActive)}
                  >
                    {tool.isActive ? '⏸️' : '▶️'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Category and Stats */}
                <div className="mb-4">
                  <Badge variant="secondary" className="mb-2">
                    {tool.category}
                  </Badge>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <p>{tool.usageStats.totalExecutions}</p>
                      <p>Executions</p>
                    </div>
                    <div>
                      <p>{formatPercentage(tool.usageStats.successRate)}</p>
                      <p>Success Rate</p>
                    </div>
                    <div>
                      <p>{Math.round(tool.usageStats.averageExecutionTime)}ms</p>
                      <p>Avg Time</p>
                    </div>
                  </div>
                </div>

                {/* Parameters */}
                {tool.parameters.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Parameters</p>
                    <div className="space-y-2">
                      {tool.parameters.slice(0, 3).map((param) => (
                        <div key={param.name} className="flex items-center gap-2 text-sm">
                          <span>{getTypeIcon(param.type)}</span>
                          <span className="font-mono text-xs">{param.name}</span>
                          {param.required && (
                            <Badge variant="outline" className="text-xs">required</Badge>
                          )}
                        </div>
                      ))}
                      {tool.parameters.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{tool.parameters.length - 3} more parameters
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowExecuteForm(showExecuteForm === tool.id ? null : tool.id)}
                    disabled={!tool.isActive || !selectedAgent}
                    className="flex-1"
                  >
                    {executing === tool.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      showExecuteForm === tool.id ? 'Cancel' : 'Execute'
                    )}
                  </Button>
                </div>

                {/* Execution Form */}
                {showExecuteForm === tool.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Tool Parameters</h4>
                    <div className="space-y-3">
                      {tool.parameters.map((param) => (
                        <div key={param.name}>
                          <label className="form-label text-xs flex items-center gap-1">
                            {getTypeIcon(param.type)} {param.name}
                            {param.required && <span className="text-red-500">*</span>}
                          </label>
                          {param.type === ParameterType.BOOLEAN ? (
                            <select
                              value={executionParams[param.name]?.toString() || 'false'}
                              onChange={(e) => handleParameterChange(param.name, e.target.value, param.type)}
                              className="form-input text-xs"
                            >
                              <option value="false">false</option>
                              <option value="true">true</option>
                            </select>
                          ) : param.type === ParameterType.ARRAY || param.type === ParameterType.OBJECT ? (
                            <textarea
                              value={JSON.stringify(executionParams[param.name] || (param.type === ParameterType.ARRAY ? [] : {}), null, 2)}
                              onChange={(e) => handleParameterChange(param.name, e.target.value, param.type)}
                              placeholder={param.description}
                              className="form-input text-xs min-h-[60px] font-mono"
                            />
                          ) : (
                            <Input
                              type={param.type === ParameterType.NUMBER ? 'number' : 'text'}
                              value={executionParams[param.name] || ''}
                              onChange={(e) => handleParameterChange(param.name, e.target.value, param.type)}
                              placeholder={param.description}
                              className="text-xs"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => executeTool(tool.id)}
                        disabled={executing === tool.id}
                        className="flex-1"
                      >
                        {executing === tool.id ? 'Executing...' : 'Run Tool'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowExecuteForm(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Last Used */}
                {tool.lastUsed && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last used {formatRelativeTime(tool.lastUsed)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}