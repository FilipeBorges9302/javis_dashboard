'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import { ChatSession, ChatMessage, Agent, DeletionConfirmation, DeletionError } from '@/lib/types'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'

export function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletionConfirmation, setDeletionConfirmation] = useState<DeletionConfirmation>({
    sessionId: null,
    type: 'single',
    isOpen: false,
    isDeleting: false
  })
  const [deletionError, setDeletionError] = useState<DeletionError | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load initial data
  useEffect(() => {
    loadSessions()
    loadAgents()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id)
    }
  }, [currentSession])

  // Handle keyboard events for confirmation dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (deletionConfirmation.isOpen && event.key === 'Escape') {
        closeDeleteConfirmation()
      }
    }

    if (deletionConfirmation.isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [deletionConfirmation.isOpen])

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions?limit=20')
      const data = await response.json()
      if (data.success) {
        setSessions(data.data.sessions)
        if (data.data.sessions.length > 0 && !currentSession) {
          setCurrentSession(data.data.sessions[0])
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents?limit=10')
      const data = await response.json()
      if (data.success) {
        setAgents(data.data.agents)
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}&limit=50`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.data.messages.reverse()) // Reverse to show chronologically
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (agentId: string) => {
    try {
      setCreating(true)
      const agent = agents.find(a => a.id === agentId)
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          name: `Chat with ${agent?.name || 'Agent'} - ${formatDateTime(new Date())}`,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setSessions(prev => [data.data, ...prev])
        setCurrentSession(data.data)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setCreating(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentSession || loading) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      setLoading(true)

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(), // Temporary ID
        sessionId: currentSession.id,
        role: 'user',
        content: messageContent,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMessage])

      // Send to API
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          role: 'user',
          content: messageContent,
        }),
      })

      if (response.ok) {
        // Simulate agent response (in a real system, this would come from the agent)
        setTimeout(async () => {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(), // Temporary ID
            sessionId: currentSession.id,
            role: 'assistant',
            content: `I received your message: "${messageContent}". This is a simulated response for the MVP dashboard. In a real implementation, this would connect to your AI agents.`,
            timestamp: new Date(),
          }

          // Send assistant response
          try {
            await fetch('/api/chat/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: currentSession.id,
                role: 'assistant',
                content: assistantMessage.content,
              }),
            })

            setMessages(prev => [...prev, assistantMessage])
          } catch (error) {
            console.error('Failed to save assistant message:', error)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent?.name || 'Unknown Agent'
  }

  const getAgentStatus = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent?.status || 'offline'
  }

  // Deletion functions
  const openDeleteConfirmation = (sessionId: string) => {
    setDeletionConfirmation({
      sessionId,
      type: 'single',
      isOpen: true,
      isDeleting: false
    })
    setDeletionError(null)
  }

  const openBulkDeleteConfirmation = () => {
    setDeletionConfirmation({
      sessionId: null,
      type: 'bulk',
      isOpen: true,
      isDeleting: false
    })
    setDeletionError(null)
  }

  const closeDeleteConfirmation = () => {
    if (deletionConfirmation.isDeleting) return // Don't close while deleting
    
    setDeletionConfirmation({
      sessionId: null,
      type: 'single',
      isOpen: false,
      isDeleting: false
    })
    setDeletionError(null)
  }

  const deleteSession = async (sessionId: string) => {
    try {
      setDeletionConfirmation(prev => ({ ...prev, isDeleting: true }))
      setDeletionError(null)

      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete session')
      }

      // Remove session from local state
      setSessions(prev => prev.filter(session => session.id !== sessionId))

      // Handle current session deletion
      if (currentSession?.id === sessionId) {
        const remainingSessions = sessions.filter(session => session.id !== sessionId)
        if (remainingSessions.length > 0) {
          // Switch to the first remaining session
          setCurrentSession(remainingSessions[0])
          loadMessages(remainingSessions[0].id)
        } else {
          // No sessions left
          setCurrentSession(null)
          setMessages([])
        }
      }

      closeDeleteConfirmation()
    } catch (error) {
      setDeletionError({
        type: 'deletion-failed',
        message: error instanceof Error ? error.message : 'Failed to delete session',
        sessionId
      })
      setDeletionConfirmation(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const deleteAllSessions = async () => {
    try {
      setDeletionConfirmation(prev => ({ ...prev, isDeleting: true }))
      setDeletionError(null)

      const response = await fetch('/api/chat/sessions', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete sessions')
      }

      // Clear all local state
      setSessions([])
      setCurrentSession(null)
      setMessages([])
      setNewMessage('')

      closeDeleteConfirmation()
    } catch (error) {
      setDeletionError({
        type: 'deletion-failed',
        message: error instanceof Error ? error.message : 'Failed to delete sessions'
      })
      setDeletionConfirmation(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const handleConfirmDeletion = () => {
    if (deletionConfirmation.type === 'single' && deletionConfirmation.sessionId) {
      deleteSession(deletionConfirmation.sessionId)
    } else if (deletionConfirmation.type === 'bulk') {
      deleteAllSessions()
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Chat Sessions</h2>
            {sessions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={openBulkDeleteConfirmation}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={deletionConfirmation.isDeleting}
              >
                Delete All
              </Button>
            )}
          </div>

          {/* Create new session */}
          {agents.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Start new chat:</p>
              <div className="space-y-2">
                {agents.slice(0, 3).map((agent) => (
                  <Button
                    key={agent.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => createSession(agent.id)}
                    disabled={creating}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="truncate">{agent.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Session list */}
        <div className="overflow-y-auto flex-1">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <span className="text-2xl mb-2 block">💬</span>
              <p className="text-sm">No chat sessions yet</p>
              <p className="text-xs">Create a session with an agent to start</p>
            </div>
          ) : (
            <div className="p-2">
              {sessions.map((session) => (
                <div key={session.id} className="relative group mb-2">
                  <button
                    onClick={() => setCurrentSession(session)}
                    className={`w-full p-3 text-left rounded-lg transition-colors ${
                      currentSession?.id === session.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        getAgentStatus(session.agentId) === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium text-sm truncate">
                        {getAgentName(session.agentId)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.lastMessage || 'No messages yet'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(session.updatedAt)} • {session.messageCount} messages
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDeleteConfirmation(session.id)
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 w-6 h-6 p-0"
                    disabled={deletionConfirmation.isDeleting}
                    title="Delete session"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  getAgentStatus(currentSession.agentId) === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <h2 className="font-semibold">{getAgentName(currentSession.agentId)}</h2>
                  <p className="text-sm text-muted-foreground">
                    {currentSession.messageCount} messages • Created {formatRelativeTime(currentSession.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && messages.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <span className="text-4xl mb-4 block">👋</span>
                  <p>Start a conversation with {getAgentName(currentSession.agentId)}</p>
                  <p className="text-sm mt-2">Type your message below to begin</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {formatDateTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    '➤'
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <span className="text-6xl mb-4 block">💬</span>
              <h2 className="text-lg font-medium mb-2">No Session Selected</h2>
              <p className="text-sm">Select a chat session from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Deletion Confirmation Dialog */}
      {deletionConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {deletionConfirmation.type === 'single' 
                  ? 'Delete Session' 
                  : 'Delete All Sessions'
                }
              </h3>
              
              {deletionConfirmation.type === 'single' ? (
                <div>
                  {deletionConfirmation.sessionId && (() => {
                    const session = sessions.find(s => s.id === deletionConfirmation.sessionId)
                    return session ? (
                      <div className="text-sm text-gray-600 mb-3">
                        <p className="mb-2">
                          Are you sure you want to delete "{getAgentName(session.agentId)}" session?
                        </p>
                        <p className="mb-2">
                          This will delete {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}.
                        </p>
                        {currentSession?.id === session.id && (
                          <p className="text-orange-600 font-medium">
                            You are about to delete the current active session. You will be switched to another session.
                          </p>
                        )}
                      </div>
                    ) : null
                  })()}
                </div>
              ) : (
                <div className="text-sm text-gray-600 mb-3">
                  <p className="mb-2">
                    Are you sure you want to delete all {sessions.length} session{sessions.length !== 1 ? 's' : ''}?
                  </p>
                  <p className="mb-2">
                    This will delete {sessions.reduce((total, session) => total + session.messageCount, 0)} message{sessions.reduce((total, session) => total + session.messageCount, 0) !== 1 ? 's' : ''} in total.
                  </p>
                  <p className="text-red-600 font-medium">
                    All your chat history will be permanently lost.
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                This action cannot be undone.
              </p>
            </div>

            {deletionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{deletionError.message}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={closeDeleteConfirmation}
                disabled={deletionConfirmation.isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleConfirmDeletion}
                disabled={deletionConfirmation.isDeleting}
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
              >
                {deletionConfirmation.isDeleting 
                  ? (deletionConfirmation.type === 'single' ? 'Deleting...' : 'Deleting All...')
                  : (deletionConfirmation.type === 'single' ? 'Confirm Delete' : 'Confirm Delete All')
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}