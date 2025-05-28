<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Copy, Users, Share2, Check } from '@lucide/svelte';
	
	const dispatch = createEventDispatcher();
	
	export let isOpen = false;
	export let projectId: string = '';
	export let collaboratorCount = 0;
	
	let joinCode = '';
	let copySuccess = false;
	let isJoining = false;
	let joinError = '';
	
	// Generate a readable join code based on project ID
	$: displayJoinCode = projectId ? generateJoinCode(projectId) : '';
	
	function generateJoinCode(projectId: string): string {
		// Create a short, readable code from project ID
		const hash = projectId.split('').reduce((acc, char) => {
			return ((acc << 5) - acc + char.charCodeAt(0)) & 0xfffff;
		}, 0);
		
		// Convert to base36 and pad to 6 characters
		return Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
	}
	
	function parseJoinCode(code: string): string | null {
		// For now, we'll need to store join code mappings
		// This is simplified - in production you'd have a database table
		// mapping join codes to project IDs
		return null;
	}
	
	async function copyJoinCode() {
		try {
			await navigator.clipboard.writeText(displayJoinCode);
			copySuccess = true;
			setTimeout(() => copySuccess = false, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
	
	async function copyJoinLink() {
		const url = `${window.location.origin}/editor?project=${projectId}`;
		try {
			await navigator.clipboard.writeText(url);
			copySuccess = true;
			setTimeout(() => copySuccess = false, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
	
	async function joinWithCode() {
		if (!joinCode.trim()) return;
		
		isJoining = true;
		joinError = '';
		
		try {
			// For now, we'll try to use the join code as a project ID directly
			// In a production system, you'd look up the project ID from the join code in a database
			let targetProjectId = joinCode.toLowerCase().trim();
			
			// If the join code looks like our generated format (6 chars, alphanumeric), 
			// we need to reverse-lookup the project ID
			if (/^[A-Z0-9]{6}$/i.test(joinCode)) {
				// For demo purposes, we'll assume the user enters the actual project ID
				// In production, implement proper join code to project ID mapping
				joinError = 'Please enter the full project ID for now. Join code lookup will be implemented in production.';
				return;
			}
			
			// Dispatch join event with project ID
			dispatch('join', { projectId: targetProjectId });
			
			// Close dialog
			isOpen = false;
			joinCode = '';
		} catch (error) {
			joinError = 'Invalid join code. Please check and try again.';
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
					
					<!-- Join Code -->
					<div class="space-y-2">
						<label class="text-sm font-medium">Join Code</label>
						<div class="flex items-center gap-2">
							<Input
								value={displayJoinCode}
								readonly
								class="font-mono text-lg tracking-wider text-center"
							/>
							<Button
								variant="outline"
								size="sm"
								on:click={copyJoinCode}
								class="p-2"
							>
								{#if copySuccess}
									<Check class="h-4 w-4 text-green-600" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</Button>
						</div>
						<p class="text-xs text-muted-foreground">
							Share this code with others to join your session
						</p>
					</div>
					
					<!-- Share Link -->
					<div class="space-y-2">
						<label class="text-sm font-medium">Share Link</label>
						<div class="flex items-center gap-2">
							<Input
								value="{window.location.origin}/editor?project={projectId}"
								readonly
								class="text-sm"
							/>
							<Button
								variant="outline"
								size="sm"
								on:click={copyJoinLink}
								class="p-2"
							>
								<Share2 class="h-4 w-4" />
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
							<p class="text-sm text-red-600">{joinError}</p>
						{/if}
					</div>
					<Button
						on:click={joinWithCode}
						disabled={!joinCode.trim() || isJoining}
						class="w-full"
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
</style>
