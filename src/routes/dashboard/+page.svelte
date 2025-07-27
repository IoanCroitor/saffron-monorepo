<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let { data } = $props();
	let { session, user, supabase } = $derived(data);

	async function handleLogout() {
		if (supabase) {
			await supabase.auth.signOut();
		}
		goto('/');
	}
</script>

<svelte:head>
	<title>Dashboard - Saffron</title>
</svelte:head>

{#if session && user}
	<div class="bg-background min-h-screen">
		<div class="container mx-auto px-4 py-8">
			<div class="mb-8">
				<h1 class="mb-2 text-3xl font-bold">Welcome to your Dashboard</h1>
				<p class="text-muted-foreground">
					Hello, {user.user_metadata?.name || user.email || 'User'}! You're successfully logged in.
				</p>
			</div>

			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<!-- User Info Card -->
				<Card.Root>
					<Card.Header>
						<Card.Title>User Information</Card.Title>
						<Card.Description>Your account details</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							<div>
								<span class="font-medium">Name:</span>
								<span class="ml-2">{user.user_metadata?.name || 'User'}</span>
							</div>
							<div>
								<span class="font-medium">Email:</span>
								<span class="ml-2">{user.email || 'N/A'}</span>
							</div>
							<div>
								<span class="font-medium">User ID:</span>
								<span class="text-muted-foreground ml-2 text-sm">{user.id || 'N/A'}</span>
							</div>
						</div>
						<div class="mt-4">
							<Button variant="destructive" onclick={handleLogout} class="w-full">Logout</Button>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- API Keys Card -->
				<Card.Root>
					<Card.Header>
						<Card.Title>API Keys</Card.Title>
						<Card.Description>Manage your API keys</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-4">
							<div>
								<h4 class="mb-1 font-medium">Saffron API Key</h4>
								<p class="text-muted-foreground text-sm">
									Not set
									<!-- Placeholder for API key display/management -->
								</p>
							</div>
							<div>
								<h4 class="mb-1 font-medium">Gemini API Key</h4>
								<p class="text-muted-foreground text-sm">
									Not set
									<!-- Placeholder for Gemini API key input/display -->
								</p>
							</div>
							<Button href="/test" class="mt-2 w-full">Launch Circuit Designer</Button>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Activity Card -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Recent Activity</Card.Title>
						<Card.Description>Your latest actions</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3 text-sm">
							<div class="flex justify-between">
								<span>Logged in</span>
								<span class="text-muted-foreground">Just now</span>
							</div>
							<div class="flex justify-between">
								<span>Account created</span>
								<span class="text-muted-foreground">Active</span>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="mb-4 text-2xl font-bold">Loading...</h1>
			<p class="text-muted-foreground">Checking authentication status...</p>
		</div>
	</div>
{/if}
