<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Menu, User, LogIn, UserPlus, ChevronDown } from '@lucide/svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	// Mock user state - replace with your actual auth logic
	let isLoggedIn = false;
	let user = { name: 'John Doe', email: 'john@example.com' };
	let showUserMenu = false;
	let showMobileMenu = false;

	function handleLogin() {
		// Replace with your login logic
		console.log('Login clicked');
	}

	function handleSignUp() {
		// Replace with your sign up logic
		console.log('Sign up clicked');
	}

	function handleLogout() {
		// Replace with your logout logic
		console.log('Logout clicked');
		isLoggedIn = false;
		showUserMenu = false;
	}

	function handleProfile() {
		// Replace with your profile logic
		console.log('Profile clicked');
		showUserMenu = false;
	}

	function toggleUserMenu() {
		showUserMenu = !showUserMenu;
	}

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}

	// Close menus when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('.user-menu') && !target.closest('.mobile-menu')) {
			showUserMenu = false;
			showMobileMenu = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<nav class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<!-- Logo/Brand -->
		<div class="flex items-center space-x-4">
			<a href="/" class="flex items-center space-x-2">
				<div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
					<span class="text-primary-foreground font-bold text-lg">S</span>
				</div>
				<span class="font-bold text-xl">Saffron</span>
			</a>
		</div>

		<!-- Navigation Links (Desktop) -->
		<div class="hidden md:flex items-center space-x-6">
			<a href="/" class="text-sm font-medium hover:text-primary transition-colors">
				Home
			</a>
			<a href="/about" class="text-sm font-medium hover:text-primary transition-colors">
				About
			</a>
			<a href="/demo" class="text-sm font-medium hover:text-primary transition-colors">
				Demo
			</a>
			<a href="/test" class="text-sm font-medium hover:text-primary transition-colors">
				Test
			</a>
		</div>

		<!-- Auth Buttons -->
		<div class="flex items-center space-x-4">
			<!-- Theme Toggle -->
			<ThemeToggle />
			
			{#if isLoggedIn}
				<!-- User Dropdown -->
				<div class="relative user-menu">
					<Button
						variant="ghost"
						size="sm"
						class="relative h-8 w-8 rounded-full"
						on:click={toggleUserMenu}
					>
						<User class="h-4 w-4" />
						<span class="sr-only">Open user menu</span>
					</Button>
					{#if showUserMenu}
						<div class="absolute right-0 mt-2 w-56 bg-popover border rounded-md shadow-lg z-50">
							<div class="px-3 py-2 border-b">
								<p class="text-sm font-medium leading-none">{user.name}</p>
								<p class="text-xs leading-none text-muted-foreground mt-1">{user.email}</p>
							</div>
							<div class="py-1">
								<button
									class="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center"
									on:click={handleProfile}
								>
									<User class="mr-2 h-4 w-4" />
									<span>Profile</span>
								</button>
								<hr class="my-1" />
								<button
									class="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center"
									on:click={handleLogout}
								>
									<LogIn class="mr-2 h-4 w-4" />
									<span>Log out</span>
								</button>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Login/Sign Up Buttons -->
				<div class="hidden sm:flex items-center space-x-2">
					<Button variant="ghost" size="sm" on:click={handleLogin}>
						<LogIn class="mr-2 h-4 w-4" />
						Login
					</Button>
					<Button size="sm" on:click={handleSignUp}>
						<UserPlus class="mr-2 h-4 w-4" />
						Sign Up
					</Button>
				</div>
			{/if}

			<!-- Mobile Menu -->
			<div class="md:hidden relative mobile-menu">
				<Button variant="ghost" size="sm" on:click={toggleMobileMenu}>
					<Menu class="h-5 w-5" />
					<span class="sr-only">Open menu</span>
				</Button>
				{#if showMobileMenu}
					<div class="absolute right-0 mt-2 w-56 bg-popover border rounded-md shadow-lg z-50">
						<div class="py-1">
							<a href="/" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
								Home
							</a>
							<a href="/about" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
								About
							</a>
							<a href="/demo" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
								Demo
							</a>
							<a href="/test" class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
								Test
							</a>
							{#if !isLoggedIn}
								<hr class="my-1" />
								<button
									class="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center"
									on:click={handleLogin}
								>
									<LogIn class="mr-2 h-4 w-4" />
									<span>Login</span>
								</button>
								<button
									class="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center"
									on:click={handleSignUp}
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