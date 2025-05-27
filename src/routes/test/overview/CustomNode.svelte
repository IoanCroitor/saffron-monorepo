<script lang="ts">
	import {
		Handle,
		Position,
		useOnSelectionChange,
		type BuiltInNode,
		type NodeProps
	} from '@xyflow/svelte';

	let {
		data = { label: 'Node' },
		positionAbsoluteX = 0,
		positionAbsoluteY = 0
	}: NodeProps<BuiltInNode> = $props();

	useOnSelectionChange(({ nodes, edges }) => {
		console.log('on selection changed via hook', { nodes, edges });
	});
</script>

<div class="custom">
	
	<div>{~~positionAbsoluteX}, {~~positionAbsoluteY}</div>

	<Handle type="target" position={Position.Top} />

	<Handle type="source" position={Position.Bottom} style="left: 10%;" id="a" />
	<Handle type="source" position={Position.Bottom} id="b" />
	<Handle type="source" position={Position.Bottom} style="left: 90%;" id="c" />
</div>

<style>
	.custom {
		background: white;
		border: 1px solid #ddd;
		border-radius: 3px;
		font-size: 12px;
		padding: 10px;
		text-align: center;
	}

	.custom div:first-child {
		font-weight: bold;
		margin-bottom: 5px;
	}
</style>
