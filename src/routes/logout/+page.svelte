<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	// Auto-submit the logout form when the page loads
	onMount(() => {
		const form = document.getElementById('logout-form') as HTMLFormElement;
		if (form) {
			form.submit();
		}
	});
</script>

<svelte:head>
	<title>Logging Out - Saffron</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="text-center">
			<Card.Title>Logging Out</Card.Title>
			<Card.Description>
				Please wait while we log you out securely...
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form 
				id="logout-form"
				method="POST" 
				use:enhance
				class="space-y-4"
			>
				<Button type="submit" class="w-full">
					Log Out
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
