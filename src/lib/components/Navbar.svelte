<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Menu, User, LogIn, UserPlus, ChevronDown, LogOut, Settings } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ThemeToggle from './ThemeToggle.svelte';
	import { currentUser, isLoggedIn, logout } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';

	let showMobileMenu = false;

	function handleLogin() {
		goto('/login');
	}

	function handleSignUp() {
		goto('/signup');
	}

	async function handleLogout() {
		await logout();
		goto('/'); // Redirect to home after logout
		
	}

	function handleProfile() {
		// Replace with your profile logic
		console.log('Profile clicked');
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

<nav class="sticky top-0 z-50 w-full border-b bg-muted text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-muted/60">
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<!-- Logo/Brand -->
		<div class="flex items-center space-x-4">
			<a href="/" class="flex items-center space-x-1">
				<div class=" rounded-lg flex items-center justify-center">
					<span class="font-bold text-lg">🌺</span>
				</div>
				<span class="font-bold text-xl">Saffron</span>
			</a>
		</div>

		<!-- Navigation Links (Desktop) -->
		<div class="hidden md:flex items-center space-x-6">
			<a href="/about" class="text-sm font-medium hover:text-primary transition-colors">
				About
			</a>
			{#if $isLoggedIn}
				<a href="/projects" class="text-sm font-medium hover:text-primary transition-colors">
					Projects
				</a>
				<a href="/editor" class="text-sm font-medium hover:text-primary transition-colors">
					Schematic Editor
				</a>
				<a href="/spice" class="text-sm font-medium hover:text-primary transition-colors">
					Simulator
				</a>
				<a href="/scan" class="text-sm font-medium hover:text-primary transition-colors">
					Scan
				</a>
				<a href="/dashboard" class="text-sm font-medium hover:text-primary transition-colors">
					Dashboard
				</a>
			{/if}
		</div>

		<!-- Auth Buttons -->
		<div class="flex items-center space-x-4">
			<!-- Theme Toggle -->
			<ThemeToggle />
			
			{#if $isLoggedIn}
				<!-- User Dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button
							variant="ghost"
							size="sm"
							class="relative h-8 w-8 rounded-full"
						>
							<User class="h-4 w-4" />
							<span class="sr-only">Open user menu</span>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56" align="end">
						<DropdownMenu.Label class="font-normal">
							<div class="flex flex-col space-y-1">
								<p class="text-sm font-medium leading-none">{$currentUser?.name}</p>
								<p class="text-xs leading-none text-muted-foreground">{$currentUser?.email}</p>
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
				<div class="hidden sm:flex items-center space-x-2">
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
			<div class="md:hidden relative mobile-menu">
				<Button variant="ghost" size="sm" onclick={toggleMobileMenu}>
					<Menu class="h-5 w-5" />
					<span class="sr-only">Open menu</span>
				</Button>
				{#if showMobileMenu}
					<div class="absolute right-0 mt-2 w-56 bg-popover border rounded-md shadow-lg z-50">
						<div class="py-1">
							<a href="/about" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
								About
							</a>
							{#if $isLoggedIn}
								<a href="/projects" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
									Projects
								</a>
								<a href="/editor" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
									Schematic Editor
								</a>
								<a href="/simulator" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
									Simulator
								</a>
								<a href="/scan" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
									Scan
								</a>
								<a href="/dashboard" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
									Dashboard
								</a>
							{/if}
							{#if !$isLoggedIn}
								<hr class="my-1" />
								<button
									class="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center"
									onclick={handleLogin}
								>
									<LogIn class="mr-2 h-4 w-4" />
									<span>Login</span>
								</button>
								<button
									class="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center"
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