<script lang="ts">
	import { currentUser, isLoggedIn, logout } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	
	// Redirect to login if not authenticated
	onMount(() => {
		const unsubscribe = isLoggedIn.subscribe((loggedIn) => {
			if (!loggedIn) {
				goto('/login');
			}
		});
		
		return unsubscribe;
	});
	
	async function handleLogout() {
		await logout();
		// No need to navigate as the server will redirect
	}
</script>

<svelte:head>
	<title>Dashboard - Saffron</title>
</svelte:head>

{#if $isLoggedIn && $currentUser}
	<div class="min-h-screen bg-background">
		<div class="container mx-auto py-8 px-4">
			<div class="mb-8">
				<h1 class="text-3xl font-bold mb-2">Welcome to your Dashboard</h1>
				<p class="text-muted-foreground">Hello, {$currentUser.name}! You're successfully logged in.</p>
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
								<span class="ml-2">{$currentUser.name}</span>
							</div>
							<div>
								<span class="font-medium">Email:</span>
								<span class="ml-2">{$currentUser.email}</span>
							</div>
							<div>
								<span class="font-medium">User ID:</span>
								<span class="ml-2 text-sm text-muted-foreground">{$currentUser.id}</span>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Quick Actions Card -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Quick Actions</Card.Title>
						<Card.Description>Common tasks and features</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<Button href="/test" class="w-full">
								Launch Circuit Designer
							</Button>
							<Button variant="outline" href="/demo" class="w-full">
								View Demo
							</Button>
							<Button variant="outline" href="/about" class="w-full">
								Learn More
							</Button>
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
								<span class="text-muted-foreground">Demo session</span>
							</div>
							<div class="text-center text-muted-foreground py-4">
								<p>This is a demo authentication system.</p>
								<p>No real data is stored.</p>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Demo Information -->
			<Card.Root class="mt-8">
				<Card.Header>
					<Card.Title>Demo Authentication System</Card.Title>
					<Card.Description>How this mock authentication works</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="prose prose-sm max-w-none">
						<p class="mb-4">
							This is a demonstration authentication system that uses local storage and a JSON file for mock users. 
							Here's what's included:
						</p>
						<ul class="space-y-2 mb-4">
							<li>✅ Login and signup forms with validation</li>
							<li>✅ User session management with localStorage</li>
							<li>✅ Protected routes and authentication checks</li>
							<li>✅ Responsive navigation with user menu</li>
							<li>✅ Mock user data from JSON file</li>
						</ul>
						<p class="mb-4">
							<strong>Demo Accounts:</strong>
						</p>
						<div class="bg-muted p-4 rounded-lg">
							<p class="mb-2"><code>admin@example.com</code> / <code>admin123</code></p>
							<p class="mb-2"><code>user@example.com</code> / <code>user123</code></p>
							<p><code>test@example.com</code> / <code>test123</code></p>
						</div>
					</div>
				</Card.Content>
				<Card.Footer>
					<Button variant="destructive" onclick={handleLogout}>
						Logout
					</Button>
				</Card.Footer>
			</Card.Root>
		</div>
	</div>
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold mb-4">Loading...</h1>
			<p class="text-muted-foreground">Checking authentication status...</p>
		</div>
	</div>
{/if}
