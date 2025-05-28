# Setting Up Real-time Collaboration in Saffron

This guide explains how to configure Supabase for real-time collaborative editing in the Saffron circuit simulator.

## 1. Configure Supabase Realtime

First, enable Supabase Realtime for your project:

1. Go to your Supabase dashboard
2. Navigate to Database > Replication
3. Enable the `supabase_realtime` publication
4. Add the `projects` table to the publication

## 2. Run the Database Setup Script

Run the SQL setup script (`supabase-activity-setup.sql`) in your Supabase SQL editor. This creates:

- Collaborative access control tables
- User cursor tracking
- Real-time update handling

## 3. Enable Database RLS Policies

Make sure Row Level Security is configured properly for your project tables:

1. Go to Authentication > Policies
2. Ensure policies are set up for `projects`, `project_collaborators`, and `user_cursors` tables
3. Verify that users can only access projects they own or have been invited to collaborate on

## 4. Test Collaboration

To test the collaborative editing:

1. Open a circuit in two different browsers or devices (both users must be logged in)
2. Make changes in one browser (drag components, add wires, etc.)
3. Observe the changes propagating to the other browser in real-time
4. Verify that user cursors appear when multiple users are editing
5. Test component dragging - you should see components move in real-time across all connected clients

## Troubleshooting

- If changes aren't syncing:
  - Check browser console for errors
  - Verify that Supabase Realtime is enabled
  - Check RLS policies are correct
  - Ensure users have proper permissions

- If cursors aren't appearing:
  - Verify the presence subscription is working
  - Check for JavaScript errors in the console
  - Make sure users are authenticated

## Security Considerations

- Only project owners can add/remove collaborators
- Read-only mode is enforced for viewers
- Cursor positions are only shared with active collaborators
- Old cursor data is automatically cleaned up after sessions end
