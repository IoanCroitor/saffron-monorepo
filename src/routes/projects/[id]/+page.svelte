<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ArrowLeft, Edit, Share, Download, Trash2 } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	$: projectId = $page.params.id;
	
	// Mock project data
	const project = {
		id: projectId,
		name: 'Audio Amplifier Circuit',
		description: 'Class-A audio amplifier with discrete components',
		created: 'May 20, 2025',
		lastModified: '2 hours ago',
		components: 12,
		status: 'active',
		schematic: '/api/schematics/amplifier.svg' // Mock path
	};
	
	function handleBack() {
		goto('/projects');
	}
	
	function handleEdit() {
		// Would open the circuit editor
		console.log('Edit project:', projectId);
	}
	
	function handleShare() {
		console.log('Share project:', projectId);
	}
	
	function handleDownload() {
		console.log('Download project:', projectId);
	}
	
	function handleDelete() {
		if (confirm('Are you sure you want to delete this project?')) {
			console.log('Delete project:', projectId);
			goto('/projects');
		}
	}
</script>

<svelte:head>
	<title>{project.name} | Saffron</title>
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
					<h1 class="text-3xl font-bold tracking-tight">{project.name}</h1>
					<p class="text-muted-foreground mt-2">{project.description}</p>
					<div class="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
						<span>Created: {project.created}</span>
						<span>•</span>
						<span>Last modified: {project.lastModified}</span>
						<span>•</span>
						<span>{project.components} components</span>
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
									<Edit class="w-8 h-8 text-primary" />
								</div>
								<p class="text-sm text-muted-foreground">Schematic preview would appear here</p>
								<Button variant="outline" size="sm" class="mt-2" onclick={handleEdit}>
									Open Editor
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
							<h4 class="font-medium mb-2">Components Used</h4>
							<div class="grid grid-cols-2 gap-2 text-sm">
								<div class="flex justify-between">
									<span>Resistors:</span>
									<span>4</span>
								</div>
								<div class="flex justify-between">
									<span>Capacitors:</span>
									<span>3</span>
								</div>
								<div class="flex justify-between">
									<span>Transistors:</span>
									<span>2</span>
								</div>
								<div class="flex justify-between">
									<span>Power Supply:</span>
									<span>1</span>
								</div>
								<div class="flex justify-between">
									<span>Ground:</span>
									<span>2</span>
								</div>
								<div class="flex justify-between">
									<span>Total:</span>
									<span class="font-medium">{project.components}</span>
								</div>
							</div>
						</div>
						
						<div>
							<h4 class="font-medium mb-2">Status</h4>
							<div class="flex items-center gap-2">
								<div class="w-2 h-2 bg-green-500 rounded-full"></div>
								<span class="text-sm capitalize">{project.status}</span>
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
								<Button variant="destructive" size="sm" class="w-full justify-start" onclick={handleDelete}>
									<Trash2 class="w-4 h-4 mr-2" />
									Delete Project
								</Button>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
