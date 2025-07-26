<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	import { writable } from 'svelte/store';

	export let form;
	let loading = writable(false);

	const submitLogin: SubmitFunction = () => {
		loading.set(true);
		return async ({ update }) => {
			loading.set(false);
			await update();
		};
	};
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance={submitLogin} class="grid gap-4">
			{#if form?.error}
				<div class="rounded bg-red-50 p-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
					{form.error}
				</div>
			{/if}

			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="m@example.com"
					value={form?.email ?? ''}
					required
				/>
			</div>
			<div class="grid gap-2">
				<div class="flex items-center">
					<Label for="password">Password</Label>
				</div>
				<Input id="password" name="password" type="password" required />
			</div>

			<Button type="submit" class="w-full" disabled={$loading}>
				{$loading ? 'Logging in...' : 'Login'}
			</Button>
		</form>
		<div class="mt-4 text-center text-sm">
			Don't have an account?
			<a href="/signup" class="underline"> Sign up </a>
			<a href="##" class=" inline-block text-sm underline"> Forgot your password? </a>
		</div>
	</Card.Content>
</Card.Root>
