<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { createSupabaseBrowserClient } from '$lib/supabase';
	import { currentUser } from '$lib/stores/auth';
	
	let { show = $bindable(false) } = $props();
	
	const dispatch = createEventDispatcher();
	const client = createSupabaseBrowserClient();
	
	let projects = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedProject = $state<any>(null);
	
	onMount(() => {
		if (show) {
			loadProjects();
		}
	});
	
	$effect(() => {
		if (show) {
			loadProjects();
		}
	});
	
	async function loadProjects() {
		if (!$currentUser) {
			error = 'Please log in to load projects';
			loading = false;
			return;
		}
		
		loading = true;
		error = null;
		
		try {
			const { data, error: fetchError } = await client
				.from('projects')
				.select('id, name, description, component_count, updated_at, schematic_data')
				.eq('user_id', $currentUser.id)
				.eq('status', 'active')
				.not('schematic_data', 'is', null)
				.order('updated_at', { ascending: false });
			
			if (fetchError) {
				throw fetchError;
			}
			
			// Filter to only include circuit projects (ones with schematic_data)
			projects = data.filter(project => 
				project.schematic_data && 
				(project.schematic_data as any).nodes && 
				(project.schematic_data as any).nodes.length > 0
			);
		} catch (err) {
			console.error('Error loading projects:', err);
			error = err instanceof Error ? err.message : 'Failed to load projects';
		} finally {
			loading = false;
		}
	}
	
	function selectProject(project: any) {
		selectedProject = project;
	}
	
	function loadSelectedProject() {
		if (selectedProject) {
			dispatch('projectSelected', {
				projectId: selectedProject.id,
				name: selectedProject.name,
				description: selectedProject.description
			});
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			show = false;
		}
	}
</script>

{#if show}
	<div class="load-project-dialog-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
		<div class="load-project-dialog">
			<div class="p-6">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
					Load Circuit Project
				</h2>
				
				{#if loading}
					<div class="flex items-center justify-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<span class="ml-3 text-gray-600 dark:text-gray-400">Loading projects...</span>
					</div>
				{:else if error}
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
						<p class="text-red-700 dark:text-red-400">{error}</p>
					</div>
				{:else if projects.length === 0}
					<div class="text-center py-8">
						<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No circuit projects found</h3>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Create your first circuit to get started.</p>
					</div>
				{:else}
					<div class="space-y-2 max-h-64 overflow-y-auto">
						{#each projects as project}
							<button
								class="w-full text-left p-3 border rounded-lg transition-colors {selectedProject?.id === project.id 
									? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
									: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}"
								onclick={() => selectProject(project)}
							>
								<div class="flex justify-between items-start">
									<div class="flex-1">
										<h3 class="font-medium text-gray-900 dark:text-white">{project.name}</h3>
										{#if project.description}
											<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
										{/if}
										<div class="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
											<span>{project.component_count || 0} components</span>
											<span>Updated {formatDate(project.updated_at)}</span>
										</div>
									</div>
									{#if selectedProject?.id === project.id}
										<svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
										</svg>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
				
				<div class="flex justify-end space-x-3 mt-6">
					<Button
						variant="outline"
						onclick={() => show = false}
						class="flex-1"
					>
						Cancel
					</Button>
					<Button
						onclick={loadSelectedProject}
						disabled={!selectedProject}
						class="flex-1"
					>
						Load Project
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.load-project-dialog-backdrop {
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

	.load-project-dialog {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
		min-width: 480px;
		max-width: 90vw;
		max-height: 90vh;
		overflow-y: auto;
	}

	:global(.dark) .load-project-dialog {
		background: #1f2937;
		border: 1px solid #374151;
	}
</style>
