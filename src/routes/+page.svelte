<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentUser, isLoggedIn } from '$lib/stores/auth.js';

	// --- Vars from Hero Animation (Component 1) ---
	let mouseX = 0;
	let mouseY = 0;
	let heroElement: HTMLElement; // Bound to the main .hero-section for mouse tracking

	// --- Vars from Saffron Terminals (Component 2) ---
	let flowerStage = 0;
	let animationMode = 'saffron'; // 'saffron' or 'growth'
	let growthStage = 0;
	let animationInterval: NodeJS.Timeout;
	let physicsInterval: NodeJS.Timeout;
	let containerRef: HTMLElement; // Bound to the container where terminal windows float

	const flowerStages = ['    ', '  . ', ' .•.', '.•*•.', '.*❋*.', '*❋🌸❋*', '🌸❋🌺❋🌸'];

	interface WindowData {
		id: string;
		x: number;
		y: number;
		vx: number;
		vy: number;
		width: number;
		height: number;
		isDragging: boolean;
		element?: HTMLElement;
	}

	let windows: WindowData[] = [
		{ id: 'bonsai', x: 550, y: 50, vx: 0.2, vy: 0.1, width: 320, height: 280, isDragging: false },
		{
			id: 'schematic',
			x: 50,
			y: 400,
			vx: 0.1,
			vy: -0.15,
			width: 288,
			height: 200,
			isDragging: false
		},
		{ id: 'code', x: 750, y: 350, vx: -0.1, vy: 0.2, width: 320, height: 220, isDragging: false },
		{ id: 'graph', x: 100, y: 20, vx: 0.15, vy: 0.1, width: 256, height: 200, isDragging: false },
		{ id: 'status', x: 800, y: 100, vx: -0.2, vy: 0.15, width: 224, height: 160, isDragging: false }
	];
	// Positioned further from center with varied initial velocities for wider orbital motion

	// Function to calculate window positions based on container size
	function calculateWindowPositions() {
		if (!containerRef) return;

		const rect = containerRef.getBoundingClientRect();
		const containerWidth = rect.width;
		const containerHeight = rect.height;

		// Right side only positioning
		const rightSideWidth = containerWidth;
		const rightSideHeight = containerHeight;

		// Calculate positions in orbital pattern within the right side
		windows = windows.map((win, index) => {
			const angle = (index / windows.length) * 2 * Math.PI;
			const radius = Math.min(rightSideWidth, rightSideHeight) * 0.3; // 30% of container size

			// Center of the right side area
			const centerX = rightSideWidth / 2;
			const centerY = rightSideHeight / 2;

			// Calculate orbital position within right side
			const orbitalX = centerX + Math.cos(angle) * radius;
			const orbitalY = centerY + Math.sin(angle) * radius;

			// Ensure windows stay within bounds of right side
			const x = Math.max(10, Math.min(rightSideWidth - win.width - 10, orbitalX - win.width / 2));
			const y = Math.max(
				10,
				Math.min(rightSideHeight - win.height - 10, orbitalY - win.height / 2)
			);

			return {
				...win,
				x,
				y
			};
		});
	}

	let dragState = {
		isDragging: false,
		startX: 0,
		startY: 0,
		windowId: ''
	};

	onMount(() => {
		// Logic for Saffron flower animation
		animationInterval = setInterval(() => {
			flowerStage = (flowerStage + 1) % flowerStages.length;
		}, 1500);

		// Calculate initial window positions
		setTimeout(() => {
			calculateWindowPositions();
		}, 100); // Small delay to ensure container is rendered

		// Logic for terminal window physics
		physicsInterval = setInterval(applyPhysics, 16); // ~60fps

		// Global mouse event listeners for window dragging
		document.addEventListener('mousemove', handleWindowDragMouseMove);
		document.addEventListener('mouseup', handleWindowDragMouseUp);

		// Window resize listener to recalculate positions
		const handleResize = () => {
			calculateWindowPositions();
		};
		window.addEventListener('resize', handleResize);

		return () => {
			clearInterval(animationInterval);
			clearInterval(physicsInterval);
			document.removeEventListener('mousemove', handleWindowDragMouseMove);
			document.removeEventListener('mouseup', handleWindowDragMouseUp);
			window.removeEventListener('resize', handleResize);
			// Cleanup for heroElement listener is handled by the reactive block below
		};
	});

	// Handle heroElement mouse move listener setup and cleanup
	let currentMouseMoveHandler: ((e: MouseEvent) => void) | null = null;

	$: if (heroElement && typeof window !== 'undefined') {
		// Clean up previous listener if it exists
		if (currentMouseMoveHandler && heroElement) {
			heroElement.removeEventListener('mousemove', currentMouseMoveHandler);
		}

		// Create new handler
		currentMouseMoveHandler = (e: MouseEvent) => {
			if (heroElement) {
				const rect = heroElement.getBoundingClientRect();
				mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
				mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
			}
		};

		// Add new listener
		heroElement.addEventListener('mousemove', currentMouseMoveHandler);
	}

	// Cleanup on component destroy
	onDestroy(() => {
		if (currentMouseMoveHandler && heroElement) {
			heroElement.removeEventListener('mousemove', currentMouseMoveHandler);
		}
	});

	// --- Functions for Saffron Terminal Windows (Component 2 logic) ---
	function startDrag(event: MouseEvent, windowId: string) {
		const window = windows.find((w) => w.id === windowId);
		if (!window) return;

		window.isDragging = true;
		dragState.isDragging = true;
		dragState.windowId = windowId;
		// Calculate startX/Y relative to the window's current position
		dragState.startX = event.clientX - window.x;
		dragState.startY = event.clientY - window.y;

		window.vx = 0;
		window.vy = 0;
	}

	function handleWindowDragMouseMove(event: MouseEvent) {
		if (!dragState.isDragging) return;

		const currentWindow = windows.find((w) => w.id === dragState.windowId);
		if (!currentWindow) return;

		currentWindow.x = event.clientX - dragState.startX;
		currentWindow.y = event.clientY - dragState.startY;
		windows = [...windows]; // Trigger reactivity
	}

	function handleWindowDragMouseUp() {
		if (dragState.isDragging) {
			const currentWindow = windows.find((w) => w.id === dragState.windowId);
			if (currentWindow) {
				currentWindow.isDragging = false;
			}
		}
		dragState.isDragging = false;
		dragState.windowId = '';
	}

	function applyPhysics() {
		if (!containerRef) return;

		const physicsContainerRect = containerRef.getBoundingClientRect();
		const centerX = physicsContainerRect.width / 2;
		const centerY = physicsContainerRect.height / 2;

		// Check if we're on mobile (simplified check)
		const isMobile = window.innerWidth <= 768;

		// If mobile, disable physics and let CSS animations handle movement
		if (isMobile) {
			return;
		}

		// Define a gentle repulsion area in the center of the right side
		// to keep windows spread out nicely
		const repulsionAreaWidth = 200; // Smaller central area in right side
		const repulsionAreaHeight = 200;
		const repulsionLeft = centerX - repulsionAreaWidth / 2;
		const repulsionRight = centerX + repulsionAreaWidth / 2;
		const repulsionTop = centerY - repulsionAreaHeight / 2;
		const repulsionBottom = centerY + repulsionAreaHeight / 2;
		const repulsionZone = 50; // Margin around repulsion area

		windows = windows.map((win) => {
			if (win.isDragging) return win;

			const winCenterX = win.x + win.width / 2;
			const winCenterY = win.y + win.height / 2;

			// Check if window overlaps with central repulsion area
			const overlapsRepulsion =
				winCenterX > repulsionLeft - repulsionZone &&
				winCenterX < repulsionRight + repulsionZone &&
				winCenterY > repulsionTop - repulsionZone &&
				winCenterY < repulsionBottom + repulsionZone;

			if (overlapsRepulsion) {
				// Gentle repulsion away from center of right side
				const dx = winCenterX - centerX;
				const dy = winCenterY - centerY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance > 1) {
					const repulsionForce = 0.0008; // Gentler repulsion force
					win.vx += (dx / distance) * repulsionForce;
					win.vy += (dy / distance) * repulsionForce;
				}
			} else {
				// Gentle orbital force around the center of the right side
				const dx = centerX - winCenterX;
				const dy = centerY - winCenterY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance > 1) {
					const orbitalRadius = 300; // Orbital distance in right side
					const distanceFromIdeal = Math.abs(distance - orbitalRadius);

					// Radial force (toward/away from center to maintain orbital distance)
					const radialForce = distance < orbitalRadius ? -0.00008 : 0.00008;
					const radialMultiplier = Math.min(distanceFromIdeal / 100, 1);

					win.vx += (dx / distance) * radialForce * radialMultiplier;
					win.vy += (dy / distance) * radialForce * radialMultiplier;

					// Tangential force for orbital motion
					const tangentialForce = 0.00015;
					win.vx += (-dy / distance) * tangentialForce;
					win.vy += (dx / distance) * tangentialForce;
				}
			}

			// Apply damping
			win.vx *= 0.98; // Smooth motion
			win.vy *= 0.98;

			// Update position
			win.x += win.vx;
			win.y += win.vy;

			// Boundary collision with bounce within right side area
			const margin = 5;
			if (win.x < margin) {
				win.x = margin;
				win.vx *= -0.4;
			}
			if (win.x + win.width > physicsContainerRect.width - margin) {
				win.x = physicsContainerRect.width - win.width - margin;
				win.vx *= -0.4;
			}
			if (win.y < margin) {
				win.y = margin;
				win.vy *= -0.4;
			}
			if (win.y + win.height > physicsContainerRect.height - margin) {
				win.y = physicsContainerRect.height - win.height - margin;
				win.vy *= -0.4;
			}
			return win;
		});
	}
