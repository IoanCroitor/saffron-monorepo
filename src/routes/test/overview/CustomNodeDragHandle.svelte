<script lang="ts">
	import type { BuiltInNode, NodeProps } from '@xyflow/svelte';

	let { data = { label: 'Node' } }: NodeProps<BuiltInNode> = $props();
</script>

<div class="custom">
	<div>{data.label}</div>
	<div class="custom-drag-handle" style="width:15px;height:15px;background:#222;"></div>
</div>

<style>
	.custom {
		background: white;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 3px;
		font-size: 12px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}

	.custom-drag-handle {
		cursor: grab;
		border-radius: 2px;
	}

	.custom-drag-handle:active {
		cursor: grabbing;
	}
</style>
