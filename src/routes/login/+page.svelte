<script lang="ts">
	import LoginForm from "$lib/components/login-form.svelte";
	import { onMount } from "svelte";
	import { isLoggedIn } from "$lib/stores/auth.js";
	import { goto } from "$app/navigation";
	
	let { form, data } = $props();
	
	// Check if already logged in and redirect
	onMount(() => {
		const unsubscribe = isLoggedIn.subscribe((loggedIn) => {
			if (loggedIn) {
				goto("/dashboard");
			}
		});
		
		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Login - Saffron</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
	<LoginForm {form} />
</div>
