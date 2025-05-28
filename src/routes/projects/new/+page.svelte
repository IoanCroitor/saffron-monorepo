<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ArrowLeft, Plus } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let isSubmitting = $state(false);
	
	function handleBack() {
		goto('/projects');
	}
</script>

<svelte:head>
	<title>New Project | Saffron</title>
</svelte:head>

<div class="container mx-auto py-8 px-4">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="flex items-center gap-4 mb-6">
			<Button variant="ghost" size="sm" onclick={handleBack}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Back to Projects
			</Button>
		</div>
		
		<div class="space-y-6">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Create New Project</h1>
				<p class="text-muted-foreground mt-2">
					Start a new circuit design project with Saffron's powerful tools.
				</p>
			</div>
			
			<Card.Root>
				<Card.Header>
					<Card.Title>Project Details</Card.Title>
					<Card.Description>
						Provide basic information about your new project.
					</Card.Description>
				</Card.Header>
				<form method="POST" action="?/create" use:enhance={() => {
					isSubmitting = true;
					return async ({ result }) => {
						isSubmitting = false;
						if (result.type === 'redirect') {
							goto(result.location);
						}
					};
				}}>
					<Card.Content class="space-y-4">
						{#if form?.error}
							<div class="text-sm text-destructive">
								{form.error}
							</div>
						{/if}
						
						<div class="space-y-2">
							<Label for="name">Project Name</Label>
							<Input
								id="name"
								name="name"
								placeholder="Enter project name..."
								value={form?.values?.name ?? ''}
								class={form?.errors?.name ? 'border-destructive' : ''}
							/>
							{#if form?.errors?.name}
								<p class="text-sm text-destructive">{form.errors.name[0]}</p>
							{/if}
						</div>
						
						<div class="space-y-2">
							<Label for="description">Description</Label>
							<Input
								id="description"
								name="description"
								placeholder="Brief description of your project..."
								value={form?.values?.description ?? ''}
								class={form?.errors?.description ? 'border-destructive' : ''}
							/>
							{#if form?.errors?.description}
								<p class="text-sm text-destructive">{form.errors.description[0]}</p>
							{/if}
						</div>
					</Card.Content>
					<Card.Footer class="flex gap-3 pt-4">
						<Button type="button" variant="outline" onclick={handleBack}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							<Plus class="w-4 h-4 mr-2" />
							{isSubmitting ? 'Creating...' : 'Create Project'}
						</Button>
					</Card.Footer>
				</form>
			</Card.Root>
			
			<!-- Template Options -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Project Templates</Card.Title>
					<Card.Description>
						Choose from pre-built templates to get started quickly.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
							<h3 class="font-medium">Audio Amplifier</h3>
							<p class="text-sm text-muted-foreground mt-1">
								Class-A amplifier circuit template
							</p>
						</div>
						<div class="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
							<h3 class="font-medium">LED Driver</h3>
							<p class="text-sm text-muted-foreground mt-1">
								Current-controlled LED driver
							</p>
						</div>
						<div class="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
							<h3 class="font-medium">Digital Logic</h3>
							<p class="text-sm text-muted-foreground mt-1">
								Basic digital logic gates
							</p>
						</div>
						<div class="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
							<h3 class="font-medium">Blank Project</h3>
							<p class="text-sm text-muted-foreground mt-1">
								Start from scratch
							</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
