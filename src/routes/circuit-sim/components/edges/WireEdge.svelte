<script lang="ts">
	import { BaseEdge, getStraightPath, getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/svelte';

	// Use Svelte 5 props syntax
	let {
		id,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		source,
		target,
		selected = false,
		data = {},
		...restProps
	}: EdgeProps = $props();

	// Wire style configuration
	const wireShape = data?.wireShape || 'straight'; // 'straight', 'bezier', 'smoothstep'
	const wireStyle = data?.wireStyle || 'solid'; // 'solid', 'dashed', 'dotted'
	const wireColor = data?.color || '#64748b'; // Default gray
	const wireWidth = selected ? 3 : 2;

	// Generate path based on wire shape
	const [edgePath, labelX, labelY] = $derived((() => {
		const pathParams = {
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition
		};

		switch (wireShape) {
			case 'bezier':
				return getBezierPath(pathParams);
			case 'smoothstep':
				return getSmoothStepPath(pathParams);
			case 'straight':
			default:
				const [path] = getStraightPath({
					sourceX,
					sourceY,
					targetX,
					targetY
				});
				// Calculate label position for straight lines
				const midX = (sourceX + targetX) / 2;
				const midY = (sourceY + targetY) / 2;
				return [path, midX, midY];
		}
	})());

	// Generate stroke-dasharray based on wire style
	const strokeDasharray = $derived(() => {
		switch (wireStyle) {
			case 'dashed':
				return '8,4';
			case 'dotted':
				return '2,3';
			case 'solid':
			default:
				return 'none';
		}
	});

	// Animation for selected wires
	const animationClass = $derived(selected ? 'wire-selected' : '');

	// Interactive functions
	function onEdgeClick() {
		console.log('Wire clicked:', { id, wireShape, wireStyle, data });
		// Dispatch event to parent for wire selection
		const event = new CustomEvent('wireSelected', {
			detail: { 
				id, 
				source,
				target,
				sourceHandle: restProps.sourceHandleId,
				targetHandle: restProps.targetHandleId,
				data,
				type: 'wire'
			}
		});
		document.dispatchEvent(event);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onEdgeClick();
		}
	}
</script>

<!-- Wire path with interactive styling -->
<path
	{id}
	class="wire-path {animationClass}"
	d={edgePath}
	stroke={selected ? '#3b82f6' : wireColor}
	stroke-width={wireWidth}
	stroke-dasharray={strokeDasharray()}
	fill="none"
	marker-end={selected ? 'url(#selected-arrow)' : 'url(#arrow)'}
	onclick={onEdgeClick}
	onkeydown={onKeyDown}
	role="button"
	tabindex="0"
/>

<!-- Optional wire label for debugging or properties -->
{#if data?.label || selected}
	<text
		x={labelX}
		y={labelY}
		fill={selected ? '#3b82f6' : '#6b7280'}
		font-size="10"
		text-anchor="middle"
		dominant-baseline="central"
		class="wire-label"
		style="pointer-events: none; user-select: none;"
	>
		{data?.label || (selected ? `${wireShape} wire` : '')}
	</text>
{/if}

<!-- Arrow markers for connection direction -->
<defs>
	<marker
		id="arrow"
		markerWidth="8"
		markerHeight="8"
		refX="7"
		refY="3"
		orient="auto"
		markerUnits="strokeWidth"
	>
		<path d="M0,0 L0,6 L7,3 z" fill={wireColor} />
	</marker>
	
	<marker
		id="selected-arrow"
		markerWidth="8"
		markerHeight="8"
		refX="7"
		refY="3"
		orient="auto"
		markerUnits="strokeWidth"
	>
		<path d="M0,0 L0,6 L7,3 z" fill="#3b82f6" />
	</marker>
</defs>

<style>
	.wire-path {
		cursor: pointer;
		transition: stroke-width 0.2s ease, stroke 0.2s ease;
	}
	
	.wire-path:hover {
		stroke-width: 3;
	}
	
	.wire-selected {
		animation: wire-pulse 1.5s ease-in-out infinite;
	}
	
	.wire-label {
		font-family: monospace;
		opacity: 0.8;
	}
	
	@keyframes wire-pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
	
	:global(.svelte-flow__edge-path) {
		transition: all 0.2s ease;
	}
</style>