</script>

<!-- Base layout from Component 1's .hero-section -->
<div class="hero-section" bind:this={heroElement}>
	<!-- Background visual elements from Component 1 -->
	<div class="grain-overlay"></div>
	<div class="ambient-glow"></div>
	<div class="floating-components">
		{#each Array(12) as _, i}
			<div
				class="floating-component component-{(i % 6) + 1}"
				style="--delay: {i * 0.8}s; --duration: {20 + (i % 8)}s; --x: {Math.random() *
					100}%; --y: {Math.random() * 100}%;"
			></div>
		{/each}
	</div>
	<div class="background-traces">
		<svg class="bg-circuit" viewBox="0 0 1200 800">
			<defs>
				<linearGradient id="c1_bgTraceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" style="stop-color: transparent" />
					<stop offset="30%" style="stop-color: rgba(139, 92, 246, 0.1)" />
					<stop offset="70%" style="stop-color: rgba(139, 92, 246, 0.05)" />
					<stop offset="100%" style="stop-color: transparent" />
				</linearGradient>
			</defs>
			{#each Array(8) as _, i}
				<path
					class="bg-trace trace-bg-{i}"
					d="M{50 + i * 140},{100 + i * 80} Q{300 + i * 100},{200 + i * 60} {600 + i * 80},{150 +
						i * 90} T{1000 + i * 50},{300 + i * 40}"
					stroke="url(#c1_bgTraceGradient)"
					fill="none"
					stroke-width="1"
					style="--trace-delay: {i * 0.5}s"
				/>
			{/each}
		</svg>
	</div>

	<!-- Main content area for Component 2's elements -->
	<div class="saffron-main-content">
		<!-- Content wrapper for main layout -->
		<div class="saffron-content-wrapper">
			<!-- Left side: Text and CTA content -->
			<div class="saffron-left-content">
				<div class="saffron-hero-text-area">
					<h1 class="saffron-headline">
						<span class="saffron-headline-brand">Saffron</span>
					</h1>
					<p class="saffron-subheadline">Cultivate Your Circuits</p>
					<p class="saffron-tagline">The collaborative SPICE environment, beautifully executed.</p>
					{#if $isLoggedIn}
						<button
							class="saffron-cta-button-main"
							on:click={() => (window.location.href = '/dashboard')}
						>
							<span>> Open Dashboard</span>
						</button>
					{:else}
						<button
							class="saffron-cta-button-main"
							on:click={() => (window.location.href = '/login')}
						>
							<span>> Launch Saffron_Beta</span>
						</button>
					{/if}
				</div>
			</div>

			<!-- Right side: Floating windows container -->
			<div class="saffron-right-content" bind:this={containerRef}>
				<!-- Floating Terminal Windows from Component 2 -->
				{#each windows as win (win.id)}
					<div
						class="terminal-window"
						bind:this={win.element}
						style:left="{win.x}px"
						style:top="{win.y}px"
						style:width="{win.width}px"
						style:height="{win.height}px"
					>
						<div
							class="terminal-header"
							role="button"
							tabindex="0"
							on:mousedown|stopPropagation={(e) => startDrag(e, win.id)}
						>
							{#if win.id === 'bonsai'}
								<div class="terminal-buttons">
									<div class="term-btn r"></div>
									<div class="term-btn y"></div>
									<div class="term-btn g"></div>
								</div>
								<span class="title-text">Saffron.OS - grow_spice_flower.sh</span>
							{:else if win.id === 'schematic'}
								<span class="title-text alt">circuit_schematic.sch</span>
							{:else if win.id === 'code'}
								<span class="title-text alt">filter.cir</span>
							{:else if win.id === 'graph'}
								<span class="title-text alt">frequency_response.plot</span>
							{:else if win.id === 'status'}
								<span class="title-text status-header">system_status.log</span>
							{/if}
						</div>
						<div class="terminal-content">
							{#if win.id === 'bonsai'}
								<div class="term-text-muted">$ ./cultivate_saffron --bloom</div>
								<div class="term-text-success mb-1">
									Initializing botanical circuit simulation...
								</div>
								<div class="bonsai-flower-display">
									<div class="flower-art">
										{#if flowerStage < 4}
											<span>{flowerStages[flowerStage]}</span>
										{:else if flowerStage === 4}
											<span>.*</span><span class="flower-red">❋</span><span>*.</span>
										{:else if flowerStage === 5}
											<span>*</span><span class="flower-red">❋</span><span class="flower-yellow"
												>🌸</span
											><span class="flower-red">❋</span><span>*</span>
										{:else}
											<span class="flower-yellow">🌸</span><span class="flower-red">❋</span><span
												class="flower-main">🌺</span
											><span class="flower-red">❋</span><span class="flower-yellow">🌸</span>
										{/if}
									</div>
									<div class="term-text-faded mt-1">
										stigma_count: {flowerStage > 3 ? '3' : '0'} | precision: high
									</div>
								</div>
								<div class="term-text-accent">> Saffron operational</div>
							{:else if win.id === 'schematic'}
								<div class="term-text-muted mb-1">// RC Low-Pass Filter</div>
								<svg width="100%" height="100" viewBox="0 0 200 100" class="schematic-svg">
									<path
										d="M20 50 L40 50 L45 40 L55 60 L65 40 L75 60 L85 40 L95 50 L115 50"
										class="schematic-trace"
									/>
									<text x="67" y="75" class="schematic-label">R1</text>
									<line x1="115" y1="50" x2="135" y2="50" class="schematic-trace" /><line
										x1="135"
										y1="35"
										x2="135"
										y2="65"
										class="schematic-trace"
									/><line x1="140" y1="35" x2="140" y2="65" class="schematic-trace" /><line
										x1="140"
										y1="50"
										x2="160"
										y2="50"
										class="schematic-trace"
									/>
									<text x="130" y="85" class="schematic-label">C1</text>
									<line x1="160" y1="50" x2="160" y2="70" class="schematic-trace" /><line
										x1="150"
										y1="70"
										x2="170"
										y2="70"
										class="schematic-trace"
									/>
								</svg>
							{:else if win.id === 'code'}
								<div class="term-text-muted">* RC Low-Pass Filter</div>
								<div class="term-text-bright">V1 N001 0 AC 1 0</div>
								<div class="term-text-accent">R1 N001 N002 1K</div>
								<div class="term-text-accent">C1 N002 0 100nF</div>
								<div class="term-text-muted">.AC DEC 100 1 1MEG</div>
								<div class="term-text-success">.END</div>
								<div class="term-text-warning mt-1">> Simulation ready</div>
							{:else if win.id === 'graph'}
								<svg width="100%" height="100%" viewBox="0 0 200 120" class="graph-svg">
									<defs
										><pattern
											id="c2_graph_grid"
											width="20"
											height="20"
											patternUnits="userSpaceOnUse"
											><path d="M 20 0 L 0 0 0 20" fill="none" class="graph-grid-line" /></pattern
										></defs
									>
									<rect width="200" height="120" fill="url(#c2_graph_grid)" />
									<line x1="20" y1="100" x2="180" y2="100" class="graph-axis-line" /><line
										x1="20"
										y1="20"
										x2="20"
										y2="100"
										class="graph-axis-line"
									/>
									<path
										d="M20 30 Q60 30 100 50 Q140 70 180 90"
										stroke="url(#c2_graph_rainbow)"
										class="graph-curve-line"
									/>
									<defs
										><linearGradient id="c2_graph_rainbow" x1="0%" y1="0%" x2="100%" y2="0%"
											><stop offset="0%" class="rainbow-stop1" /><stop
												offset="50%"
												class="rainbow-stop2"
											/><stop offset="100%" class="rainbow-stop3" /></linearGradient
										></defs
									>
									<text x="100" y="115" class="graph-label">Frequency (Hz)</text>
									<text x="10" y="60" class="graph-label" transform="rotate(-90 10 60)"
										>Gain (dB)</text
									>
								</svg>
							{:else if win.id === 'status'}
								<div class="term-text-success">● SPICE Engine: Online</div>
								<div class="term-text-success">● Collaboration: Active</div>
								<div class="term-text-warning">● Synthesis: Running</div>
								<div class="term-text-accent">● Throughput: Max</div>
								<div class="term-text-muted mt-1">Active Nodes: 1,247</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<!-- End of saffron-content-wrapper -->

	<!-- Mobile Info Panel (shown only on mobile) -->
	<div class="mobile-info-panel">
		<div class="term-text-accent mb-2">⚡ Saffron Features</div>
		<div class="term-text-success">● SPICE Engine: Active</div>
		<div class="term-text-success">● Circuit Simulator: Ready</div>
		<div class="term-text-warning">● Collaboration Tools: Available</div>
		<div class="term-text-muted mt-2 text-xs">
			Tap "Launch Saffron_Beta" to start designing circuits
		</div>
	</div>
</div>

<style>
	/* Import Inter font from Google Fonts (from Component 1) */
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
	/* It's often better to include this in your main HTML file or a global CSS file */

	/* CSS Variables from Component 1 */
	:root {
		--black-void: #000000;
		--black-deep: #0d0d0d;
		--black-surface: #1a1a1a;
		--purple-primary: #8b5cf6; /* Main purple */
		--purple-bright: #a855f7; /* Brighter purple */
		--purple-glow: #8b5cf6; /* Glow color, same as primary here */
		--gray-light: #f8fafc;
		--gray-muted: #64748b;
		--spectral-red: #ef4444;
		--spectral-orange: #f97316;
		--spectral-yellow: #eab308;
		--spectral-green: #22c55e;
		--spectral-cyan: #06b6d4;
		--spectral-blue: #3b82f6;
		--spectral-indigo: #6366f1;
		--spectral-violet: #8b5cf6; /* Same as primary */
	}

	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	/* Fix overscroll behavior to prevent white areas */

	/* Ensure the main app container has dark background */
	:global(#svelte) {
		body {
			background-color: var(--black-deep);
			overscroll-behavior: none; /* Disable overscroll bounce */
			overflow-x: hidden; /* Prevent horizontal scroll */
		}
		background-color: var(--black-deep);
		min-height: 100vh;
	}

	/* Dark scrollbar styling for this page */
	:global(::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: var(--black-deep);
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: #404040;
		border-radius: 4px;
		border: 1px solid #2a2a2a;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: #505050;
	}

	:global(::-webkit-scrollbar-corner) {
		background: var(--black-deep);
	}

	/* Firefox scrollbar styling */
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: #404040 var(--black-deep);
	}

	/* Styles for .hero-section and its background elements (from Component 1) */
	.hero-section {
		min-height: 100vh;
		background: radial-gradient(ellipse at center, var(--black-deep) 0%, var(--black-void) 70%);
		color: var(--gray-light);
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
		display: flex; /* Will center .saffron-main-content */
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden; /* Important */
	}

	.grain-overlay {
		position: absolute;
		inset: 0;
		z-index: 1;
		background-image:
			radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 25%),
			radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 25%),
			url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E");
		opacity: 0.02;
		pointer-events: none;
		mix-blend-mode: multiply;
	}
	.ambient-glow {
		position: absolute;
		inset: 0;
		z-index: 0;
		background:
			radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.1) 0%, transparent 50%);
		pointer-events: none;
	}
	.floating-components {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}
	.floating-component {
		position: absolute;
		left: var(--x);
		top: var(--y);
		opacity: 0.4;
		animation: componentFloat var(--duration, 25s) infinite linear;
		animation-delay: var(--delay, 0s);
	}
	.component-1 {
		width: 20px;
		height: 6px;
		background: linear-gradient(90deg, transparent, var(--purple-glow), transparent);
		border-radius: 3px;
		box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
	}
	.component-2 {
		width: 8px;
		height: 16px;
		background: linear-gradient(0deg, transparent, var(--spectral-cyan), transparent);
		border-radius: 2px;
		box-shadow: 0 0 6px rgba(6, 182, 212, 0.6);
	}
	.component-3 {
		width: 16px;
		height: 12px;
		background: linear-gradient(45deg, var(--black-surface), var(--purple-glow));
		border: 1px solid rgba(139, 92, 246, 0.3);
		border-radius: 2px;
		box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
	}
	.component-4 {
		width: 12px;
		height: 4px;
		background: linear-gradient(90deg, var(--spectral-green), var(--spectral-yellow));
		border-radius: 2px;
		box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
	}
	.component-5 {
		width: 10px;
		height: 10px;
		background: radial-gradient(circle, var(--purple-bright), var(--purple-glow));
		border-radius: 50%;
		box-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
	}
	.component-6 {
		width: 18px;
		height: 8px;
		background: linear-gradient(90deg, var(--spectral-orange), var(--spectral-red));
		border-radius: 4px;
		box-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
	}
	.background-traces {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		opacity: 0.3;
	}
	.bg-circuit {
		width: 100%;
		height: 100%;
	}
	.bg-trace {
		stroke-dasharray: 500;
		stroke-dashoffset: 500;
		animation: bgTraceFlow 15s ease-in-out infinite;
		animation-delay: var(--trace-delay, 0s);
	}

	/* Styles for Circuit Components */
	.component {
		position: absolute;
		border: 1px solid rgba(139, 92, 246, 0.4);
		box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
		animation: componentGlow 3s ease-in-out infinite;
	}
	.resistor {
		width: 24px;
		height: 8px;
		background: linear-gradient(
			90deg,
			var(--spectral-yellow),
			var(--spectral-orange),
			var(--spectral-red),
			var(--spectral-orange),
			var(--spectral-yellow)
		);
		border-radius: 4px;
	}
	.resistor-1 {
		top: 25%;
		left: 20%;
		animation-delay: 0s;
	}
	.capacitor {
		width: 12px;
		height: 20px;
		background: linear-gradient(0deg, var(--spectral-cyan), var(--spectral-blue));
		border-radius: 2px;
	}
	.capacitor-1 {
		top: 60%;
		left: 70%;
		animation-delay: 0.8s;
	}
	.ic {
		width: 32px;
		height: 20px;
		background: linear-gradient(45deg, var(--black-surface), rgba(139, 92, 246, 0.2));
		border-radius: 4px;
		border: 2px solid rgba(139, 92, 246, 0.6);
	}
	.ic-1 {
		top: 40%;
		left: 40%;
		transform: translate(-50%, -50%);
		animation-delay: 1.2s;
	}
	.transistor {
		width: 16px;
		height: 16px;
		background: radial-gradient(circle, var(--purple-bright), var(--purple-glow));
		border-radius: 50%;
		border: 1px solid rgba(168, 85, 247, 0.8);
	}
	.transistor-1 {
		top: 70%;
		left: 25%;
		animation-delay: 1.6s;
	}
	.diode {
		width: 20px;
		height: 6px;
		background: linear-gradient(90deg, var(--spectral-green), var(--spectral-yellow));
		border-radius: 3px;
		position: relative;
	}
	.diode::after {
		content: '';
		position: absolute;
		right: -2px;
		top: -2px;
		width: 10px;
		height: 10px;
		border-right: 2px solid var(--spectral-green);
		border-top: 2px solid var(--spectral-green);
		transform: rotate(45deg);
	}
	.diode-1 {
		top: 20%;
		right: 25%;
		animation-delay: 2s;
	}
	.circuit-node {
		position: absolute;
		width: 12px;
		height: 12px;
		background: var(--purple-bright);
		border-radius: 50%;
		box-shadow:
			0 0 20px var(--purple-glow),
			0 0 40px var(--purple-glow);
		animation: nodePulse 3s ease-in-out infinite;
	}
	.node-1 {
		top: 20%;
		left: 20%;
		animation-delay: 0s;
	}
	.node-2 {
		top: 20%;
		right: 20%;
		animation-delay: 0.6s;
	}
	.node-3 {
		bottom: 20%;
		left: 20%;
		animation-delay: 1.2s;
	}
	.node-4 {
		bottom: 20%;
		right: 20%;
		animation-delay: 1.8s;
	}
	.node-5 {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		animation-delay: 2.4s;
	}
	.circuit-traces {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.trace {
		fill: none;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-dasharray: 300;
		stroke-dashoffset: 300;
		animation: traceAnimate 6s ease-in-out infinite;
	}
	.prism-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}
	.light-beam {
		position: absolute;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(139, 92, 246, 0.8) 50%,
			transparent 100%
		);
		transform-origin: center;
		opacity: 0.6;
		animation: beamSweep 8s ease-in-out infinite;
	}
	.beam-1 {
		top: 30%;
		left: 0;
		width: 100%;
		height: 2px;
		animation-delay: 0s;
	}
	.beam-2 {
		top: 0;
		left: 50%;
		width: 2px;
		height: 100%;
		animation-delay: 2.6s;
	}
	.spectral-refraction {
		position: absolute;
		height: 1px;
		opacity: 0;
		animation: spectralSweep 12s ease-in-out infinite;
		filter: blur(0.5px);
	}
	.refraction-1 {
		top: 25%;
		left: 20%;
		width: 60%;
		background: linear-gradient(
			90deg,
			var(--spectral-red),
			var(--spectral-orange),
			var(--spectral-yellow),
			var(--spectral-green),
			var(--spectral-cyan),
			var(--spectral-blue)
		);
		animation-delay: 1s;
	}
	.refraction-2 {
		top: 50%;
		left: 10%;
		width: 80%;
		background: linear-gradient(
			90deg,
			var(--spectral-violet),
			var(--spectral-indigo),
			var(--spectral-blue),
			var(--spectral-cyan),
			var(--spectral-green),
			var(--spectral-yellow)
		);
		animation-delay: 5s;
	}
	.refraction-3 {
		top: 75%;
		left: 30%;
		width: 40%;
		background: linear-gradient(
			90deg,
			var(--spectral-orange),
			var(--spectral-yellow),
			var(--spectral-green),
			var(--spectral-cyan),
			var(--spectral-blue),
			var(--spectral-violet)
		);
		animation-delay: 9s;
	}
	.holographic-shimmer {
		position: absolute;
		inset: 0;
		border-radius: 20px;
		background:
			linear-gradient(45deg, transparent 30%, rgba(139, 92, 246, 0.1) 50%, transparent 70%),
			linear-gradient(-45deg, transparent 30%, rgba(168, 85, 247, 0.1) 50%, transparent 70%);
		background-size: 200% 200%;
		animation: shimmerMove 8s ease-in-out infinite;
	}
	.energy-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 150%;
		height: 150%;
		border: 1px solid rgba(139, 92, 246, 0.2);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		animation: ringPulse 6s ease-in-out infinite;
	}
	.core-glow {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
		transform: translate(-50%, -50%);
		filter: blur(40px);
		animation: coreGlowPulse 6s ease-in-out infinite;
	}

	/* Keyframes from Component 1 */
	@keyframes componentFloat {
		0% {
			transform: translate3d(0, 0, 0) rotate(0deg) scale(0.8);
			opacity: 0.2;
		}
		25% {
			transform: translate3d(20px, -30px, 10px) rotate(90deg) scale(1);
			opacity: 0.6;
		}
		50% {
			transform: translate3d(-10px, -60px, 20px) rotate(180deg) scale(0.9);
			opacity: 0.4;
		}
		75% {
			transform: translate3d(-30px, -30px, 10px) rotate(270deg) scale(1.1);
			opacity: 0.7;
		}
		100% {
			transform: translate3d(0, 0, 0) rotate(360deg) scale(0.8);
			opacity: 0.2;
		}
	}
	@keyframes bgTraceFlow {
		0% {
			stroke-dashoffset: 500;
			opacity: 0.1;
		}
		20% {
			opacity: 0.3;
		}
		50% {
			stroke-dashoffset: 0;
			opacity: 0.6;
		}
		80% {
			opacity: 0.3;
		}
		100% {
			stroke-dashoffset: -500;
			opacity: 0.1;
		}
	}
	@keyframes componentGlow {
		0%,
		100% {
			box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
			border-color: rgba(139, 92, 246, 0.4);
		}
		50% {
			box-shadow:
				0 0 25px rgba(139, 92, 246, 0.6),
				0 0 40px rgba(139, 92, 246, 0.3);
			border-color: rgba(139, 92, 246, 0.8);
		}
	}
	@keyframes nodePulse {
		0%,
		100% {
			transform: scale(1);
			box-shadow:
				0 0 20px var(--purple-glow),
				0 0 40px var(--purple-glow);
		}
		50% {
			transform: scale(1.2);
			box-shadow:
				0 0 30px var(--purple-glow),
				0 0 60px var(--purple-glow);
		}
	}
	@keyframes traceAnimate {
		0% {
			stroke-dashoffset: 300;
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		80% {
			opacity: 1;
		}
		100% {
			stroke-dashoffset: 0;
			opacity: 0;
		}
	}
	@keyframes beamSweep {
		0%,
		100% {
			opacity: 0;
			transform: scaleX(0);
		}
		50% {
			opacity: 0.6;
			transform: scaleX(1);
		}
	}
	@keyframes spectralSweep {
		0%,
		85%,
		100% {
			opacity: 0;
			transform: scaleX(0) translateX(-50px);
		}
		15%,
		70% {
			opacity: 0.9;
			transform: scaleX(1) translateX(0);
		}
		50% {
			opacity: 1;
			transform: scaleX(1.1) translateX(10px);
		}
	}
	@keyframes shimmerMove {
		0%,
		100% {
			background-position:
				0% 0%,
				100% 100%;
			opacity: 0.3;
		}
		50% {
			background-position:
				100% 100%,
				0% 0%;
			opacity: 0.7;
		}
	}
	@keyframes ringPulse {
		0%,
		100% {
			transform: translate(-50%, -50%) scale(1) rotate(0deg);
			border-color: rgba(139, 92, 246, 0.2);
		}
		50% {
			transform: translate(-50%, -50%) scale(1.1) rotate(180deg);
			border-color: rgba(139, 92, 246, 0.5);
		}
	}
	@keyframes coreGlowPulse {
		0%,
		100% {
			opacity: 0.4;
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			opacity: 0.6;
			transform: translate(-50%, -50%) scale(1.1);
		}
	}

	/* Styles for Saffron Content (Component 2 elements, adapted) */
	.saffron-main-content {
		position: relative; /* For absolute positioning of terminals */
		z-index: 10; /* On top of background elements */
		width: 100%; /* Take up full width for more floating space */
		height: 100%; /* Take up full height for more floating space */
		max-width: none; /* Remove width constraint */
		max-height: none; /* Remove height constraint */
		display: flex;
		flex-direction: column; /* Stack auth banner on top */
		align-items: center;
		justify-content: center; /* Center vertically */
		padding: 2rem 3rem; /* Increased horizontal padding for better margins */
		margin: 0 auto; /* Center the content */
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
		overflow: hidden; /* Terminals are positioned absolutely within this */
	}

	/* Content area wrapper for main content */
	.saffron-content-wrapper {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 100%;
		margin-top: 0;
	}

	/* Left side content area */
	.saffron-left-content {
		flex: 0 0 45%; /* Take up 45% of the width, no grow/shrink */
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-right: 3rem; /* Increased padding for better separation */
		margin-left: 1rem; /* Add left margin for breathing room */
		z-index: 20; /* Above floating windows */
	}

	/* Right side content area for floating windows */
	.saffron-right-content {
		flex: 1; /* Take up remaining space */
		position: relative;
		height: 100vh; /* Full viewport height for floating space */
		min-height: 600px; /* Minimum height for proper floating */
	}

	.saffron-hero-text-area {
		text-align: left; /* Left-align instead of center */
		margin-bottom: 3rem; /* More space below headline block */
	}
	.saffron-headline {
		font-size: clamp(2.5rem, 6vw, 4rem); /* Adjusted from C2 */
		font-weight: 700; /* bold */
		color: var(--gray-light); /* text-white */
		margin-bottom: 0.5rem; /* mb-4 */
		letter-spacing: -0.025em; /* tracking-tight */
	}
	.saffron-headline-brand {
		color: var(--purple-primary); /* text-purple-400 */
	}
	.saffron-subheadline {
		font-size: clamp(1.25rem, 3vw, 1.75rem); /* Adjusted from C2 */
		color: #d1d5db; /* text-gray-300 */
		margin-bottom: 1rem; /* mb-8 */
	}
	.saffron-tagline {
		font-size: clamp(0.9rem, 2vw, 1.1rem); /* Adjusted from C2 */
		color: #9ca3af; /* text-gray-400 */
		margin-bottom: 1.5rem; /* mb-12 */
	}
	.saffron-cta-button-main {
		font-size: 1rem; /* text-lg */
		background-color: var(--purple-primary); /* bg-purple-600 */
		color: var(--gray-light); /* text-white */
		padding: 0.75rem 1.5rem; /* px-8 py-4 (adjusted) */
		border: 1px solid var(--purple-glow); /* border-purple-400 */
		transition: all 0.3s ease;
		cursor: pointer;
	}
	.saffron-cta-button-main:hover {
		background-color: var(--purple-bright); /* hover:bg-purple-500 */
		box-shadow: 0 4px 15px color-mix(in srgb, var(--purple-bright) 25%, transparent); /* hover:shadow-lg hover:shadow-purple-500/25 */
	}
	.saffron-cta-button-main span {
		transition: color 0.3s ease;
	}
	.saffron-cta-button-main:hover span {
		color: var(--black-deep); /* group-hover:text-purple-100 (using black for contrast) */
	}

	/* Terminal Window Styles */
	.terminal-window {
		position: absolute; /* Crucial for physics */
		background: rgba(13, 13, 13, 0.85); /* Darker, like C1's board */
		backdrop-filter: blur(10px);
		border: 1px solid rgba(139, 92, 246, 0.25); /* --purple-primary with alpha */
		box-shadow:
			0 10px 30px rgba(0, 0, 0, 0.3),
			0 0 15px rgba(139, 92, 246, 0.1);
		display: flex;
		flex-direction: column;
		overflow: hidden; /* Important */
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
		border-radius: 6px; /* Subtle rounding */
		transition:
			box-shadow 0.3s ease,
			border-color 0.3s ease;
	}
	.terminal-window:hover {
		/* animation: terminalFloatAnim 3s ease-in-out infinite; */
		border-color: rgba(139, 92, 246, 0.5);
		box-shadow:
			0 15px 40px rgba(0, 0, 0, 0.4),
			0 0 25px rgba(139, 92, 246, 0.2);
	}
	@keyframes terminalFloatAnim {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.terminal-header {
		background-color: rgba(26, 26, 26, 0.7); /* --black-surface with alpha */
		border-bottom: 1px solid rgba(139, 92, 246, 0.2);
		padding: 0.3rem 0.6rem; /* py-2 px-4 */
		display: flex;
		align-items: center;
		cursor: move;
		user-select: none;
	}
	.terminal-header .title-text {
		font-size: 0.75rem; /* text-sm */
		color: var(--purple-primary);
		margin-left: 0.5rem;
	}
	.terminal-header .title-text.alt {
		color: #9ca3af; /* text-gray-400 */
	}
	.terminal-header .title-text.status-header {
		color: var(--spectral-green);
	}
	.terminal-buttons {
		display: flex;
		gap: 0.4rem;
	}
	.term-btn {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
	}
	.term-btn.r {
		background-color: var(--spectral-red);
	}
	.term-btn.y {
		background-color: var(--spectral-yellow);
	}
	.term-btn.g {
		background-color: var(--spectral-green);
	}

	.terminal-content {
		padding: 0.75rem;
		font-size: 0.75rem; /* text-xs / text-sm */
		flex-grow: 1;
		overflow-y: auto;
		line-height: 1.5;
		color: var(--gray-light);
	}
	.term-text-muted {
		color: var(--gray-muted);
	}
	.term-text-faded {
		color: color-mix(in srgb, var(--gray-muted) 70%, transparent);
	}
	.term-text-success {
		color: var(--spectral-green);
	}
	.term-text-accent {
		color: var(--purple-primary);
	}
	.term-text-warning {
		color: var(--spectral-orange);
	}
	.term-text-bright {
		color: var(--gray-light);
	}
	.mb-1 {
		margin-bottom: 0.25rem;
	}
	.mt-1 {
		margin-top: 0.25rem;
	}
	.mb-2 {
		margin-bottom: 0.5rem;
	}
	.mt-2 {
		margin-top: 0.5rem;
	}
	.text-xs {
		font-size: 0.7rem;
	}

	.bonsai-flower-display {
		text-align: center;
		padding: 1rem 0;
	}
	.flower-art {
		font-size: 2.5rem;
		line-height: 1;
		color: var(--purple-primary);
		transition: all 0.5s ease;
	}
	.flower-art .flower-red {
		color: var(--spectral-red);
	}
	.flower-art .flower-yellow {
		color: var(--spectral-yellow);
	}
	.flower-art .flower-main {
		color: var(--purple-bright);
	}

	.schematic-svg .schematic-trace {
		stroke: var(--purple-primary);
		stroke-width: 2;
		fill: none;
	}
	.schematic-svg .schematic-label {
		fill: var(--purple-primary);
		font-size: 0.7rem;
	}

	.graph-svg .graph-grid-line {
		stroke: rgba(100, 100, 100, 0.2);
		stroke-width: 0.5;
	}
	.graph-svg .graph-axis-line {
		stroke: var(--gray-muted);
		stroke-width: 1;
	}
	.graph-svg .graph-curve-line {
		stroke-width: 2;
		fill: none;
	}
	.graph-svg .rainbow-stop1 {
		stop-color: var(--purple-primary);
	}
	.graph-svg .rainbow-stop2 {
		stop-color: #ec4899;
	} /* pinkish */
	.graph-svg .rainbow-stop3 {
		stop-color: var(--spectral-orange);
	}
	.graph-svg .graph-label {
		fill: var(--gray-muted);
		font-size: 0.65rem;
		text-anchor: middle;
	}

	/* Circuit 3D Window Styles */
	.circuit-3d-container {
		position: relative;
		width: 100%;
		height: 100px; /* Reduced from 120px */
		perspective: 1000px;
		overflow: hidden;
		border-radius: 6px;
	}

	.circuit-board-3d {
		position: relative;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			135deg,
			rgba(139, 92, 246, 0.05) 0%,
			rgba(168, 85, 247, 0.08) 50%,
			rgba(139, 92, 246, 0.05) 100%
		);
		border: 1px solid rgba(139, 92, 246, 0.2);
		border-radius: 8px;
		transform-style: preserve-3d;
	}

	.circuit-board-3d .component {
		position: absolute;
		border-radius: 2px; /* Slightly smaller border radius */
		transition: all 0.3s ease;
	}

	.circuit-board-3d .resistor {
		width: 16px;
		height: 6px;
		background: linear-gradient(90deg, #8b5cf6, #a855f7);
		top: 20%;
		left: 15%;
		animation: componentGlow 4s ease-in-out infinite;
	}

	.circuit-board-3d .capacitor {
		width: 10px;
		height: 12px;
		background: linear-gradient(180deg, #ec4899, #f97316);
		top: 60%;
		left: 25%;
		animation: componentGlow 4s ease-in-out infinite 0.8s;
	}

	.circuit-board-3d .ic {
		width: 20px;
		height: 10px;
		background: linear-gradient(45deg, #059669, #0ea5e9);
		top: 40%;
		left: 50%;
		animation: componentGlow 4s ease-in-out infinite 1.6s;
	}

	.circuit-board-3d .transistor {
		width: 8px;
		height: 8px;
		background: radial-gradient(circle, #f59e0b, #ef4444);
		top: 70%;
		left: 60%;
		animation: componentGlow 4s ease-in-out infinite 2.4s;
	}

	.circuit-board-3d .diode {
		width: 14px;
		height: 5px;
		background: linear-gradient(90deg, #10b981, #3b82f6);
		top: 30%;
		left: 75%;
		animation: componentGlow 4s ease-in-out infinite 3.2s;
	}

	.circuit-board-3d .circuit-node {
		position: absolute;
		width: 3px;
		height: 3px;
		background: #8b5cf6;
		border-radius: 50%;
		animation: nodePulse 3s ease-in-out infinite;
	}

	.circuit-board-3d .node-1 {
		top: 25%;
		left: 20%;
		animation-delay: 0s;
	}
	.circuit-board-3d .node-2 {
		top: 25%;
		right: 20%;
		animation-delay: 0.6s;
	}
	.circuit-board-3d .node-3 {
		bottom: 25%;
		left: 20%;
		animation-delay: 1.2s;
	}
	.circuit-board-3d .node-4 {
		bottom: 25%;
		right: 20%;
		animation-delay: 1.8s;
	}
	.circuit-board-3d .node-5 {
		top: 50%;
		left: 50%;
		animation-delay: 2.4s;
	}

	/* Saffron Hero Text Area */
	.saffron-hero-text-area {
		margin-bottom: 3rem; /* Add space between hero and CTA sections */
	}

	/* Saffron CTA Section */
	.saffron-cta-area {
		text-align: left; /* Left-align instead of center */
		padding-top: 2rem; /* Add top padding for visual separation */
		margin-top: 2rem; /* Add top margin for extra space */
		border-top: 1px solid rgba(139, 92, 246, 0.1); /* Subtle separator line */
		padding-top: 2rem; /* Padding above the border */
	}
	.saffron-cta-headline {
		font-size: clamp(1.2rem, 3vw, 1.8rem);
		color: var(--gray-light);
		margin-bottom: 1.5rem;
		margin-top: 0.5rem; /* Small top margin for breathing room */
	}
	.saffron-cta-highlight {
		color: var(--purple-primary);
	}
	.saffron-cta-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: flex-start; /* Left-align buttons */
	}
	@media (min-width: 768px) {
		.saffron-cta-buttons {
			flex-direction: row;
			justify-content: flex-start; /* Left-align buttons on desktop */
		}
	}
	.saffron-cta-button-primary,
	.saffron-cta-button-secondary {
		font-size: 0.9rem;
		padding: 0.6rem 1.2rem;
		border: 2px solid var(--purple-primary);
		transition: all 0.3s ease;
		cursor: pointer;
		min-width: 200px;
	}
	.saffron-cta-button-primary {
		background-color: var(--purple-primary);
		color: var(--black-deep);
	}
	.saffron-cta-button-primary:hover {
		background-color: var(--purple-bright);
		border-color: var(--purple-bright);
	}
	.saffron-cta-button-secondary {
		background-color: transparent;
		color: var(--purple-primary);
	}
	.saffron-cta-button-secondary:hover {
		background-color: var(--purple-primary);
		color: var(--black-deep);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.circuit-core {
			width: 200px;
			height: 200px;
		} /* Smaller 3D circuit */

		/* Mobile layout: stack vertically instead of side-by-side */
		.saffron-main-content {
			width: 90%; /* More breathing room on mobile */
			height: 95%;
			padding: 1.5rem; /* Increased padding for mobile */
			margin: 0 auto; /* Center the content */
			flex-direction: column; /* Stack vertically on mobile */
			justify-content: center;
		}

		.saffron-left-content {
			flex: none; /* Remove flex constraints */
			padding-right: 0; /* Remove right padding */
			padding: 0 1rem; /* Add horizontal padding for mobile */
			margin-left: 0; /* Reset left margin */
			text-align: center; /* Center-align text on mobile */
		}

		.saffron-hero-text-area {
			margin-bottom: 2rem; /* Adjust spacing for mobile */
		}

		.saffron-cta-area {
			padding-top: 1.5rem; /* Reduce top padding on mobile */
			margin-top: 1.5rem; /* Reduce top margin on mobile */
		}

		.saffron-right-content {
			display: none; /* Hide the floating windows container */
		}

		.saffron-hero-text-area {
			text-align: center; /* Center-align on mobile */
			margin-bottom: 2rem; /* Adjust spacing */
		}

		.saffron-cta-area {
			text-align: center; /* Center-align CTA on mobile */
		}

		.saffron-cta-buttons {
			align-items: center; /* Center-align buttons on mobile */
		}

		/* Hide floating windows completely on mobile */
		.terminal-window {
			display: none !important;
		}

		/* Make headline and content more mobile-friendly */
		.saffron-headline {
			font-size: 2.5rem;
		}

		.saffron-subheadline {
			font-size: 1.1rem;
		}

		.saffron-tagline {
			font-size: 0.9rem;
		}

		/* Adjust floating components for mobile */
		.floating-components {
			opacity: 0.3;
		}

		.floating-component {
			animation-duration: 12s;
		}

		/* Show a mobile-friendly info panel instead */
		.mobile-info-panel {
			display: block;
			position: fixed;
			bottom: 20px;
			left: 20px;
			right: 20px;
			background: rgba(13, 13, 13, 0.95);
			border: 1px solid rgba(139, 92, 246, 0.3);
			border-radius: 12px;
			padding: 1rem;
			backdrop-filter: blur(20px);
			z-index: 100;
		}
	}

	/* Hide mobile info panel on desktop */
	.mobile-info-panel {
		display: none;
	}
</style>
