# Collaborative Editing Developer Guide

## Architecture Overview

The collaborative editing system is built on three main layers:

1. **Database Layer**: Supabase with Realtime subscriptions
2. **Service Layer**: `collaboration.ts` manages real-time communication
3. **UI Layer**: Svelte components with reactive state management

## Key Files

- `/src/routes/editor/services/collaboration.ts` - Core collaboration logic
- `/src/routes/editor/stores/circuit-store.ts` - Circuit state management
- `/src/routes/editor/+page.svelte` - Main UI integration
- `/src/routes/editor/components/CollaborativeCursors.svelte` - Cursor visualization

## Adding New Collaborative Features

### 1. Adding New Broadcast Events

```typescript
// In collaboration.ts
export async function broadcastNewFeature(data: any) {
    if (!browser || !cursorChannel) return;
    
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await cursorChannel.send({
        type: 'broadcast',
        event: 'new_feature',
        payload: {
            ...data,
            userId: user.id,
            timestamp: new Date().toISOString()
        }
    });
}
```

### 2. Adding New Store Methods

```typescript
// In circuit-store.ts
yourNewMethodFromCollaborator: (data: any) => {
    // Update without triggering save (from collaborator)
    update(store => ({
        ...store,
        // your updates here
    }));
},
```

### 3. Adding Event Handlers

```typescript
// In collaboration.ts initCollaboration function
.on('broadcast', { event: 'new_feature' }, ({ payload }) => {
    handleNewFeatureBroadcast(payload);
})
```

## State Management Patterns

### Local vs Remote Updates

- **Local Updates**: Trigger auto-save and broadcast to others
- **Remote Updates**: Update UI without triggering save or broadcast

```typescript
// Local update (user action)
circuitStore.yourMethod(data);
if (isCollaborative) {
    broadcastYourEvent(data);
}

// Remote update (from collaborator)
function handleYourEventBroadcast(payload) {
    if (payload.userId === currentUserId) return; // Ignore own events
    circuitStore.yourMethodFromCollaborator(payload.data);
}
```

### Debouncing and Throttling

- **Cursor Updates**: 50ms throttle for performance
- **Auto-save**: 2-second debounce + 10-second interval
- **Component Updates**: Immediate for better UX

## Database Considerations

### Adding New Collaborative Tables

```sql
CREATE TABLE public.your_new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- your columns here
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.your_new_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "table_policy" ON public.your_new_table 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators 
      WHERE project_id = your_new_table.project_id 
      AND user_id = auth.uid()
    )
  );
```

### Realtime Subscriptions

```typescript
// Subscribe to table changes
const channel = supabase.channel('your-channel');
channel
  .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'your_table' },
      handleYourTableUpdate
  )
  .subscribe();
```

## Performance Best Practices

### 1. Minimize Database Writes
- Use debouncing for frequent updates
- Batch related operations
- Only save when necessary

### 2. Optimize Realtime Messages
- Keep payload sizes small
- Use efficient data structures
- Throttle high-frequency events

### 3. Memory Management
- Clean up subscriptions on unmount
- Remove stale presence data
- Limit stored cursor history

## Error Handling

### Network Issues
```typescript
try {
    await collaborativeOperation();
} catch (error) {
    // Graceful degradation
    console.warn('Collaborative feature failed:', error);
    // Continue with local-only operation
}
```

### Permission Errors
```typescript
const hasPermission = await hasEditRights(projectId);
if (!hasPermission) {
    // Show read-only mode
    isReadOnlyMode = true;
    return;
}
```

## Testing Collaborative Features

### Unit Tests
- Test store methods with mock data
- Verify event broadcasting
- Check permission validation

### Integration Tests
- Multi-window browser testing
- Network simulation (slow/offline)
- Permission boundary testing

### Manual Testing
1. Open multiple browser windows
2. Test all collaborative operations
3. Verify real-time updates
4. Check conflict resolution
5. Test permission boundaries

## Common Patterns

### User Identification
```typescript
// Get consistent user color
const userColor = getUserColor(userId);

// Generate unique IDs
const id = generateComponentId(type, userId);
```

### Presence Management
```typescript
// Track user action
await updateCursorAction('dragging', nodeId);

// Update cursor position
await cursorChannel.track({
    user_id: userId,
    position: { x, y },
    action: 'idle'
});
```

### State Synchronization
```typescript
// Check if update is from current user
if (payload.userId === currentUserId) return;

// Apply remote update
store.updateFromCollaborator(payload.data);
```

This architecture supports real-time collaboration while maintaining good performance and user experience.
