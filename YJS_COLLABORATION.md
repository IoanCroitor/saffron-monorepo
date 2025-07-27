# Yjs Real-time Collaboration

This project now uses **Yjs** for real-time collaboration instead of Supabase Realtime. Yjs provides a simpler, more efficient, and conflict-free approach to collaborative editing.

## Overview

The collaboration system allows multiple users to:

- View each other's cursors in real-time
- See component movements as they happen
- Add/remove components collaboratively
- Create/delete connections together
- Automatically sync circuit state

## Architecture

### Client Side (`src/routes/editor/services/collaboration.ts`)

- **Yjs Document**: Shared data structure that automatically syncs between clients
- **WebSocket Provider**: Handles network communication
- **Awareness**: Tracks user presence and cursor positions
- **Shared Maps**: Separate maps for nodes, edges, and user awareness

### Server Side (Docker Container)

- Uses your existing Docker Yjs WebSocket server
- Simple WebSocket server that relays Yjs updates between clients
- No complex logic - Yjs handles conflict resolution automatically
- Configured to connect to `ws://localhost:1234` (update as needed)

## Key Features

### 1. Real-time Synchronization

```typescript
// Broadcast node movement
broadcastNodeMovement(nodeId, { x: 100, y: 200 });

// Broadcast component addition
broadcastComponentAdded('resistor', { x: 50, y: 50 }, 'resistor_123');

// Update cursor position
updateCursorPosition({ x: 300, y: 150 }, 'dragging', 'nodeId');
```

### 2. Automatic Conflict Resolution

Yjs automatically handles conflicts when multiple users edit simultaneously. No need for complex merging logic.

### 3. Cursor Tracking

Real-time cursor positions with user information (name, color, current action).

### 4. Simple State Management

```typescript
// Initialize collaboration for a project
await initCollaboration(projectId, userId, userName);

// Clean up when leaving
await cleanupCollaboration();
```

## Setup Instructions

### 1. Configure Your Docker Server Connection

Update the settings in `src/routes/editor/services/collaboration-config.ts` to match your Docker setup:

```typescript
export const YJS_CONFIG = {
	wsUrl: 'ws://localhost:1234', // Update this to match your Docker container
	roomPrefix: 'saffron-project',
	cursorDebounceTime: 50
};
```

Make sure your Docker container with the Yjs WebSocket server is running and accessible on the configured port.

### 2. Initialize Collaboration in Your Component

```typescript
import { initCollaboration } from './services/collaboration';

// Initialize when project loads
onMount(async () => {
	await initCollaboration(projectId, currentUserId, currentUserName);
});
```

### 3. Use Collaboration Features

```typescript
// In your component, import the functions you need
import {
	broadcastNodeMovement,
	broadcastComponentAdded,
	updateCursorPosition,
	activeCollaborators,
	connectionState
} from './services/collaboration';

// Use reactive stores
$: collaborators = $activeCollaborators;
$: isConnected = $connectionState === 'connected';
```

## Differences from Supabase Realtime

### Advantages of Yjs:

1. **Automatic Conflict Resolution**: No manual merge logic needed
2. **Offline Support**: Changes are automatically synced when reconnected
3. **Better Performance**: More efficient for frequent updates
4. **Simpler Code**: Less boilerplate and error handling
5. **Type Safety**: Better TypeScript integration

### Removed Complexity:

- No more retry logic and exponential backoff
- No manual presence management
- No complex error handling for network issues
- No need for sequence numbers or timestamps for ordering
- No manual state synchronization

## Dependencies

```json
{
	"yjs": "^13.x.x",
	"y-websocket": "^1.x.x",
	"ws": "^8.x.x"
}
```

## WebSocket Server Configuration

The collaboration service connects to your Docker Yjs server on `ws://localhost:1234` by default.

To configure a different server:

1. Update the WebSocket URL in `src/routes/editor/services/collaboration.ts`
2. Ensure your Docker container exposes the correct port
3. For production, consider using SSL/TLS for `wss://` connections
4. Add authentication if needed for your specific setup

## API Reference

### Functions

- `initCollaboration(projectId, userId?, userName?)` - Initialize collaboration
- `cleanupCollaboration()` - Clean up connections
- `broadcastNodeMovement(nodeId, position)` - Broadcast node position
- `broadcastComponentAdded(type, position, id)` - Broadcast new component
- `broadcastComponentRemoved(id)` - Broadcast component removal
- `updateCursorPosition(position, action?, nodeId?)` - Update cursor
- `generateComponentId(type, userId?)` - Generate unique component ID

### Stores

### Stores

- `activeCollaborators` - Map of active users and their cursor data
- `connectionState` - Current connection status
- `userCollabInfo` - Current user's collaboration information

## Testing

To verify your Docker Yjs server is working correctly, you can use the test function in the browser console:

```typescript
import { testYjsCollaboration } from './services/collaboration-test';

// Run this in the browser console on the editor page
testYjsCollaboration();
```

This will test the basic collaboration functions and verify connectivity to your Docker server.

## Migration Notes

If upgrading from the Supabase Realtime implementation:

1. The API is mostly the same - most functions have the same signatures
2. Remove any manual error handling - Yjs handles this automatically
3. Simplify event handlers - no need for complex state management
4. Update imports to use the new collaboration service

The new implementation is much simpler while providing better reliability and performance.
