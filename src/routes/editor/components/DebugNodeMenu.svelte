<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface Props {
		isVisible: boolean;
		nodes: any[];
		edges: any[];
		onExportJSON: () => string;
		onLoadFromJson?: (data: any) => void;
	}

	let { isVisible = $bindable(), nodes, edges, onExportJSON, onLoadFromJson }: Props = $props();

	const dispatch = createEventDispatcher();

	let jsonText = $state('');

	function refreshJson() {
		jsonText = onExportJSON();
	}

	function loadFromJson() {
		try {
			const data = JSON.parse(jsonText);
			if (onLoadFromJson) {
				onLoadFromJson(data);
			}
		} catch (error) {
			console.error('Invalid JSON:', error);
		}
	}

	// Auto-refresh when nodes/edges change
	$effect(() => {
		if (isVisible) {
			// Automatically refresh JSON when data changes
			refreshJson();
		}
	});

	function close() {
		dispatch('close');
	}
</script>

{#if isVisible}
	<!-- Debug overlay -->
	<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-lg font-semibold">Debug Menu</h2>
				<button onclick={close} class="text-gray-500 hover:text-gray-700">
					✕
				</button>
			</div>

			<div class="space-y-4">
				<div>
					<h3 class="font-medium mb-2">Circuit State</h3>
					<p>Nodes: {nodes.length}</p>
					<p>Edges: {edges.length}</p>
				</div>

				<div>
					<h3 class="font-medium mb-2">Export/Import JSON</h3>
					<div class="space-y-2">
						<button onclick={refreshJson} class="px-3 py-1 bg-blue-500 text-white rounded">
							Refresh JSON
						</button>
						<textarea 
							bind:value={jsonText} 
							class="w-full h-32 p-2 border rounded font-mono text-sm"
							placeholder="JSON data will appear here..."
						></textarea>
						<button onclick={loadFromJson} class="px-3 py-1 bg-green-500 text-white rounded">
							Load from JSON
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
