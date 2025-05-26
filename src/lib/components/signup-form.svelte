<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	
	import { writable } from 'svelte/store';
	
	export let form;
	let loading = writable(false);
	
	const submitSignup: SubmitFunction = () => {
		loading.set(true);
		return async ({ update }) => {
			loading.set(false);
			await update();
		};
	};
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Sign Up</Card.Title>
		<Card.Description>Create a new account to get started</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance={submitSignup} class="grid gap-4">
			{#if form?.error}
				<div class="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 p-2 rounded">
					{form.error}
				</div>
			{/if}

			{#if form?.success}
				<div class="text-sm text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 p-2 rounded">
					{form.message}
				</div>
			{/if}
			
			<div class="grid gap-2">
				<Label for="name">Full Name</Label>
				<Input 
					id="name" 
					name="name"
					type="text" 
					placeholder="John Doe" 
					value={form?.name ?? ''}
					required 
				/>
			</div>
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
				<Label for="password">Password</Label>
				<Input 
					id="password" 
					name="password"
					type="password" 
					placeholder="At least 6 characters"
					required 
				/>
			</div>
			<div class="grid gap-2">
				<Label for="confirmPassword">Confirm Password</Label>
				<Input 
					id="confirmPassword" 
					name="confirmPassword"
					type="password" 
					placeholder="Confirm your password"
					required 
				/>
			</div>
			<Button type="submit" class="w-full" disabled={$loading}>
				{$loading ? "Creating account..." : "Create Account"}
			</Button>
		</form>
		<div class="mt-4 text-center text-sm">
			Already have an account?
			<a href="/login" class="underline"> Sign in </a>
		</div>
	</Card.Content>
</Card.Root>
