<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Plus, FolderOpen, Clock, Settings, CircuitBoard, Zap } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	function getStatusColor(status: string) {
		switch (status) {
			case 'active': return 'text-green-600 dark:text-green-400';
			case 'completed': return 'text-blue-600 dark:text-blue-400';
			case 'draft': return 'text-yellow-600 dark:text-yellow-400';
			case 'archived': return 'text-gray-600 dark:text-gray-400';
			default: return 'text-gray-600 dark:text-gray-400';
		}
	}
	
	function getStatusBgColor(status: string) {
		switch (status) {
			case 'active': return 'bg-green-100 dark:bg-green-900/20';
			case 'completed': return 'bg-blue-100 dark:bg-blue-900/20';
			case 'draft': return 'bg-yellow-100 dark:bg-yellow-900/20';
			case 'archived': return 'bg-gray-100 dark:bg-gray-900/20';
			default: return 'bg-gray-100 dark:bg-gray-900/20';
		}
	}
	
	function handleEditProject(projectId: string) {
		goto(`/editor?project=${projectId}`);
	}
</script>

<svelte:head>
	<title>Projects - Saffron</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="container mx-auto py-8 px-4">
		<!-- Header -->
		<div class="flex justify-between items-center mb-8">
			<div>
				<h1 class="text-3xl font-bold mb-2">Your Projects</h1>
				<p class="text-muted-foreground">Welcome back, {data.user.name}! Manage your circuit projects.</p>
			</div>
			<Button class="gap-2" onclick={() => goto('/projects/new')}>
				<Plus class="h-4 w-4" />
				New Project
			</Button>
		</div>

		<!-- Projects Grid -->
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each data.projects as project (project.id)}
				<Card.Root class="hover:shadow-lg transition-shadow cursor-pointer" onclick={() => goto(`/projects/${project.id}`)}>
					<Card.Header>
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<Card.Title class="text-lg">{project.name}</Card.Title>
								<Card.Description class="mt-1">{project.description}</Card.Description>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-xs px-2 py-1 rounded-full {getStatusBgColor(project.status)} {getStatusColor(project.status)}">
									{project.status}
								</span>
								{#if !project.hasCircuitData}
									<span class="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" title="Empty project">
										Empty
									</span>
								{/if}
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<div class="flex items-center justify-between text-sm text-muted-foreground">
								<div class="flex items-center gap-1">
									<Clock class="h-3 w-3" />
									<span>{project.lastModified}</span>
								</div>
								<div class="flex items-center gap-1">
									<CircuitBoard class="h-3 w-3" />
									<span>{project.components} components</span>
								</div>
							</div>
						</div>
					</Card.Content>
					<Card.Footer>
						<div class="flex gap-2 w-full">
							{#if project.hasCircuitData}
								<Button variant="outline" size="sm" class="flex-1" onclick={(e) => { e.stopPropagation(); handleEditProject(project.id); }}>
									<Zap class="h-3 w-3 mr-1" />
									Open Editor
								</Button>
							{:else}
								<Button variant="outline" size="sm" class="flex-1" onclick={(e) => { e.stopPropagation(); handleEditProject(project.id); }}>
									<Plus class="h-3 w-3 mr-1" />
									Start Building
								</Button>
							{/if}
							<Button variant="outline" size="sm" class="flex-1" onclick={(e) => { e.stopPropagation(); goto(`/projects/${project.id}`); }}>
								<FolderOpen class="h-3 w-3 mr-1" />
								Details
							</Button>
						</div>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>

		<!-- Empty State (if no projects) -->
		{#if data.projects.length === 0}
			<div class="text-center py-12">
				<CircuitBoard class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
				<h3 class="text-xl font-semibold mb-2">No projects yet</h3>
				<p class="text-muted-foreground mb-4">Start by creating your first circuit project.</p>
				<Button class="gap-2" onclick={() => goto('/projects/new')}>
					<Plus class="h-4 w-4" />
					Create Your First Project
				</Button>
			</div>
		{/if}
	</div>
</div>
