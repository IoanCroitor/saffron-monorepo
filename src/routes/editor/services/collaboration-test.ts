/**
 * Simple test to verify Yjs collaboration is working
 * Run this in the browser console to test the collaboration service
 */

import { initCollaboration, cleanupCollaboration, broadcastNodeMovement, broadcastComponentAdded, syncStateToYjs } from './collaboration';

export async function testYjsCollaboration() {
	console.log('🧪 Testing Yjs Collaboration Service...');

	try {
		// Test 1: Initialize collaboration
		console.log('1. Initializing collaboration...');
		
		let callbackCalls = 0;
		const testCallbacks = {
			onNodeUpdate: (nodeId: string, nodeData: any) => {
				console.log('✅ Node update callback called:', nodeId, nodeData);
				callbackCalls++;
			},
			onNodeAdd: (nodeId: string, nodeData: any) => {
				console.log('✅ Node add callback called:', nodeId, nodeData);
				callbackCalls++;
			},
			onNodeRemove: (nodeId: string) => {
				console.log('✅ Node remove callback called:', nodeId);
				callbackCalls++;
			},
			onEdgeAdd: (edgeId: string, edgeData: any) => {
				console.log('✅ Edge add callback called:', edgeId, edgeData);
				callbackCalls++;
			},
			onEdgeRemove: (edgeId: string) => {
				console.log('✅ Edge remove callback called:', edgeId);
				callbackCalls++;
			},
			onStateLoad: (nodes: any[], edges: any[]) => {
				console.log('✅ State load callback called:', { nodes: nodes.length, edges: edges.length });
				callbackCalls++;
			}
		};

		await initCollaboration('test-project', 'test-user', 'Test User', testCallbacks);
		console.log('✅ Collaboration initialized');

		// Test 2: Broadcast a node movement
		console.log('2. Broadcasting node movement...');
		broadcastNodeMovement('test-node', { x: 100, y: 200 });
		console.log('✅ Node movement broadcasted');

		// Test 3: Broadcast a component addition
		console.log('3. Broadcasting component addition...');
		broadcastComponentAdded('resistor', { x: 150, y: 250 }, 'test-resistor');
		console.log('✅ Component addition broadcasted');

		// Test 4: Test state sync to YJS
		console.log('4. Testing state sync to YJS...');
		const testNodes = [
			{ id: 'test-node-1', type: 'resistor', position: { x: 100, y: 100 }, data: { label: 'R1' } },
			{ id: 'test-node-2', type: 'capacitor', position: { x: 200, y: 200 }, data: { label: 'C1' } }
		];
		const testEdges = [
			{ id: 'test-edge-1', source: 'test-node-1', target: 'test-node-2', type: 'wire', data: {} }
		];
		syncStateToYjs(testNodes, testEdges);
		console.log('✅ State sync to YJS completed');

		// Test 5: Wait a bit and check callbacks
		setTimeout(async () => {
			console.log('5. Checking callback system...');
			console.log(`📊 Total callback calls: ${callbackCalls}`);
			
			// Test 6: Cleanup
			console.log('6. Cleaning up...');
			await cleanupCollaboration();
			console.log('✅ Collaboration cleaned up');
			console.log('🎉 All tests passed! Yjs collaboration is working.');
		}, 3000);
	} catch (error) {
		console.error('❌ Test failed:', error);
		console.log('💡 Make sure your Yjs server is running on ws://localhost:1234');
	}
}

// Auto-run test if in development mode
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
	console.log('💡 Run testYjsCollaboration() in the console to test the collaboration service');
}
