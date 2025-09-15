# Tasks: Spec Kit Dashboard - MVP Version

**Input**: Design documents from `/specs/001-spec-kit-dashboard/`
**Prerequisites**: plan.md, data-model.md, contracts/, quickstart.md
**Context**: Create an MVP version of this application so we can test it locally

## Execution Summary
Based on analysis of available documents:
- **Tech Stack**: Next.js 14+ App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Storage**: File-based JSON (no database)
- **Testing**: Jest + React Testing Library
- **API Contracts**: 4 contract files (chat, memory, agents, mcp)
- **Core Entities**: 6 main data models
- **MVP Focus**: Local testing capability with core dashboard features

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Project Initialization
- [ ] T001 Create Next.js project structure with TypeScript and required directories
- [ ] T002 Install and configure dependencies (Next.js, Tailwind, shadcn/ui, TypeScript)
- [ ] T003 [P] Configure ESLint, Prettier, and Jest testing framework
- [ ] T004 [P] Create data directory structure for file-based storage
- [ ] T005 [P] Set up shadcn/ui component library and Tailwind configuration

## Phase 3.2: Data Models & Types (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T006 [P] Create TypeScript interfaces in `src/lib/types.ts` for all entities
- [ ] T007 [P] Contract test Chat API endpoints in `tests/contract/chat-api.test.ts`
- [ ] T008 [P] Contract test Memory API endpoints in `tests/contract/memory-api.test.ts`
- [ ] T009 [P] Contract test Agents API endpoints in `tests/contract/agents-api.test.ts`
- [ ] T010 [P] Contract test MCP API endpoints in `tests/contract/mcp-api.test.ts`
- [ ] T011 [P] Integration test for main dashboard view in `tests/integration/dashboard.test.ts`
- [ ] T012 [P] Integration test for chat interface in `tests/integration/chat.test.ts`
- [ ] T013 [P] Integration test for memory management in `tests/integration/memory.test.ts`

## Phase 3.3: Storage Layer (ONLY after tests are failing)
- [ ] T014 [P] File storage service in `src/lib/storage.ts` with CRUD operations
- [ ] T015 [P] Data validation utilities in `src/lib/validation.ts` using Zod
- [ ] T016 [P] Error handling utilities in `src/lib/errors.ts`
- [ ] T017 Initialize empty JSON data files in `data/` directory structure

## Phase 3.4: API Routes Implementation
- [ ] T018 [P] Chat sessions API route in `src/app/api/chat/sessions/route.ts`
- [ ] T019 [P] Chat messages API route in `src/app/api/chat/messages/route.ts`
- [ ] T020 [P] Memory entries API route in `src/app/api/memory/entries/route.ts`
- [ ] T021 [P] Memory search API route in `src/app/api/memory/search/route.ts`
- [ ] T022 [P] Agents management API route in `src/app/api/agents/route.ts`
- [ ] T023 [P] MCP tools API route in `src/app/api/mcp/tools/route.ts`
- [ ] T024 [P] System metrics API route in `src/app/api/agents/system-metrics/route.ts`
- [ ] T025 Server-Sent Events route for real-time updates in `src/app/api/chat/stream/route.ts`

## Phase 3.5: Core UI Components
- [ ] T026 [P] Navigation component in `src/components/Navigation.tsx`
- [ ] T027 [P] Dashboard overview component in `src/components/Dashboard.tsx`
- [ ] T028 [P] Chat interface component in `src/components/ChatInterface.tsx`
- [ ] T029 [P] Memory manager component in `src/components/MemoryManager.tsx`
- [ ] T030 [P] Agent list component in `src/components/AgentList.tsx`
- [ ] T031 [P] MCP tools component in `src/components/MCPTools.tsx`
- [ ] T032 [P] System metrics display component in `src/components/SystemMetrics.tsx`

## Phase 3.6: Page Routes & Layout
- [ ] T033 Main layout with navigation in `src/app/layout.tsx`
- [ ] T034 Dashboard home page in `src/app/page.tsx`
- [ ] T035 Chat page in `src/app/chat/page.tsx`
- [ ] T036 Memory page in `src/app/memory/page.tsx`
- [ ] T037 Agents page in `src/app/agents/page.tsx`
- [ ] T038 MCP page in `src/app/mcp/page.tsx`

## Phase 3.7: Essential Features for MVP
- [ ] T039 Dark mode toggle functionality with browser persistence
- [ ] T040 Real-time updates using Server-Sent Events client
- [ ] T041 Error boundaries and error handling UI
- [ ] T042 Loading states and skeleton components
- [ ] T043 File upload handling for chat attachments
- [ ] T044 Memory search with filtering capabilities

