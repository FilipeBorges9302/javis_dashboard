'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// Simple icons using Unicode characters
const HomeIcon = () => <span>🏠</span>
const ChatIcon = () => <span>💬</span>
const MemoryIcon = () => <span>🧠</span>
const AgentsIcon = () => <span>🤖</span>
const ToolsIcon = () => <span>🔧</span>
const SunIcon = () => <span>☀️</span>
const MoonIcon = () => <span>🌙</span>

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Chat', href: '/chat', icon: ChatIcon },
  { name: 'Memory', href: '/memory', icon: MemoryIcon },
  { name: 'Agents', href: '/agents', icon: AgentsIcon },
  { name: 'MCP Tools', href: '/mcp', icon: ToolsIcon },
]

export function Navigation() {
  const pathname = usePathname()
  const [darkMode, setDarkMode] = useState(false)

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)

    setDarkMode(shouldUseDark)
    document.documentElement.classList.toggle('dark', shouldUseDark)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newDarkMode)
  }

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <span className="text-2xl">🤖</span>
        <div>
          <h1 className="font-semibold text-lg">AI Dashboard</h1>
          <p className="text-xs text-muted-foreground">Agent Command Center</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'nav-link',
                    isActive && 'active'
                  )}
                >
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button
          onClick={toggleDarkMode}
          className="nav-link w-full justify-between"
        >
          <div className="flex items-center gap-3">
            {darkMode ? <SunIcon /> : <MoonIcon />}
            <span>Theme</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {darkMode ? 'Light' : 'Dark'}
          </span>
        </button>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            AI Agent Dashboard v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}