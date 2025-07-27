<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { Toaster } from 'svelte-sonner';
	import { initializeAuth } from '$lib/stores/auth';

	let { data, children } = $props();

	// Initialize auth on mount (client-side only)
	onMount(() => {
		initializeAuth();
	});
</script>

<Toaster />
<ModeWatcher />
<div class="bg-background min-h-screen">
	<Navbar />
	<main>
		{@render children()}
	</main>
</div>
