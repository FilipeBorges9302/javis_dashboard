# Data Model: Chat History Removal

## Extended Entities

### ChatSession (Extended)
**Purpose**: Existing entity with enhanced deletion capabilities
**Key Attributes**:
- `id: string` (UUID) - Existing
- `title: string` - Existing
- `agentId: string` - Existing
- `createdAt: Date` - Existing
- `updatedAt: Date` - Existing
- `messageCount: number` - Existing
- `lastMessage?: string` - Existing

**New Deletion Methods**:
- Individual deletion via existing DELETE API
- Cascade deletion of associated messages (already implemented)

**Validation Rules**:
- Session must exist before deletion
- User can only delete their own sessions (single-user app: all sessions)
- Deletion is permanent (no soft delete)

**State Transitions**:
```
ACTIVE_SESSION → DELETE_REQUESTED → DELETING → DELETED (removed from system)
                      ↓
                  CANCELLED (return to ACTIVE_SESSION)
```

### ChatMessage (Existing)
**Purpose**: Messages associated with sessions, automatically deleted with parent session
**Key Attributes**:
- `id: string` (UUID)
- `sessionId: string` (foreign key to ChatSession)
- `content: string`
- `role: 'user' | 'assistant'`
- `timestamp: Date`

**Deletion Behavior**:
- Cascade deleted when parent ChatSession is deleted
- No individual message deletion in this feature scope

### DeletionConfirmation (New)
**Purpose**: UI state management for deletion confirmation flow
**Key Attributes**:
- `sessionId: string | null` - Session being deleted (null for bulk delete)
- `type: 'single' | 'bulk'` - Type of deletion operation
- `isOpen: boolean` - Confirmation dialog state
- `isDeleting: boolean` - Operation in progress state

**State Transitions**:
```
IDLE → CONFIRM_SINGLE(sessionId) → DELETING → SUCCESS/ERROR → IDLE
  ↓
CONFIRM_BULK → DELETING → SUCCESS/ERROR → IDLE
  ↓
CANCELLED → IDLE
```

## API Data Contracts

### Individual Session Deletion (Existing)
**Endpoint**: `DELETE /api/chat/sessions/{sessionId}`
**Request**: Path parameter only
**Response**:
```typescript
{
  success: boolean;
  message?: string;
  error?: string;
}
```

### Bulk Session Deletion (New)
**Endpoint**: `DELETE /api/chat/sessions`
**Request Body**: None (delete all sessions for user)
**Response**:
```typescript
{
  success: boolean;
  deletedCount: number;
  message?: string;
  error?: string;
}
```

## Component State Extensions

### ChatInterface State (Extended)
**New State Properties**:
```typescript
const [deletionConfirm, setDeletionConfirm] = useState<DeletionConfirmation>({
  sessionId: null,
  type: 'single',
  isOpen: false,
  isDeleting: false
})
```

**New Functions**:
- `handleDeleteSession(sessionId: string)` - Initiate single session deletion
- `handleDeleteAllSessions()` - Initiate bulk deletion
- `confirmDeletion()` - Execute deletion after confirmation
- `cancelDeletion()` - Cancel deletion operation
- `onDeleteSuccess()` - Handle successful deletion (update UI state)
- `onDeleteError(error: string)` - Handle deletion errors

## Storage Layer Extensions

### File System Operations (Existing)
**ChatSessionStorage**: Already implements individual session deletion with cascade
**Required Extension**: Bulk delete method for clearing all sessions

### Data Integrity
- **Referential Integrity**: Messages automatically deleted with sessions (existing)
- **Atomic Operations**: File system operations wrapped in try-catch
- **Error Recovery**: Failed deletions leave system in consistent state

## UI State Management

### Session List State
- Remove deleted sessions from `sessions` array
- Handle empty state when no sessions remain
- Auto-select new session if current session deleted

### Current Session Handling
```typescript
// When current session is deleted:
if (currentSession?.id === deletedSessionId) {
  // Select next available session or create new one
  const remainingSessions = sessions.filter(s => s.id !== deletedSessionId)
  setCurrentSession(remainingSessions.length > 0 ? remainingSessions[0] : null)
  setMessages([])
}
```

### Loading States
- `deletionConfirm.isDeleting` - Show loading spinner during deletion
- Disable delete buttons during operation
- Provide visual feedback for user actions

## Error Handling Data

### Error Types
- `SessionNotFound` - Session doesn't exist
- `DeletionFailed` - File system or API error
- `NetworkError` - API request failed

### Error State Management
```typescript
interface DeletionError {
  type: 'session-not-found' | 'deletion-failed' | 'network-error';
  message: string;
  sessionId?: string;
}
```

### Recovery Actions
- Rollback optimistic UI updates on error
- Display user-friendly error messages
- Log detailed errors to console for debugging