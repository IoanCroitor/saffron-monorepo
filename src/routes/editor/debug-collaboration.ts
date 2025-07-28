/**
 * Debug script for testing collaboration functionality
 * Run this in the browser console to test various collaboration features
 */

// Only run in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
	// Test collaboration functions
	(window as any).debugCollaboration = {
	// Test node movement broadcasting
	testNodeMovement: () => {
		console.log('🧪 Testing node movement broadcasting...');
		if ((window as any).broadcastNodeMovement) {
			(window as any).broadcastNodeMovement('test-node-1', { x: 150, y: 250 });
			console.log('✅ Node movement broadcasted');
		} else {
			console.log('❌ broadcastNodeMovement not available');
		}
	},

	// Test node properties broadcasting
	testNodeProperties: () => {
		console.log('🧪 Testing node properties broadcasting...');
		if ((window as any).broadcastNodeProperties) {
			(window as any).broadcastNodeProperties('test-node-1', { 
				parameters: { 
					resistance: '5k', 
					tolerance: '10%' 
				} 
			});
			console.log('✅ Node properties broadcasted');
		} else {
			console.log('❌ broadcastNodeProperties not available');
		}
	},

	// Test component addition
	testComponentAddition: () => {
		console.log('🧪 Testing component addition...');
		if ((window as any).broadcastComponentAdded) {
			(window as any).broadcastComponentAdded('resistor', { x: 200, y: 300 }, 'test-resistor-2', {
				label: 'R2',
				parameters: { resistance: '10k' }
			});
			console.log('✅ Component addition broadcasted');
		} else {
			console.log('❌ broadcastComponentAdded not available');
		}
	},

	// Check collaboration state
	checkState: () => {
		console.log('🔍 Checking collaboration state...');
		console.log('isCollaborative:', (window as any).isCollaborative);
		console.log('isReadOnlyMode:', (window as any).isReadOnlyMode);
		console.log('currentUserId:', (window as any).currentUserId);
		console.log('nodesMap available:', !!(window as any).nodesMap);
		console.log('edgesMap available:', !!(window as any).edgesMap);
	},

	// Run all tests
	runAllTests: () => {
		console.log('🚀 Running all collaboration tests...');
		(window as any).debugCollaboration.checkState();
		(window as any).debugCollaboration.testNodeMovement();
		(window as any).debugCollaboration.testNodeProperties();
		(window as any).debugCollaboration.testComponentAddition();
		console.log('✅ All tests completed');
	}
};

	// Make collaboration functions globally available for testing
	// Try to get collaboration functions from the editor
	const editorElement = document.querySelector('[data-sveltekit-preload-data]');
	if (editorElement) {
		console.log('💡 Collaboration debug functions available. Run:');
		console.log('  debugCollaboration.runAllTests() - Run all tests');
		console.log('  debugCollaboration.testNodeMovement() - Test node movement');
		console.log('  debugCollaboration.testNodeProperties() - Test node properties');
		console.log('  debugCollaboration.checkState() - Check collaboration state');
	}
} 