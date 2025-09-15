# MyJavis Dashboard Constitution
Local AI Agent Development Monitor - Next.js Application

## Core Principles

### I. Simplicity First
Minimal setup with zero configuration; Single command to start (`npm run dev`); No authentication, no database, no external dependencies; Focus on essential monitoring features only

### II. Real-Time Tool Call Monitoring
Display live feed of agent tool calls and responses; WebSocket or Server-Sent Events for real-time updates; Clear visualization of tool execution flow and results; Agent activity logs with timestamps and status

### III. Local Development Focus
Designed for local development workflow; File-based configuration and logs; Hot reload for immediate feedback; Docker optional but not required for development

### IV. Clean UI/UX
Intuitive interface for monitoring agent behavior; Responsive design with Tailwind CSS; Dark/light theme support; Collapsible sections for different agents and tool calls

### V. Developer-Friendly
TypeScript for better development experience; Component-based architecture for maintainability; Easy to extend with new monitoring features; Clear code structure for rapid iteration

## Technical Stack Requirements

**Frontend**: Next.js 14+ with App Router, React 18+, TypeScript, Tailwind CSS
**Backend**: Next.js API Routes for simple endpoints
**Storage**: File-based logs and configuration (JSON files)
**Real-time**: Server-Sent Events or WebSocket for live updates
**Containerization**: Optional Docker for consistent environments
**Styling**: Tailwind CSS with shadcn/ui components

## Development Standards

**Code Quality**: ESLint + Prettier for consistent formatting; Basic TypeScript strict mode; Simple component structure
**Documentation**: Minimal README with quick start; Inline code comments for complex logic
**File Organization**: Clear folder structure (`/components`, `/pages`, `/lib`, `/logs`); Consistent naming conventions
**Logging**: Simple console logging and file-based logs; JSON format for easy parsing

## Core Features

**Agent Monitor**: Live view of active agents and their status
**Tool Call Feed**: Real-time stream of tool executions with parameters and results
**Log Viewer**: Browseable history of agent activities with search/filter
**Simple Config**: JSON file for basic dashboard settings and agent endpoints

## Governance

Keep it simple and functional; Prioritize working features over perfect architecture; Easy setup is more important than enterprise patterns; Focus on developer productivity during agent development

**Version**: 1.0.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-01-15