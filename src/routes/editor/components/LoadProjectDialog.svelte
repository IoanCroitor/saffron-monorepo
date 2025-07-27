<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	export let show: boolean = false;
	export let projects: any[] = [];
	export let user: any = null;

	const dispatch = createEventDispatcher();
	let selectedProject: any = null;

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
	<div
		class="load-project-dialog-backdrop"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
	>
		<div class="load-project-dialog">
			<div class="p-6">
				<h2 class="text-foreground mb-4 text-xl font-semibold">Load Circuit Project</h2>

				{#if projects.length === 0}
					<div class="py-8 text-center">
						<svg
							class="text-muted-foreground mx-auto h-12 w-12"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<h3 class="text-foreground mt-2 text-sm font-medium">No circuit projects found</h3>
						<p class="text-muted-foreground mt-1 text-sm">
							Create your first circuit to get started.
						</p>
					</div>
				{:else}
					<div class="max-h-64 space-y-2 overflow-y-auto">
						{#each projects as project}
							<button
								class="w-full rounded-lg border p-3 text-left transition-colors {selectedProject?.id ===
								project.id
									? 'border-primary bg-primary/10'
									: 'border-border hover:border-primary/50 hover:bg-accent'}"
								onclick={() => selectProject(project)}
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h3 class="text-foreground font-medium">{project.name}</h3>
										{#if project.description}
											<p class="text-muted-foreground mt-1 text-sm">{project.description}</p>
										{/if}
										<div class="text-muted-foreground mt-2 flex items-center space-x-4 text-xs">
											<span>{project.component_count || 0} components</span>
											<span>Updated {formatDate(project.updated_at)}</span>
										</div>
									</div>
									{#if selectedProject?.id === project.id}
										<svg class="text-primary h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											/>
										</svg>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}

				<div class="mt-6 flex justify-end space-x-3">
					<Button variant="outline" onclick={() => (show = false)} class="flex-1">Cancel</Button>
					<Button onclick={loadSelectedProject} disabled={!selectedProject} class="flex-1">
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
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.load-project-dialog {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		box-shadow:
			0 20px 25px rgba(0, 0, 0, 0.15),
			0 10px 10px rgba(0, 0, 0, 0.04);
		min-width: 480px;
		max-width: 90vw;
		max-height: 90vh;
		overflow-y: auto;
	}

	:global(.dark) .load-project-dialog {
		background: #1f2937;
		border: 1px solid #374151;
		box-shadow:
			0 20px 25px rgba(0, 0, 0, 0.25),
			0 10px 10px rgba(0, 0, 0, 0.1);
	}
</style>
