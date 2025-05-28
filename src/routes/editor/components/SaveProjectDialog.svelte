<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { circuitStore } from '../stores/circuit-store';
	import { currentUser } from '$lib/stores/auth';

	let { show = $bindable(false), currentProjectId = null, currentName = '' } = $props();

	const dispatch = createEventDispatcher();

	let projectName = $state('');
	let projectDescription = $state('');
	let isLoading = $state(false);
	let error = $state('');

	// Initialize form with current project data when dialog opens
	$effect(() => {
		if (show) {
			projectName = currentName || '';
			projectDescription = '';
			error = '';
		}
	});

	async function handleSave() {
		if (!projectName.trim()) {
			error = 'Project name is required';
			return;
		}

		if (!$currentUser) {
			error = 'You must be logged in to save projects';
			return;
		}

		isLoading = true;
		error = '';

		try {
			let result;
			if (currentProjectId) {
				// Update existing project
				result = await circuitStore.updateCircuit(currentProjectId, projectName, projectDescription);
			} else {
				// Create new project
				result = await circuitStore.saveCircuit(projectName, projectDescription, $currentUser.id);
			}

			if (result.success) {
				dispatch('projectSaved', {
					projectId: result.project.id,
					name: projectName,
					description: projectDescription
				});
			} else {
				error = result.error || 'Failed to save project';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			show = false;
		}
	}

	function handleCancel() {
		show = false;
	}
</script>

{#if show}
	<div class="save-project-dialog-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
		<div class="save-project-dialog">
			<div class="p-6">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
					{currentProjectId ? 'Update Project' : 'Save Circuit Project'}
				</h2>
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
					{currentProjectId ? 'Update your circuit project details.' : 'Save your circuit design as a new project.'}
				</p>

				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="project-name">Project Name</Label>
						<Input
							id="project-name"
							bind:value={projectName}
							placeholder="Enter project name..."
							disabled={isLoading}
						/>
					</div>

					<div class="space-y-2">
						<Label for="project-description">Description (optional)</Label>
						<textarea
							id="project-description"
							bind:value={projectDescription}
							placeholder="Describe your circuit..."
							rows="3"
							disabled={isLoading}
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						></textarea>
					</div>

					{#if error}
						<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
							<p class="text-sm text-red-700 dark:text-red-400">{error}</p>
						</div>
					{/if}

					{#if !$currentUser}
						<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
							<p class="text-sm text-amber-700 dark:text-amber-400">
								You need to be logged in to save projects. 
								<a href="/login" class="underline hover:no-underline">Sign in here</a>.
							</p>
						</div>
					{/if}
				</div>

				<div class="flex justify-end space-x-3 mt-6">
					<Button
						variant="outline"
						onclick={handleCancel}
						disabled={isLoading}
						class="flex-1"
					>
						Cancel
					</Button>
					<Button
						onclick={handleSave}
						disabled={isLoading || !$currentUser}
						class="flex-1"
					>
						{#if isLoading}
							Saving...
						{:else}
							{currentProjectId ? 'Update' : 'Save'}
						{/if}
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.save-project-dialog-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.save-project-dialog {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
		min-width: 400px;
		max-width: 90vw;
		max-height: 90vh;
		overflow-y: auto;
	}

	:global(.dark) .save-project-dialog {
		background: #1f2937;
		border: 1px solid #374151;
	}
</style>
