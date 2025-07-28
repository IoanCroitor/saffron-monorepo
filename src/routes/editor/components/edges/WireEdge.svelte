<script lang="ts">
	import {
		BaseEdge,
		getStraightPath,
		getBezierPath,
		getSmoothStepPath,
		type EdgeProps
	} from '@xyflow/svelte';

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

	// Wire style configuration - made reactive with $derived
	const wireShape = $derived(data?.wireShape || 'straight'); // 'straight', 'bezier', 'smoothstep'
	const wireStyle = $derived(data?.wireStyle || 'solid'); // 'solid', 'dashed', 'dotted'
	const wireColor = $derived(data?.color || '#64748b'); // Default gray
	const wireWidth = $derived(selected ? 3 : 2);

	// Debug logging for wire data changes (only for selected wires to reduce noise)
	$effect(() => {
		if (selected) {
			console.log('[WireEdge] Selected wire data:', {
				id,
				wireShape,
				wireStyle,
				wireColor,
				data
			});
		}
	});

	// Generate path based on wire shape
	const [edgePath, labelX, labelY] = $derived(
		(() => {
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
		})()
	);

	// Generate stroke-dasharray based on wire style
	const strokeDasharray = $derived(
		wireStyle === 'dashed' ? '8,4' :
		wireStyle === 'dotted' ? '2,3' : 'none'
	);

	// Interactive functions
	function onEdgeClick() {
		console.log('Wire clicked:', { id, wireShape, wireStyle, data });
		// Using SvelteFlow's built-in onedgeclick instead of custom event
		// This prevents double selection handling that causes inconsistent state
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onEdgeClick();
		}
	}
</script>

<!-- Use BaseEdge with custom styling to prevent double rendering -->
<BaseEdge
	{id}
	path={edgePath}
	style="stroke: {selected ? '#3b82f6' : wireColor}; stroke-width: {wireWidth}; stroke-dasharray: {strokeDasharray}; cursor: pointer; transition: stroke-width 0.15s ease;"
	class={selected ? 'wire-selected' : ''}
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

<style>
	:global(.wire-selected) {
		animation: wire-pulse 1.5s ease-in-out infinite;
	}

	.wire-label {
		font-family: monospace;
		opacity: 0.8;
	}

	@keyframes wire-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
