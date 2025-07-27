// Yjs WebSocket Server Configuration
// Update these settings to match your Docker server setup

export const YJS_CONFIG = {
	// WebSocket server URL - update this to match your Docker container
	wsUrl: 'ws://localhost:1234',

	// Optional: Authentication token if your server requires it
	// authToken: 'your-auth-token-here',

	// Connection retry settings
	maxRetries: 5,
	retryDelay: 1000, // milliseconds

	// Optional: Room prefix for organizing projects
	roomPrefix: 'saffron-project',

	// Cursor update throttling (milliseconds)
	cursorDebounceTime: 50
};

// For production, you might want to use environment variables:
// export const YJS_CONFIG = {
//   wsUrl: process.env.YJS_SERVER_URL || 'ws://localhost:1234',
//   authToken: process.env.YJS_AUTH_TOKEN,
//   // ... other settings
// };
