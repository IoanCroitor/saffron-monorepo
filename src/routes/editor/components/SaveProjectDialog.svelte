<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { circuitAPI } from '../services/circuit-api';
	import { page } from '$app/stores';

	interface Props {
		show: boolean;
		currentProjectId?: string | null;
		currentName?: string;
		nodes: any[];
		edges: any[];
	}

	let { show = $bindable(false), currentProjectId = null, currentName = '', nodes, edges }: Props = $props();

	const dispatch = createEventDispatcher();

	let projectName = $state('');
	let projectDescription = $state('');
	let isLoading = $state(false);
	let error = $state('');

	// Use only server-side auth from page data
	const user = $derived($page.data.user);
	const session = $derived($page.data.session);

	// Debug logging
	$effect(() => {
		console.log('SaveProjectDialog Auth Debug:', {
			user: !!user,
			session: !!session,
			show
		});
	});

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

		if (!user) {
			error = 'You must be logged in to save projects';
			return;
		}

		isLoading = true;
		error = '';

		try {
					let result;
		if (currentProjectId) {
			// Update existing project
			result = await circuitAPI.updateCircuit(
				currentProjectId,
				projectName,
				projectDescription,
				nodes,
				edges
			);
		} else {
			// Create new project
			result = await circuitAPI.saveCircuit(projectName, projectDescription, user.id, nodes, edges);
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
	<div
		class="save-project-dialog-backdrop"
		onclick={handleBackdropClick}
		onkeydown={(event) => event.key === 'Escape' && handleCancel()}
		role="dialog"
		aria-modal="true"
		tabindex="0"
	>
		<div class="save-project-dialog">
			<div class="p-6">
				<h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
					{currentProjectId ? 'Update Project' : 'Save Circuit Project'}
				</h2>
				<p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
					{currentProjectId
						? 'Update your circuit project details.'
						: 'Save your circuit design as a new project.'}
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
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						></textarea>
					</div>

					{#if error}
						<div
							class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
						>
							<p class="text-sm text-red-700 dark:text-red-400">{error}</p>
						</div>
					{/if}

					{#if !user}
						<div
							class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
						>
							<p class="text-sm text-amber-700 dark:text-amber-400">
								You need to be logged in to save projects.
								<a href="/login" class="underline hover:no-underline">Sign in here</a>.
							</p>
						</div>
					{/if}
				</div>

				<div class="mt-6 flex justify-end space-x-3">
					<Button variant="outline" onclick={handleCancel} disabled={isLoading} class="flex-1">
						Cancel
					</Button>
					<Button onclick={handleSave} disabled={isLoading || !user} class="flex-1">
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
