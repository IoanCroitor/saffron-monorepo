<script lang="ts">
	console.log('[projects/+layout.svelte] session:', $page.data.session, 'user:', $page.data.user);
	import { page } from '$app/stores';

	let { children } = $props();

	// Use the session data from the root layout
	let session = $derived($page.data.session);
	let user = $derived($page.data.user);
</script>

{#if session && user}
	{@render children()}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="mb-4 text-2xl font-bold">Authentication Required</h1>
			<p class="text-muted-foreground mb-4">You need to be logged in to access this page.</p>
			<a href="/login" class="text-primary hover:underline">Go to Login</a>
		</div>
	</div>
{/if}
