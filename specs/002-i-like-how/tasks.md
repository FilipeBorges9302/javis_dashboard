# Tasks: Chat History Removal

**Input**: Design documents from `/specs/002-i-like-how/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js App**: `src/app/`, `src/components/`, `tests/` at repository root
- All paths relative to `/Users/jorgefiliperibeirovieiraborges/Desktop/MyJavis/DashBoard/`

## Phase 3.1: Setup
- [ ] T001 Run existing tests to verify current state and establish baseline
- [ ] T002 [P] Add deletion confirmation types to `src/lib/types.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T003 [P] Contract test DELETE /api/chat/sessions/:id in `tests/contract/delete-session.test.ts` (already created - verify it fails)
- [ ] T004 [P] Contract test DELETE /api/chat/sessions (bulk) in `tests/contract/delete-session.test.ts` (already created - verify it fails)
- [ ] T005 [P] Component test for individual session deletion UI in `tests/integration/chat-delete-individual.test.tsx`
- [ ] T006 [P] Component test for bulk deletion UI in `tests/integration/chat-delete-bulk.test.tsx`
- [ ] T007 [P] Component test for deletion confirmation dialogs in `tests/integration/chat-delete-confirmation.test.tsx`
- [ ] T008 [P] Component test for current session deletion handling in `tests/integration/chat-delete-current.test.tsx`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 Add bulk DELETE endpoint to `src/app/api/chat/sessions/route.ts` (individual DELETE already exists)
- [ ] T010 Add deletion confirmation state management to `src/components/ChatInterface.tsx`
- [ ] T011 Add delete session functions to `src/components/ChatInterface.tsx`
- [ ] T012 Add delete button UI to session list items in `src/components/ChatInterface.tsx`
- [ ] T013 Add confirmation dialog UI to `src/components/ChatInterface.tsx`
- [ ] T014 Add bulk delete UI option to `src/components/ChatInterface.tsx`
- [ ] T015 Add error handling for deletion failures in `src/components/ChatInterface.tsx`
- [ ] T016 Add optimistic UI updates and rollback logic in `src/components/ChatInterface.tsx`

## Phase 3.4: Integration
- [ ] T017 Add current session handling logic (auto-switch after deletion) in `src/components/ChatInterface.tsx`
- [ ] T018 Add empty state handling when no sessions remain in `src/components/ChatInterface.tsx`
- [ ] T019 Add loading states and visual feedback during deletion in `src/components/ChatInterface.tsx`
- [ ] T020 Test API endpoints with actual file system operations

## Phase 3.5: Polish
- [ ] T021 [P] Add unit tests for deletion utility functions in `tests/unit/deletion-utils.test.ts`
- [ ] T022 [P] Performance test deletion operations (< 5 seconds) in `tests/performance/deletion-performance.test.ts`
- [ ] T023 Run manual testing scenarios from `specs/002-i-like-how/quickstart.md`
- [ ] T024 [P] Update error messaging for user-friendly deletion feedback
- [ ] T025 Verify deletion operations work across page refreshes (persistence test)
- [ ] T026 Code review and cleanup - remove any console.logs, ensure proper TypeScript types

## Dependencies
- Tests (T003-T008) before implementation (T009-T016)
- T002 (types) before T010-T016 (implementation using those types)
- T009 (API endpoint) before T010-T016 (UI using the API)
- T010-T016 (core implementation) before T017-T019 (integration)
- Implementation (T009-T019) before polish (T021-T026)

## Parallel Example
```bash
# Launch T003-T008 together (all different test files):
Task: "Verify contract test DELETE /api/chat/sessions/:id fails in tests/contract/delete-session.test.ts"
Task: "Component test individual session deletion UI in tests/integration/chat-delete-individual.test.tsx"
Task: "Component test bulk deletion UI in tests/integration/chat-delete-bulk.test.tsx"
Task: "Component test deletion confirmation dialogs in tests/integration/chat-delete-confirmation.test.tsx"
Task: "Component test current session deletion handling in tests/integration/chat-delete-current.test.tsx"

# Launch T021-T022 together (different test categories):
Task: "Unit tests for deletion utilities in tests/unit/deletion-utils.test.ts"
Task: "Performance test deletion operations in tests/performance/deletion-performance.test.ts"
```

## Implementation Notes

### Key Technical Decisions from Research
- **Leverage existing DELETE API**: `/api/chat/sessions/[sessionId]` already implemented with cascade deletion
- **Extend ChatInterface component**: Single-component architecture maintains simplicity
- **Use native confirm()**: Initially for confirmation dialogs, can upgrade to modal later
- **Follow existing patterns**: State management with React hooks, error handling with try-catch

### File Modification Strategy
- **Most changes in ChatInterface.tsx**: Sequential tasks (T010-T019) due to same file
- **Separate test files**: Parallel tasks (T003-T008, T021-T022) for different files
- **New API endpoint**: Only bulk DELETE needed, individual DELETE exists

### Testing Strategy
- **Contract tests**: Verify API responses match OpenAPI specification
- **Component tests**: Verify UI behavior and state changes
- **Integration tests**: Verify end-to-end deletion flows
- **Manual tests**: Follow quickstart.md scenarios

## Task Generation Rules Applied

1. **From Contracts** (`contracts/delete-session.json`):
   - Individual DELETE endpoint → T003 contract test (already exists, verify failure)
   - Bulk DELETE endpoint → T004 contract test + T009 implementation

2. **From Data Model** (`data-model.md`):
   - DeletionConfirmation state → T002 types + T010 state management
   - Extended ChatInterface functions → T011-T016 implementation

3. **From User Stories** (`quickstart.md`):
   - Individual deletion → T005 integration test
   - Bulk deletion → T006 integration test
   - Confirmation flow → T007 integration test
   - Current session handling → T008 integration test

4. **From Research** (`research.md`):
   - Use existing patterns → T010-T016 follow established conventions
   - File-based storage → T020 integration with existing storage layer

## Validation Checklist
*GATE: Checked before execution*

- [x] All contracts have corresponding tests (T003-T004)
- [x] All entities have implementation tasks (DeletionConfirmation → T002, T010)
- [x] All tests come before implementation (T003-T008 before T009-T019)
- [x] Parallel tasks truly independent (different files/test categories)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (ChatInterface tasks sequential)