<script lang="ts">
	import { currentUser } from '$lib/stores/auth.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Plus, FolderOpen, Clock, Settings } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	
	// Mock projects data
	const projects = [
		{
			id: '1',
			name: 'Audio Amplifier Circuit',
			description: 'Class-A audio amplifier with discrete components',
			lastModified: '2 hours ago',
			components: 12,
			status: 'active'
		},
		{
			id: '2',
			name: 'LED Matrix Display',
			description: '8x8 LED matrix driver circuit',
			lastModified: '1 day ago',
			components: 8,
			status: 'completed'
		},
		{
			id: '3',
			name: 'Power Supply Unit',
			description: 'Switching power supply with regulation',
			lastModified: '3 days ago',
			components: 15,
			status: 'draft'
		}
	];
	
	function getStatusColor(status: string) {
		switch (status) {
			case 'active': return 'text-green-600 dark:text-green-400';
			case 'completed': return 'text-blue-600 dark:text-blue-400';
			case 'draft': return 'text-yellow-600 dark:text-yellow-400';
			default: return 'text-gray-600 dark:text-gray-400';
		}
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
				<p class="text-muted-foreground">Welcome back, {$currentUser?.name}! Manage your circuit projects.</p>
			</div>
			<Button class="gap-2" onclick={() => goto('/projects/new')}>
				<Plus class="h-4 w-4" />
				New Project
			</Button>
		</div>

		<!-- Projects Grid -->
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each projects as project}
				<Card.Root class="hover:shadow-lg transition-shadow cursor-pointer" onclick={() => goto(`/projects/${project.id}`)}>
					<Card.Header>
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<Card.Title class="text-lg">{project.name}</Card.Title>
								<Card.Description class="mt-1">{project.description}</Card.Description>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-xs px-2 py-1 rounded-full bg-muted {getStatusColor(project.status)}">
									{project.status}
								</span>
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
									<Settings class="h-3 w-3" />
									<span>{project.components} components</span>
								</div>
							</div>
						</div>
					</Card.Content>
					<Card.Footer>
						<div class="flex gap-2 w-full">
							<Button variant="outline" size="sm" class="flex-1">
								<FolderOpen class="h-3 w-3 mr-1" />
								Open
							</Button>
							<Button variant="outline" size="sm" class="flex-1">
								<Settings class="h-3 w-3 mr-1" />
								Settings
							</Button>
						</div>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>

		<!-- Empty State (if no projects) -->
		{#if projects.length === 0}
			<div class="text-center py-12">
				<FolderOpen class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
				<h3 class="text-xl font-semibold mb-2">No projects yet</h3>
				<p class="text-muted-foreground mb-4">Start by creating your first circuit project.</p>
				<Button class="gap-2">
					<Plus class="h-4 w-4" />
					Create Your First Project
				</Button>
			</div>
		{/if}

		<!-- Protected Route Demo Information -->
		<Card.Root class="mt-8">
			<Card.Header>
				<Card.Title>Protected Route Demo</Card.Title>
				<Card.Description>This page and all sub-routes under /projects are protected</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="prose prose-sm max-w-none">
					<p class="mb-4">
						This demonstrates the protected route functionality:
					</p>
					<ul class="space-y-2">
						<li>✅ Route protection at layout level</li>
						<li>✅ Automatic redirect to login if not authenticated</li>
						<li>✅ All sub-routes under /projects are protected</li>
						<li>✅ Navigation only shows for authenticated users</li>
					</ul>
					<p class="mt-4">
						Try visiting <code>/projects/new</code> or any other sub-route - they'll all be protected!
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
