<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { initializeAuth } from '$lib/stores/auth.js';
	import { invalidate } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children, data } = $props();

	// Initialize auth state when component mounts and data changes
	$effect(() => {
		if (browser) {
			// Always call initializeAuth, even with null values
			// This ensures the stores are properly set on the client
			console.log('Layout effect triggered with data:', { 
				hasSession: !!data.session, 
				hasUser: !!data.user 
			});
			initializeAuth(data.session, data.user);
		}
	});

	onMount(() => {
		const { data: { subscription } } = data.supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<ModeWatcher />
<div class="min-h-screen bg-background">
	<Navbar />
	<main>
		{@render children()}
	</main>
</div>
