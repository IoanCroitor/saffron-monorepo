<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Copy, Users, Share2, Check } from '@lucide/svelte';
	import { fade, scale } from 'svelte/transition';
	
	const dispatch = createEventDispatcher();
	
	export let isOpen = false;
	export let projectId: string = '';
	export let collaboratorCount = 0;
	
	let joinCode = '';
	let copySuccess = false;
	let shareSuccess = false;
	let isJoining = false;
	let joinError = '';
	
	async function copyProjectId() {
		try {
			await navigator.clipboard.writeText(projectId);
			copySuccess = true;
			setTimeout(() => copySuccess = false, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
	
	async function copyJoinLink() {
		const url = `${window.location.origin}/editor?id=${projectId}`;
		try {
			await navigator.clipboard.writeText(url);
			shareSuccess = true;
			setTimeout(() => shareSuccess = false, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
	
	async function joinWithCode() {
		if (!joinCode.trim()) return;
		
		isJoining = true;
		joinError = '';
		
		try {
			// Use the entered code as the project ID directly
			let targetProjectId = joinCode.trim();
			
			// Dispatch join event with project ID
			dispatch('join', { projectId: targetProjectId });
			
			// Close dialog
			isOpen = false;
			joinCode = '';
		} catch (error) {
			joinError = 'Invalid project ID. Please check and try again.';
		} finally {
			isJoining = false;
		}
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			joinWithCode();
		}
	}
</script>

<Dialog bind:open={isOpen}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Users class="h-5 w-5" />
				Collaborative Session
			</DialogTitle>
		</DialogHeader>
		
		<div class="space-y-6">
			<!-- Current Session Info -->
			{#if projectId}
				<div class="space-y-4">
					<div class="flex items-center gap-2">
						<Badge variant="secondary" class="flex items-center gap-1">
							<Users class="h-3 w-3" />
							{collaboratorCount} Active
						</Badge>
					</div>
					
					<!-- Project ID -->
					<div class="space-y-2">
						<label class="text-sm font-medium">Project ID</label>
						<div class="flex items-center gap-2">
							<Input
								value={projectId}
								readonly
								class="font-mono text-sm tracking-wider"
							/>
							<Button
								variant="outline"
								size="sm"
								on:click={copyProjectId}
								class="copy-btn p-2 transition-all duration-200 hover:scale-105 active:scale-95"
							>
								{#if copySuccess}
									<div in:scale={{ duration: 150 }} out:scale={{ duration: 150 }}>
										<Check class="h-4 w-4 text-green-600" />
									</div>
								{:else}
									<div in:scale={{ duration: 150 }} out:scale={{ duration: 150 }}>
										<Copy class="h-4 w-4" />
									</div>
								{/if}
							</Button>
						</div>
						<p class="text-xs text-muted-foreground">
							Share this project ID with others to join your session
						</p>
					</div>
					
					<!-- Share Link -->
					<div class="space-y-2">
						<label class="text-sm font-medium">Share Link</label>
						<div class="flex items-center gap-2">
							<Input
								value="{window.location.origin}/editor?id={projectId}"
								readonly
								class="text-sm"
							/>
							<Button
								variant="outline"
								size="sm"
								on:click={copyJoinLink}
								class="share-btn p-2 transition-all duration-200 hover:scale-105 active:scale-95"
							>
								{#if shareSuccess}
									<div in:scale={{ duration: 150 }} out:scale={{ duration: 150 }}>
										<Check class="h-4 w-4 text-green-600" />
									</div>
								{:else}
									<div in:scale={{ duration: 150 }} out:scale={{ duration: 150 }}>
										<Share2 class="h-4 w-4" />
									</div>
								{/if}
							</Button>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Join Another Session -->
			<div class="border-t pt-4">
				<div class="space-y-3">
					<h4 class="font-medium">Join Another Session</h4>
					<div class="space-y-2">
						<Input
							bind:value={joinCode}
							placeholder="Enter project ID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
							class="font-mono text-center tracking-wider text-sm"
							on:keydown={handleKeyDown}
						/>
						{#if joinError}
							<p class="text-sm text-red-600" in:fade={{ duration: 200 }}>{joinError}</p>
						{/if}
					</div>
					<Button
						on:click={joinWithCode}
						disabled={!joinCode.trim() || isJoining}
						class="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
					>
						{#if isJoining}
							Joining...
						{:else}
							Join Session
						{/if}
					</Button>
				</div>
			</div>
		</div>
	</DialogContent>
</Dialog>

<style>
	:global(.font-mono) {
		font-family: 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
	}
	
	.copy-btn, .share-btn {
		position: relative;
		overflow: hidden;
	}
	
	.copy-btn::before, .share-btn::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		background: rgba(34, 197, 94, 0.2);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		transition: width 0.3s ease, height 0.3s ease;
	}
	
	.copy-btn:active::before, .share-btn:active::before {
		width: 100%;
		height: 100%;
	}
</style>
