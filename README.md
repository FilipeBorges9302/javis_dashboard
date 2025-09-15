# AI Agent Dashboard

A Next.js dashboard for managing AI agents and their memory system. Built for personal use with simplicity as the key focus.

## Features

- 🏠 **Dashboard Overview** - Real-time system metrics and health monitoring
- 💬 **Chat Interface** - Communicate with AI agents in real-time
- 🧠 **Memory Hub** - Manage and search through AI agent memories
- 🤖 **Agent Management** - Monitor agent status and performance
- 🔧 **MCP Tools** - Manage and execute Model Context Protocol tools
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive** - Desktop and laptop optimized interface

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open the dashboard**
   ```
   http://localhost:3000
   ```

## Usage

### Dashboard Overview
View real-time metrics including:
- Active agent count and status
- Memory database size and categories
- MCP tool execution statistics
- System health indicators

### Chat Interface
- Select from available agents in the sidebar
- Create new chat sessions
- View message history with timestamps
- Real-time messaging (simulated in MVP)

### Memory Management
- View all memory entries with filtering
- Search memories by content, tags, or category
- Create new memories with different types (fact, preference, context, instruction, conversation)
- Organize memories with hierarchical categories and tags

### Agent Management
- Monitor agent status (online, offline, error, maintenance)
- View performance metrics (requests, response time, error rate, uptime)
- Configure agent permissions and rate limits
- Start/stop agents

### MCP Tools
- View available Model Context Protocol tools
- Execute tools with proper parameter validation
- Monitor tool usage statistics and success rates
- Enable/disable tools as needed

## Architecture

### Technology Stack
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Storage**: File-based JSON storage (no database required)
- **Real-time**: Server-Sent Events for live updates
- **Testing**: Jest + React Testing Library

### File Structure
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── chat/              # Chat page
│   ├── memory/            # Memory management page
│   ├── agents/            # Agent management page
│   ├── mcp/               # MCP tools page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard homepage
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── Dashboard.tsx      # Main dashboard component
│   ├── ChatInterface.tsx  # Chat interface
│   ├── MemoryManager.tsx  # Memory management
│   ├── AgentList.tsx      # Agent list and management
│   ├── MCPTools.tsx       # MCP tools interface
│   └── Navigation.tsx     # Sidebar navigation
├── lib/                   # Utility libraries
│   ├── types.ts           # TypeScript type definitions
│   ├── storage.ts         # File storage operations
│   ├── validation.ts      # Data validation with Zod
│   ├── errors.ts          # Error handling utilities
│   └── utils.ts           # General utility functions
└── data/                  # JSON data storage
    ├── chat/              # Chat sessions and messages
    ├── memory/            # Memory entries
    ├── agents/            # Agent configurations
    ├── mcp/               # MCP tool definitions
    └── logs/              # Access logs
```

## API Endpoints

### Chat API
- `GET/POST /api/chat/sessions` - Manage chat sessions
- `GET/POST /api/chat/messages` - Handle messages
- `GET /api/chat/stream` - Server-Sent Events for real-time updates

### Memory API
- `GET/POST /api/memory/entries` - CRUD operations for memories
- `GET /api/memory/search` - Search memories
- `GET /api/memory/stats` - Memory statistics

### Agent API
- `GET/POST /api/agents` - Agent management
- `GET /api/agents/system-metrics` - System-wide metrics
- `GET /api/agents/{id}/logs` - Agent activity logs

### MCP API
- `GET/POST /api/mcp/tools` - Tool management
- `POST /api/mcp/execute` - Execute tools

## Configuration

### Environment Variables
Create a `.env.local` file for custom configuration:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### Sample Data
The dashboard comes with sample data pre-loaded:
- 3 sample agents (Research Assistant, Code Assistant, Data Analyst)
- 5 sample memory entries with different types and categories
- 4 sample MCP tools for different purposes

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run type-check
```

### Building for Production
```bash
npm run build
npm start
```

### Adding New Features

1. **API Routes**: Add new endpoints in `src/app/api/`
2. **Components**: Create reusable components in `src/components/`
3. **Types**: Define TypeScript types in `src/lib/types.ts`
4. **Storage**: Extend storage operations in `src/lib/storage.ts`

## Limitations (MVP)

- **No Authentication**: Designed for personal/local use only
- **File-based Storage**: No database integration (by design)
- **Simulated Real-time**: Chat responses are mocked
- **No Mobile Support**: Desktop/laptop optimized only
- **Local Development**: Not intended for production deployment

## Future Enhancements

- Integration with real AI agent services
- WebSocket support for true real-time communication
- Database integration option
- User authentication system
- Mobile responsive design
- Advanced search and filtering
- Export/import functionality
- Integration with external monitoring services

## License

This project is built for personal use and development purposes.

## Contributing

This is a personal dashboard project. Feel free to fork and customize for your own needs.

---

**Version**: 1.0.0
**Built with**: Next.js 14, TypeScript, Tailwind CSS
**Last Updated**: September 2025