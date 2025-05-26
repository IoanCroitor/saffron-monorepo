<script lang="ts">
	import { isLoggedIn } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let { children } = $props();
	
	onMount(() => {
		const unsubscribe = isLoggedIn.subscribe((loggedIn) => {
			if (!loggedIn) {
				goto('/login');
			}
		});
		
		return unsubscribe;
	});
</script>

{#if $isLoggedIn}
	{@render children()}
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold mb-4">Authentication Required</h1>
			<p class="text-muted-foreground mb-4">You need to be logged in to access this page.</p>
			<a href="/login" class="text-primary hover:underline">Go to Login</a>
		</div>
	</div>
{/if}
