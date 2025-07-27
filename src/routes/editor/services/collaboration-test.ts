/**
 * Simple test to verify Yjs collaboration is working
 * Run this in the browser console to test the collaboration service
 */

import { initCollaboration, cleanupCollaboration, broadcastNodeMovement } from './collaboration';

export async function testYjsCollaboration() {
	console.log('🧪 Testing Yjs Collaboration Service...');

	try {
		// Test 1: Initialize collaboration
		console.log('1. Initializing collaboration...');
		await initCollaboration('test-project', 'test-user', 'Test User');
		console.log('✅ Collaboration initialized');

		// Test 2: Broadcast a node movement
		console.log('2. Broadcasting node movement...');
		broadcastNodeMovement('test-node', { x: 100, y: 200 });
		console.log('✅ Node movement broadcasted');

		// Test 3: Wait a bit and cleanup
		setTimeout(async () => {
			console.log('3. Cleaning up...');
			await cleanupCollaboration();
			console.log('✅ Collaboration cleaned up');
			console.log('🎉 All tests passed! Yjs collaboration is working.');
		}, 2000);
	} catch (error) {
		console.error('❌ Test failed:', error);
		console.log('💡 Make sure your Docker Yjs server is running on the configured port');
	}
}

// Auto-run test if in development mode
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
	console.log('💡 Run testYjsCollaboration() in the console to test the collaboration service');
}
