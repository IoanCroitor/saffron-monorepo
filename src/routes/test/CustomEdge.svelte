<script lang="ts">
	import { getBezierPath, type EdgeProps } from '@xyflow/svelte';

	let {
		id,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		data
	}: EdgeProps = $props();

	let [edgePath, labelX, labelY] = $derived(
		getBezierPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition
		})
	);

	function onEdgeClick() {
		console.log('custom edge clicked:', data);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onEdgeClick();
		}
	}
</script>

<path {id} class="svelte-flow__edge-path" d={edgePath} stroke="#ff5050" stroke-width="2" />

<!-- Simple label without EdgeLabelRenderer -->
<text
	x={labelX}
	y={labelY}
	fill="#333"
	font-size="12"
	text-anchor="middle"
	dominant-baseline="central"
	onclick={onEdgeClick}
	onkeydown={onKeyDown}
	role="button"
	tabindex="0"
	style="cursor: pointer; user-select: none;"
>
	{data?.label || 'Custom Edge'}
</text>

<style>
	:global(.svelte-flow__edge-path) {
		stroke-width: 2;
	}
</style>
