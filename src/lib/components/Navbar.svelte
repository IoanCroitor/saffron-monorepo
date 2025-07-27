<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Menu, User, LogIn, UserPlus, ChevronDown, LogOut, Settings } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ThemeToggle from './ThemeToggle.svelte';
	import { goto } from '$app/navigation';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';
	import type { Database } from '$lib/types/database.types';

	// Accept props for session and supabase
	export let session: Session | null = null;
	export let supabase: SupabaseClient<Database> | null = null;

	let showMobileMenu = false;

	function handleLogin() {
		goto('/login');
	}

	function handleSignUp() {
		goto('/signup');
	}

	async function handleLogout() {
		if (supabase) {
			await supabase.auth.signOut();
		}
		goto('/'); // Redirect to home after logout
	}

	function handleProfile() {
		goto('/dashboard');
	}

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}

	// Close menus when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('.mobile-menu')) {
			showMobileMenu = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<nav
	class="bg-muted text-muted-foreground supports-[backdrop-filter]:bg-muted/60 sticky top-0 z-50 w-full border-b backdrop-blur"
>
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<!-- Logo/Brand -->
		<div class="flex items-center space-x-4">
			<a href="/" class="flex items-center space-x-1">
				<div class=" flex items-center justify-center rounded-lg">
					<span class="text-lg font-bold">🌺</span>
				</div>
				<span class="text-xl font-bold">Saffron</span>
			</a>
		</div>

		<!-- Navigation Links (Desktop) -->
		<div class="hidden items-center space-x-6 md:flex">
			<a href="/about" class="hover:text-primary text-sm font-medium transition-colors"> About </a>
			{#if session}
				<a href="/projects" class="hover:text-primary text-sm font-medium transition-colors">
					Projects
				</a>
				<a href="/editor" class="hover:text-primary text-sm font-medium transition-colors">
					Schematic Editor
				</a>
				<a href="/spice" class="hover:text-primary text-sm font-medium transition-colors">
					Simulator
				</a>
				<a href="/scan" class="hover:text-primary text-sm font-medium transition-colors"> Scan </a>
				<a href="/dashboard" class="hover:text-primary text-sm font-medium transition-colors">
					Dashboard
				</a>
			{/if}
		</div>

		<!-- Auth Buttons -->
		<div class="flex items-center space-x-4">
			<!-- Theme Toggle -->
			<ThemeToggle />

			{#if session}
				<!-- User Dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="ghost" size="sm" class="relative h-8 w-8 rounded-full">
							<User class="h-4 w-4" />
							<span class="sr-only">Open user menu</span>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56" align="end">
						<DropdownMenu.Label class="font-normal">
							<div class="flex flex-col space-y-1">
								<p class="text-sm leading-none font-medium">
									{session.user?.user_metadata?.name ?? session.user?.email ?? 'User'}
								</p>
								<p class="text-muted-foreground text-xs leading-none">
									{session.user?.email ?? ''}
								</p>
							</div>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={handleProfile}>
							<User class="mr-2 h-4 w-4" />
							<span>Profile</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => goto('/dashboard')}>
							<Settings class="mr-2 h-4 w-4" />
							<span>Dashboard</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={handleLogout} class="text-red-600 dark:text-red-400">
							<LogOut class="mr-2 h-4 w-4" />
							<span>Log out</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{:else}
				<!-- Login/Sign Up Buttons -->
				<div class="hidden items-center space-x-2 sm:flex">
					<Button variant="ghost" size="sm" onclick={handleLogin}>
						<LogIn class="mr-2 h-4 w-4" />
						Login
					</Button>
					<Button size="sm" onclick={handleSignUp}>
						<UserPlus class="mr-2 h-4 w-4" />
						Sign Up
					</Button>
				</div>
			{/if}

			<!-- Mobile Menu -->
			<div class="mobile-menu relative md:hidden">
				<Button variant="ghost" size="sm" onclick={toggleMobileMenu}>
					<Menu class="h-5 w-5" />
					<span class="sr-only">Open menu</span>
				</Button>
				{#if showMobileMenu}
					<div class="bg-popover absolute right-0 z-50 mt-2 w-56 rounded-md border shadow-lg">
						<div class="py-1">
							<a
								href="/about"
								class="hover:bg-accent hover:text-accent-foreground block px-3 py-2 text-sm"
							>
								About
							</a>
							{#if session}
								<a
									href="/projects"
									class="hover:bg-accent hover:text-accent-foreground block px-3 py-2 text-sm"
								>
									Projects
								</a>
								<a
									href="/editor"
									class="hover:bg-accent hover:text-accent-foreground block px-3 py-2 text-sm"
								>
									Schematic Editor
								</a>
								<a
									href="/simulator"
									class="hover:bg-accent hover:text-accent-foreground block px-3 py-2 text-sm"
								>
									Simulator
								</a>
								<a
									href="/scan"
									class="hover:bg-accent hover:text-accent-foreground block px-3 py-2 text-sm"
								>
									Scan
								</a>
								<a
									href="/dashboard"
									class="hover:bg-accent hover:text-accent-foreground block px-3 py-2 text-sm"
								>
									Dashboard
								</a>
							{/if}
							{#if !session}
								<hr class="my-1" />
								<button
									class="hover:bg-accent hover:text-accent-foreground flex w-full items-center px-3 py-2 text-left text-sm"
									onclick={handleLogin}
								>
									<LogIn class="mr-2 h-4 w-4" />
									<span>Login</span>
								</button>
								<button
									class="hover:bg-accent hover:text-accent-foreground flex w-full items-center px-3 py-2 text-left text-sm"
									onclick={handleSignUp}
								>
									<UserPlus class="mr-2 h-4 w-4" />
									<span>Sign Up</span>
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</nav>
