<script lang="ts">
import { activeCollaborators } from '../services/collaboration';
import { onDestroy } from 'svelte';
import { fade, fly } from 'svelte/transition';
import { get } from 'svelte/store';
import { page } from '$app/stores';

// Filter out the current user
$: userId = $page.data.session?.user?.id || '';
$: filteredCollaborators = Object.values($activeCollaborators).filter(c => c.userId !== userId);

// Clean up old cursors
let cleanupInterval: ReturnType<typeof setInterval>;

onDestroy(() => {
	if (cleanupInterval) clearInterval(cleanupInterval);
});

// Clean up cursors older than 30 seconds
function initCleanup() {
	cleanupInterval = setInterval(() => {
		const now = new Date();
		activeCollaborators.update(collabs => {
			const updated = { ...collabs };
			
			Object.entries(updated).forEach(([id, cursor]) => {
				const age = now.getTime() - cursor.lastUpdated.getTime();
				// Remove if older than 30 seconds
				if (age > 30000) {
					delete updated[id];
				}
			});
			
			return updated;
		});
	}, 5000); // Check every 5 seconds
}

// Initialize cleanup on component mount
initCleanup();
</script>

<div class="cursor-container">
	{#each filteredCollaborators as collaborator (collaborator.userId)}
		<div 
			class="cursor"
			style="transform: translate({collaborator.position.x}px, {collaborator.position.y}px); --cursor-color: {collaborator.color}"
			in:fade={{ duration: 200 }}
			out:fade={{ duration: 200 }}
		>
			<!-- Cursor triangle -->
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M1 1L8 14L10.5 7.5L15 5.5L1 1Z" fill={collaborator.color} stroke="#ffffff" stroke-width="1"/>
			</svg>
			
			<!-- User label with action status -->
			<div class="cursor-label" in:fly={{ y: -10, duration: 150 }}>
				{collaborator.name}
				{#if collaborator.action === 'dragging'}
					<span class="action-status">⟳</span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.cursor-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1000;
	}
	
	.cursor {
		position: absolute;
		top: 0;
		left: 0;
		transition: transform 0.1s ease;
		z-index: 1001;
		pointer-events: none;
	}
	
	.cursor-label {
		position: absolute;
		top: -24px;
		left: 8px;
		background-color: var(--cursor-color);
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 12px;
		white-space: nowrap;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
	}
</style>
