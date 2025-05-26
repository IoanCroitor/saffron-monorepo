<script lang="ts">
	import '../app.css';
	// import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-background">
	<!-- <Navbar /> -->
	<main>
		{@render children()}
	</main>
</div>
