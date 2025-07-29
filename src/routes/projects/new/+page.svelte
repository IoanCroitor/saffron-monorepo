<script lang="ts">

	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ArrowLeft, Plus } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import type { PageData, ActionData } from './$types';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
	

	
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
			<button class="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" onclick={handleBack}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Back to Projects
			</button>
		</div>
		
		<div class="space-y-6">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Create New Project</h1>
				<p class="text-muted-foreground mt-2">
					Create a new project and return to your projects list.
				</p>
			</div>
			
			<Card.Root>
				<Card.Header>
					<Card.Title>Project Details</Card.Title>
					<Card.Description>
						Provide basic information about your new project. You'll be redirected to your projects list after creation.
					</Card.Description>
				</Card.Header>
				<form method="POST" action="?/create">
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
						<button type="button" class="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 transition-colors" onclick={handleBack}>
							Cancel
						</button>
						<button type="submit" class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors flex items-center">
							<Plus class="w-4 h-4 mr-2" />
							Create Project
						</button>
					</Card.Footer>
				</form>
			</Card.Root>
			

		</div>
	</div>
</div>
