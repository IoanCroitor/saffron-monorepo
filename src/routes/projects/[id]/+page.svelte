<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ArrowLeft, Edit, Share, Download, Trash2, CircuitBoard, Zap, Calendar, Clock, BarChart3 } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	let isDeleting = $state(false);
	
	function handleBack() {
		goto('/projects');
	}
	
	function handleEdit() {
		goto(`/editor?id=${data.project.id}`);
	}
	
	function handleShare() {
		// TODO: Implement sharing functionality
		console.log('Share project:', data.project.id);
	}
	
	function handleDownload() {
		// TODO: Implement download functionality (netlist, JSON, etc.)
		console.log('Download project:', data.project.id);
	}
	
	function getStatusColor(status: string) {
		switch (status) {
			case 'active': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
			case 'completed': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
			case 'draft': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
			case 'archived': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
			default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
		}
	}
</script>

<svelte:head>
	<title>{data.project.name} | Saffron</title>
</svelte:head>

<div class="container mx-auto py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="flex items-center gap-4 mb-6">
			<Button variant="ghost" size="sm" onclick={handleBack}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Back to Projects
			</Button>
		</div>
		
		<div class="space-y-6">
			<!-- Project Header -->
			<div class="flex items-start justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight">{data.project.name}</h1>
					<p class="text-muted-foreground mt-2">{data.project.description}</p>
					<div class="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
						<span>Created: {data.project.created}</span>
						<span>•</span>
						<span>Last modified: {data.project.lastModified}</span>
						<span>•</span>
						<span>{data.project.components} components</span>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" onclick={handleShare}>
						<Share class="w-4 h-4 mr-2" />
						Share
					</Button>
					<Button variant="outline" size="sm" onclick={handleDownload}>
						<Download class="w-4 h-4 mr-2" />
						Export
					</Button>
					<Button size="sm" onclick={handleEdit}>
						<Edit class="w-4 h-4 mr-2" />
						Edit Circuit
					</Button>
				</div>
			</div>
			
			<!-- Project Content -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Schematic Preview -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Circuit Schematic</Card.Title>
						<Card.Description>
							Current circuit design and layout
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
							<div class="text-center">
								<div class="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
									<CircuitBoard class="w-8 h-8 text-primary" />
								</div>
								{#if data.project.hasCircuitData}
									<p class="text-sm text-muted-foreground">Circuit contains {data.project.circuitStats.nodeCount} components</p>
									<p class="text-xs text-muted-foreground mb-2">and {data.project.circuitStats.edgeCount} connections</p>
								{:else}
									<p class="text-sm text-muted-foreground">No circuit data available</p>
									<p class="text-xs text-muted-foreground mb-2">Start designing in the editor</p>
								{/if}
								<Button variant="outline" size="sm" class="mt-2" onclick={handleEdit}>
									{data.project.hasCircuitData ? 'Open Editor' : 'Start Designing'}
								</Button>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
				
				<!-- Project Details -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Project Information</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div>
							<h4 class="font-medium mb-2">Circuit Statistics</h4>
							<div class="grid grid-cols-2 gap-2 text-sm">
								<div class="flex justify-between">
									<span>Nodes:</span>
									<span>{data.project.circuitStats.nodeCount}</span>
								</div>
								<div class="flex justify-between">
									<span>Connections:</span>
									<span>{data.project.circuitStats.edgeCount}</span>
								</div>
								<div class="flex justify-between">
									<span>Total Components:</span>
									<span class="font-medium">{data.project.components}</span>
								</div>
								<div class="flex justify-between col-span-2">
									<span>Circuit Data:</span>
									<span class="{data.project.hasCircuitData ? 'text-green-600' : 'text-yellow-600'}">
										{data.project.hasCircuitData ? '✓ Available' : '⚠ No data'}
									</span>
								</div>
							</div>
						</div>
						
						{#if Object.keys(data.project.componentBreakdown).length > 0}
						<div>
							<h4 class="font-medium mb-2">Component Breakdown</h4>
							<div class="grid grid-cols-1 gap-2 text-sm">
								{#each Object.entries(data.project.componentBreakdown) as [type, count]}
								<div class="flex justify-between">
									<span class="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}:</span>
									<span>{count}</span>
								</div>
								{/each}
							</div>
						</div>
						{/if}
						
						<div>
							<h4 class="font-medium mb-2">Status</h4>
							<div class="flex items-center gap-2">
								<div class="w-2 h-2 rounded-full {data.project.status === 'active' ? 'bg-green-500' : data.project.status === 'completed' ? 'bg-blue-500' : data.project.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'}"></div>
								<span class="text-sm capitalize">{data.project.status}</span>
							</div>
						</div>
						
						<div>
							<h4 class="font-medium mb-2">Actions</h4>
							<div class="space-y-2">
								<Button variant="outline" size="sm" class="w-full justify-start" onclick={handleShare}>
									<Share class="w-4 h-4 mr-2" />
									Share Project
								</Button>
								<Button variant="outline" size="sm" class="w-full justify-start" onclick={handleDownload}>
									<Download class="w-4 h-4 mr-2" />
									Export Schematic
								</Button>
								<form method="POST" action="?/delete" use:enhance={() => {
									if (!confirm(`Are you sure you want to delete "${data.project.name}"? This action cannot be undone.`)) {
										return () => {};
									}
									isDeleting = true;
									return async ({ result }) => {
										isDeleting = false;
										if (result.type === 'redirect') {
											goto(result.location);
										}
									};
								}}>
									<Button type="submit" variant="destructive" size="sm" class="w-full justify-start" disabled={isDeleting}>
										<Trash2 class="w-4 h-4 mr-2" />
										{isDeleting ? 'Deleting...' : 'Delete Project'}
									</Button>
								</form>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