## Phase 3.8: MVP Testing & Validation
- [ ] T045 [P] Unit tests for storage utilities in `tests/unit/storage.test.ts`
- [ ] T046 [P] Unit tests for validation functions in `tests/unit/validation.test.ts`
- [ ] T047 [P] Component tests for main UI components in `tests/components/`
- [ ] T048 End-to-end test following quickstart scenarios in `tests/e2e/quickstart.test.ts`
- [ ] T049 Performance testing to meet <2s page load requirement
- [ ] T050 Manual testing checklist execution from quickstart.md

## Dependencies
- Setup (T001-T005) before everything else
- Data models (T006) before API contracts (T007-T010)
- Storage layer (T014-T017) before API routes (T018-T025)
- API routes before UI components (T026-T032)
- UI components before pages (T033-T038)
- Core features (T039-T044) after pages
- Testing (T045-T050) after implementation

## Parallel Execution Examples
```bash
# Phase 3.2: Run all contract tests together
Task: "Contract test Chat API endpoints in tests/contract/chat-api.test.ts"
Task: "Contract test Memory API endpoints in tests/contract/memory-api.test.ts"
Task: "Contract test Agents API endpoints in tests/contract/agents-api.test.ts"
Task: "Contract test MCP API endpoints in tests/contract/mcp-api.test.ts"

# Phase 3.4: Run API route implementations in parallel
Task: "Chat sessions API route in src/app/api/chat/sessions/route.ts"
Task: "Memory entries API route in src/app/api/memory/entries/route.ts"
Task: "Agents management API route in src/app/api/agents/route.ts"
Task: "MCP tools API route in src/app/api/mcp/tools/route.ts"

# Phase 3.5: Run UI component development in parallel
Task: "Navigation component in src/components/Navigation.tsx"
Task: "Dashboard overview component in src/components/Dashboard.tsx"
Task: "Chat interface component in src/components/ChatInterface.tsx"
Task: "Memory manager component in src/components/MemoryManager.tsx"
```

## MVP Validation Checklist
*Ensures MVP can be tested locally*

- [ ] ✅ Next.js dev server starts successfully (`npm run dev`)
- [ ] ✅ All pages load without errors (/, /chat, /memory, /agents, /mcp)
- [ ] ✅ File-based storage works (create/read/update operations)
- [ ] ✅ API endpoints respond correctly (all contract tests pass)
- [ ] ✅ Basic UI interactions work (navigation, forms, buttons)
- [ ] ✅ Dark mode toggle functions properly
- [ ] ✅ Error handling displays user-friendly messages
- [ ] ✅ Real-time features establish SSE connections
- [ ] ✅ Performance meets <2s page load requirement
- [ ] ✅ Quickstart scenarios complete successfully

## File Structure (MVP)
```
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   ├── sessions/route.ts
│   │   │   ├── messages/route.ts
│   │   │   └── stream/route.ts
│   │   ├── memory/
│   │   │   ├── entries/route.ts
│   │   │   └── search/route.ts
│   │   ├── agents/
│   │   │   ├── route.ts
│   │   │   └── system-metrics/route.ts
│   │   └── mcp/
│   │       └── tools/route.ts
│   ├── chat/page.tsx
│   ├── memory/page.tsx
│   ├── agents/page.tsx
│   ├── mcp/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Navigation.tsx
│   ├── Dashboard.tsx
│   ├── ChatInterface.tsx
│   ├── MemoryManager.tsx
│   ├── AgentList.tsx
│   ├── MCPTools.tsx
│   └── SystemMetrics.tsx
└── lib/
    ├── types.ts
    ├── storage.ts
    ├── validation.ts
    ├── errors.ts
    └── utils.ts

tests/
├── contract/
├── integration/
├── unit/
├── components/
└── e2e/

data/
├── chat/
│   ├── sessions.json
│   └── messages/
├── memory/
│   └── entries.json
├── agents/
│   └── agents.json
├── mcp/
│   └── tools.json
└── logs/
```

## Notes for MVP Implementation
- **Focus on core functionality**: Dashboard overview, basic CRUD operations
- **Skip advanced features**: Complex real-time updates, advanced search, bulk operations
- **Use mock data**: Pre-populate some sample agents and memory entries for testing
- **Simplified error handling**: Basic error messages, no retry mechanisms
- **Minimal styling**: Use default shadcn/ui components, focus on functionality
- **No authentication**: Personal use as specified in requirements
- **Desktop-only**: No mobile responsive considerations for MVP

## Success Criteria for MVP
1. **Functional**: All basic CRUD operations work through the UI
2. **Testable**: Can run `npm run dev` and interact with all features
3. **Data Persistence**: Changes persist in JSON files
4. **Navigation**: Can navigate between all pages
5. **Error Handling**: Graceful error messages for common failures
6. **Performance**: Pages load quickly for local development