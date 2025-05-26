<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />
<div class="min-h-screen bg-background">
	<Navbar />
	<main>
		{@render children()}
	</main>
</div>
