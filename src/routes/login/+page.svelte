<script lang="ts">
	import LoginForm from '$lib/components/login-form.svelte';

	let { form, data } = $props();
</script>

<svelte:head>
	<title>Login - Saffron</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
	<LoginForm {form} {data} />
</div>
