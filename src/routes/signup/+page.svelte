<script lang="ts">
	import SignupForm from "$lib/components/signup-form.svelte";
	import { onMount } from "svelte";
	import { isLoggedIn } from "$lib/stores/auth.js";
	import { goto } from "$app/navigation";
	
	let { form } = $props();
	
	onMount(() => {
		const unsubscribe = isLoggedIn.subscribe((loggedIn) => {
			if (loggedIn) {
				goto("/");
			}
		});
		
		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Sign Up - Saffron</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
	<SignupForm {form} />
</div>
