# Collaborative Editing Test Guide

## Setup Requirements

1. **Database Tables**: Ensure the following tables exist in your Supabase database:
   - `projects` (base table with `id`, `user_id`, `schematic_data`, etc.)
   - `profiles` (base table with `id`, `name`, etc.)
   - `project_collaborators` (created by `supabase-activity-setup.sql`)
   - `user_cursors` (created by `supabase-activity-setup.sql`)

2. **Realtime Enabled**: Make sure Supabase Realtime is enabled for the `projects` table.

## Test Steps

### Basic Collaborative Editing Test

1. **Open Two Browser Windows**:
   - Window 1: Load circuit editor with a project ID: `http://localhost:5173/editor?project=<project-id>`
   - Window 2: Load the same URL in an incognito/private window

2. **Test Real-time Cursor Movement**:
   - Move mouse in Window 1
   - Verify cursor appears in Window 2
   - Move mouse in Window 2
   - Verify cursor appears in Window 1

3. **Test Component Addition**:
   - Drag and drop a resistor component in Window 1
   - Verify the component appears in Window 2 instantly
   - Drag and drop a capacitor in Window 2
   - Verify it appears in Window 1

4. **Test Component Movement**:
   - Drag an existing component in Window 1
   - Verify it moves in real-time in Window 2
   - Check that the cursor shows "dragging" state

5. **Test Component Deletion**:
   - Select a component in Window 1 and press Delete
   - Verify it disappears from Window 2
   - Try the same from Window 2

6. **Test Auto-save**:
   - Make changes in Window 1
   - Wait 10 seconds
   - Refresh Window 2
   - Verify changes persist

## Expected Behaviors

- **Real-time Updates**: All changes should appear in other windows within 1-2 seconds
- **Collaborative Cursors**: Other users' cursors should be visible with different colors
- **Conflict Resolution**: Latest change wins for position conflicts
- **Auto-save**: Changes should auto-save every 10 seconds during collaborative sessions
- **Status Indicators**: Users should see "Collaborative mode" and collaborator count
- **Read-only Mode**: Users without edit rights should see "Read-only mode"

## Troubleshooting

1. **Cursors Not Appearing**: Check Supabase Realtime connection and presence channel
2. **Components Not Syncing**: Verify broadcast messages are being sent/received
3. **Auto-save Issues**: Check `pendingChanges` flag and project permissions
4. **Database Errors**: Ensure all foreign key relationships are properly set up

## Database Schema Check

Run this query to verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'profiles', 'project_collaborators', 'user_cursors');
```

## Realtime Check

Verify Realtime is enabled:
```sql
SELECT schemaname, tablename, pubname 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```
