# YJS Integration Test Guide

## Prerequisites

1. **YJS Server Running**: Make sure your YJS server is running on `ws://localhost:1234`
2. **App Running**: Start your Svelte app with `npm run dev`

## Testing Steps

### 1. Start the YJS Server
```bash
# Navigate to your YJS server directory
cd yjs-server

# Start the server
npm start
```

### 2. Start the Saffron App
```bash
# In another terminal, start the Saffron app
npm run dev
```

### 3. Test Collaboration

1. **Open the browser console** in your Saffron app
2. **Run the test function**:
   ```javascript
   import('./src/routes/editor/services/collaboration-test.js').then(module => {
     module.testYjsCollaboration();
   });
   ```

3. **Check the console output** - you should see:
   - ✅ Collaboration initialized
   - ✅ Node movement broadcasted
   - ✅ Component addition broadcasted
   - ✅ Callback system working

### 4. Test Real-time Collaboration

1. **Open two browser tabs** with the same project URL
2. **Add components** in one tab
3. **Watch them appear** in the other tab in real-time
4. **Move components** and see the movement sync
5. **Check cursor positions** - you should see other users' cursors

## Expected Behavior

- **Real-time sync**: Changes in one tab should appear in other tabs immediately
- **Cursor tracking**: You should see other users' cursors moving
- **No conflicts**: Multiple users can edit simultaneously without conflicts
- **Database persistence**: Changes are still saved to Supabase for persistence

## Troubleshooting

### Connection Issues
- Check that YJS server is running on port 1234
- Verify WebSocket connection in browser dev tools
- Check console for connection errors

### Sync Issues
- Ensure both tabs are on the same project ID
- Check that collaboration is enabled (should be automatic)
- Verify YJS room names match

### Performance Issues
- Collaboration uses throttling to prevent excessive updates
- Cursor updates are debounced to 50ms
- Large circuits may have slight delays

## Architecture Summary

- **YJS**: Handles real-time collaboration and conflict resolution
- **Supabase**: Handles database persistence and project management
- **Direct Arrays**: Local state uses Svelte's `$state` for reactivity
- **Callbacks**: Collaboration updates use callback functions for clean separation 