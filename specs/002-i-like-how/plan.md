# Implementation Plan: Chat History Removal

**Branch**: `002-i-like-how` | **Date**: 2025-09-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-i-like-how/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Adding chat history removal functionality to the existing @src/app/chat/ page. Users need the ability to delete individual chat sessions or clear all chat history with confirmation dialogs to prevent accidental data loss. This will integrate with the current ChatInterface component and extend the existing API endpoints.

## Technical Context
**Language/Version**: TypeScript with Next.js 14+ (from constitution)
**Primary Dependencies**: React 18+, Next.js App Router, Tailwind CSS, shadcn/ui
**Storage**: File-based or API-based chat sessions (based on existing /api/chat endpoints)
**Testing**: Jest + React Testing Library (inferred from Next.js standard)
**Target Platform**: Web application (local development environment)
**Project Type**: web (frontend + backend API routes)
**Performance Goals**: < 5 seconds for deletion operations (from spec)
**Constraints**: No external dependencies, file-based storage (per constitution)
**Scale/Scope**: Local development tool, single user, existing chat sessions

**User Context**: Add this feature to the @src/app/chat/ page

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (single Next.js app with frontend + API routes)
- Using framework directly? YES (Next.js App Router, React components)
- Single data model? YES (extend existing ChatSession/ChatMessage)
- Avoiding patterns? YES (direct API calls, no complex state management)

**Architecture**:
- EVERY feature as library? NO - Adding to existing app structure
- Libraries listed: N/A (extending existing ChatInterface)
- CLI per library: N/A (web UI feature)
- Library docs: N/A (integrated feature)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES
- Git commits show tests before implementation? YES
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (actual file system/API)
- Integration tests for: UI interactions, API endpoints, data persistence? YES
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES (console.error for failures)
- Frontend logs → backend? YES (error handling in UI)
- Error context sufficient? YES (user-facing error messages)

**Versioning**:
- Version number assigned? N/A (feature addition to existing app)
- BUILD increments on every change? N/A
- Breaking changes handled? N/A (additive feature)

## Project Structure

### Documentation (this feature)
```
specs/002-i-like-how/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Web application (frontend + backend API routes)
src/
├── app/
│   ├── api/chat/        # Existing API routes (extend for deletion)
│   └── chat/            # Target location for new delete functionality
├── components/
│   ├── ChatInterface.tsx # Main component to extend
│   └── ui/              # Existing UI components
└── lib/
    └── types.ts         # Extend existing types

tests/
├── contract/            # API contract tests
├── integration/         # Component integration tests
└── unit/                # Unit tests for utilities
```

**Structure Decision**: Web application (Option 2) - Next.js with frontend components + backend API routes

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - No NEEDS CLARIFICATION items - all technical context is clear

2. **Research existing chat implementation**:
   ```
   Task: "Analyze existing ChatInterface component structure and API endpoints"
   Task: "Research deletion patterns in React applications with confirmation dialogs"
   Task: "Identify testing patterns for destructive operations in Next.js"
   ```

3. **Consolidate findings** in `research.md`

**Output**: research.md with existing code analysis and deletion patterns

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Extend existing ChatSession with deletion methods
   - Add DeletionConfirmation state
   - Define deletion operation types

2. **Generate API contracts** from functional requirements:
   - DELETE /api/chat/sessions/:id (individual session deletion)
   - DELETE /api/chat/sessions (bulk deletion)
   - Output OpenAPI schemas to `/contracts/`

3. **Generate contract tests** from contracts:
   - Test DELETE endpoints return correct responses
   - Test error handling for non-existent sessions
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Individual session deletion flow
   - Bulk deletion with confirmation
   - Cancellation scenarios
   - Error handling scenarios

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/bash/update-agent-context.sh claude` for Claude Code
   - Add React testing patterns and deletion UI patterns
   - Update with new API endpoints and component structure

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API endpoint → contract test task [P]
- Each UI component → component test task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: API endpoints before UI components
- Mark [P] for parallel execution (independent API/UI tests)

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations identified.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*