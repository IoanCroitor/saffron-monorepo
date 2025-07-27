<script lang="ts">
	import SignupForm from "$lib/components/signup-form.svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	
	let { form, data } = $props();
	
	// Check if user is already logged in from server data
	const user = $derived(data.user);
	
	$effect(() => {
		if (user) {
			goto("/");
		}
	});
</script>

<svelte:head>
	<title>Sign Up - Saffron</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
	<SignupForm {form} />
</div>
