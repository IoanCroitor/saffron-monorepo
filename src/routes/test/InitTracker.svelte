<script lang="ts">
	// Track when component mounts (equivalent to onInit)
	$effect(() => {
		console.log('SvelteFlow initialized - InitTracker mounted');
	});
</script>

<!-- This component tracks when SvelteFlow is initialized -->
<!-- It doesn't render anything visible -->
