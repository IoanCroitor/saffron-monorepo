<script lang="ts">
	import { onMount } from 'svelte';
	
	let showHologram = false;
	let mouseX = 0;
	let mouseY = 0;
	let heroElement: HTMLElement;
	
	onMount(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (heroElement) {
				const rect = heroElement.getBoundingClientRect();
				mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
				mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
			}
		};
		
		heroElement?.addEventListener('mousemove', handleMouseMove);
		
		return () => {
			heroElement?.removeEventListener('mousemove', handleMouseMove);
		};
	});
</script>

<div class="hero-section" bind:this={heroElement}>
	<div class="grain-overlay"></div>
	<div class="ambient-glow"></div>
	
	<!-- Floating circuit components for depth -->
	<div class="floating-components">
		{#each Array(12) as _, i}
			<div class="floating-component component-{(i % 6) + 1}" 
				 style="--delay: {i * 0.8}s; --duration: {20 + (i % 8)}s; --x: {Math.random() * 100}%; --y: {Math.random() * 100}%;">
			</div>
		{/each}
	</div>
	
	<!-- Background circuit traces -->
	<div class="background-traces">
		<svg class="bg-circuit" viewBox="0 0 1200 800">
			<defs>
				<linearGradient id="bgTraceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" style="stop-color: transparent"/>
					<stop offset="30%" style="stop-color: rgba(139, 92, 246, 0.1)"/>
					<stop offset="70%" style="stop-color: rgba(139, 92, 246, 0.05)"/>
					<stop offset="100%" style="stop-color: transparent"/>
				</linearGradient>
			</defs>
			
			{#each Array(8) as _, i}
				<path class="bg-trace trace-bg-{i}" 
					  d="M{50 + i * 140},{100 + i * 80} Q{300 + i * 100},{200 + i * 60} {600 + i * 80},{150 + i * 90} T{1000 + i * 50},{300 + i * 40}"
					  stroke="url(#bgTraceGradient)" 
					  fill="none" 
					  stroke-width="1"
					  style="--trace-delay: {i * 0.5}s"/>
			{/each}
		</svg>
	</div>
	
	<div class="content-wrapper">
		<!-- Central 3D Circuit Element -->
		<div class="central-3d-container" style="transform: rotateX({mouseY * 5}deg) rotateY({mouseX * 5}deg)">
			<div class="circuit-core">
				<!-- Main circuit PCB -->
				<div class="circuit-board">
					<!-- Circuit components -->
					<div class="component resistor resistor-1"></div>
					<div class="component capacitor capacitor-1"></div>
					<div class="component ic ic-1"></div>
					<div class="component transistor transistor-1"></div>
					<div class="component diode diode-1"></div>
					
					<!-- Connection nodes -->
					<div class="circuit-node node-1"></div>
					<div class="circuit-node node-2"></div>
					<div class="circuit-node node-3"></div>
					<div class="circuit-node node-4"></div>
					<div class="circuit-node node-5"></div>
					<div class="circuit-node node-6"></div>
				</div>
				
				<!-- Animated circuit traces -->
				<svg class="circuit-traces" viewBox="0 0 300 300">
					<defs>
						<linearGradient id="traceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" style="stop-color: transparent"/>
							<stop offset="20%" style="stop-color: var(--purple-glow); stop-opacity: 0.3"/>
							<stop offset="50%" style="stop-color: var(--purple-bright); stop-opacity: 1"/>
							<stop offset="80%" style="stop-color: var(--spectral-cyan); stop-opacity: 0.7"/>
							<stop offset="100%" style="stop-color: transparent"/>
						</linearGradient>
						
						<linearGradient id="powerTrace" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" style="stop-color: transparent"/>
							<stop offset="30%" style="stop-color: var(--spectral-red); stop-opacity: 0.8"/>
							<stop offset="70%" style="stop-color: var(--spectral-orange); stop-opacity: 1"/>
							<stop offset="100%" style="stop-color: transparent"/>
						</linearGradient>
						
						<filter id="glow">
							<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
							<feMerge> 
								<feMergeNode in="coloredBlur"/>
								<feMergeNode in="SourceGraphic"/>
							</feMerge>
						</filter>
					</defs>
					
					<!-- Main signal traces -->
					<path class="trace signal-trace" d="M50,80 L120,80 L120,150 L200,150 L200,220" stroke="url(#traceGradient)" filter="url(#glow)"/>
					<path class="trace signal-trace" d="M80,50 L80,120 L150,120 L150,190 L220,190" stroke="url(#traceGradient)" filter="url(#glow)"/>
					<path class="trace signal-trace" d="M250,80 L180,80 L180,150 L120,150" stroke="url(#traceGradient)" filter="url(#glow)"/>
					
					<!-- Power traces -->
					<path class="trace power-trace" d="M20,50 L280,50" stroke="url(#powerTrace)" filter="url(#glow)"/>
					<path class="trace power-trace" d="M20,250 L280,250" stroke="url(#powerTrace)" filter="url(#glow)"/>
					
					<!-- Complex routing -->
					<path class="trace complex-trace" d="M50,150 Q100,100 150,150 T250,120" stroke="url(#traceGradient)" filter="url(#glow)"/>
					<path class="trace complex-trace" d="M150,200 Q200,160 250,200 Q220,240 180,220" stroke="url(#traceGradient)" filter="url(#glow)"/>
				</svg>
				
				<!-- Enhanced prismatic effects -->
				<div class="prism-container">
					<div class="light-beam beam-1"></div>
					<div class="light-beam beam-2"></div>
					<div class="spectral-refraction refraction-1"></div>
					<div class="spectral-refraction refraction-2"></div>
					<div class="spectral-refraction refraction-3"></div>
					<div class="holographic-shimmer"></div>
				</div>
				
				<!-- Central core glow -->
				<div class="core-glow"></div>
				<div class="energy-ring"></div>
			</div>
		</div>

		<!-- Typography Section -->
		<div class="hero-text">
			<h1 class="headline">
				<span class="headline-word">Saffron</span>
				<span class="headline-separator">:</span>
				<span class="headline-tagline">Circuit Simulation, Reimagined</span>
			</h1>
			<p class="subheadline">Design. Simulate. Collaborate. Beyond Limits.</p>
		</div>

		<!-- Interactive Holographic Panels - More Integrated -->
		<div class="integrated-analysis">
			<div 
				class="analysis-trigger"
				on:mouseenter={() => showHologram = true}
				on:mouseleave={() => showHologram = false}
			>
				<div class="trigger-glow"></div>
			</div>
			
			<!-- Subtle SPICE indicators -->
			<div class="spice-indicators">
				<div class="indicator voltage" style="--pos-x: 15%; --pos-y: 25%;">
					<span class="value">5.0V</span>
					<div class="indicator-pulse"></div>
				</div>
				<div class="indicator current" style="--pos-x: 75%; --pos-y: 35%;">
					<span class="value">12mA</span>
					<div class="indicator-pulse"></div>
				</div>
				<div class="indicator frequency" style="--pos-x: 45%; --pos-y: 75%;">
					<span class="value">1kHz</span>
					<div class="indicator-pulse"></div>
				</div>
			</div>
			
			<!-- Ambient waveform -->
			<div class="ambient-waveform">
				<svg viewBox="0 0 400 100" class="waveform-bg">
					<defs>
						<linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" style="stop-color: transparent"/>
							<stop offset="30%" style="stop-color: rgba(139, 92, 246, 0.2)"/>
							<stop offset="70%" style="stop-color: rgba(6, 182, 212, 0.3)"/>
							<stop offset="100%" style="stop-color: transparent"/>
						</linearGradient>
					</defs>
					<path class="ambient-wave" 
						  d="M0,50 Q50,20 100,50 T200,30 Q250,60 300,40 T400,50" 
						  stroke="url(#waveGradient)" 
						  fill="none"/>
				</svg>
			</div>
		</div>

		<!-- Enhanced Detailed Holographic Projection -->
		{#if showHologram}
			<div class="advanced-hologram">
				<div class="hologram-layers">
					<div class="layer circuit-analysis">
						<div class="analysis-header">
							<span class="status-dot"></span>
							Circuit Analysis Active
						</div>
						<div class="analysis-grid">
							<div class="analysis-item">
								<span class="label">Vout</span>
								<span class="value gradient-text">4.76V</span>
							</div>
							<div class="analysis-item">
								<span class="label">THD</span>
								<span class="value gradient-text">0.02%</span>
							</div>
							<div class="analysis-item">
								<span class="label">Gain</span>
								<span class="value gradient-text">23.1dB</span>
							</div>
						</div>
					</div>
					
					<div class="layer spice-code">
						<div class="code-header">SPICE Netlist</div>
						<div class="code-content">
							<div class="code-line">
								<span class="keyword">.MODEL</span>
								<span class="model">Q2N3904 NPN</span>
							</div>
							<div class="code-line">
								<span class="keyword">V1</span>
								<span class="node">VCC 0</span>
								<span class="value">12V</span>
							</div>
						</div>
					</div>
					
					<div class="layer frequency-response">
						<svg viewBox="0 0 200 80" class="response-graph">
							<defs>
								<linearGradient id="responseGradient" x1="0%" y1="100%" x2="0%" y2="0%">
									<stop offset="0%" style="stop-color: var(--purple-glow); stop-opacity: 0"/>
									<stop offset="50%" style="stop-color: var(--purple-glow); stop-opacity: 0.3"/>
									<stop offset="100%" style="stop-color: var(--purple-bright); stop-opacity: 1"/>
								</linearGradient>
							</defs>
							<path class="response-curve" 
								  d="M10,70 Q50,40 100,45 Q150,35 190,40" 
								  stroke="var(--purple-bright)" 
								  fill="none"/>
							<path class="response-fill" 
								  d="M10,70 Q50,40 100,45 Q150,35 190,40 L190,80 L10,80 Z" 
								  fill="url(#responseGradient)"/>
						</svg>
					</div>
				</div>
				<div class="hologram-effects">
					<div class="scan-line"></div>
					<div class="data-particles">
						{#each Array(6) as _, i}
							<div class="data-particle" style="--particle-delay: {i * 0.3}s"></div>
						{/each}
					</div>
				</div>
				<div class="hologram-border"></div>
			</div>
		{/if}

		<!-- Call to Action -->
		<a href="/explore" class="cta-button">
			<span class="cta-text">Explore Saffron</span>
			<div class="cta-glow"></div>
		</a>
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
	
	:root {
		--black-void: #000000;
		--black-deep: #0d0d0d;
		--black-surface: #1a1a1a;
		--purple-primary: #8B5CF6;
		--purple-bright: #A855F7;
		--purple-glow: #8B5CF6;
		--gray-light: #f8fafc;
		--gray-muted: #64748b;
		--spectral-red: #ef4444;
		--spectral-orange: #f97316;
		--spectral-yellow: #eab308;
		--spectral-green: #22c55e;
		--spectral-cyan: #06b6d4;
		--spectral-blue: #3b82f6;
		--spectral-indigo: #6366f1;
		--spectral-violet: #8b5cf6;
	}

	* {
		box-sizing: border-box;
	}

	.hero-section {
		min-height: 100vh;
		background: radial-gradient(ellipse at center, var(--black-deep) 0%, var(--black-void) 70%);
		color: var(--gray-light);
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		padding: 0;
	}

	.grain-overlay {
		position: absolute;
		inset: 0;
		background-image: 
			radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 25%),
			radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 25%),
			url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E");
		opacity: 0.02;
		pointer-events: none;
		mix-blend-mode: multiply;
		z-index: 1;
	}

	.ambient-glow {
		position: absolute;
		inset: 0;
		background: 
			radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.1) 0%, transparent 50%);
		pointer-events: none;
		z-index: 0;
	}

	/* Floating Circuit Components */
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
		will-change: transform, opacity;
	}

	.component-1 { /* Resistor */
		width: 20px;
		height: 6px;
		background: linear-gradient(90deg, transparent, var(--purple-glow), transparent);
		border-radius: 3px;
		box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
	}

	.component-2 { /* Capacitor */
		width: 8px;
		height: 16px;
		background: linear-gradient(0deg, transparent, var(--spectral-cyan), transparent);
		border-radius: 2px;
		box-shadow: 0 0 6px rgba(6, 182, 212, 0.6);
	}

	.component-3 { /* IC Package */
		width: 16px;
		height: 12px;
		background: linear-gradient(45deg, var(--black-surface), var(--purple-glow));
		border: 1px solid rgba(139, 92, 246, 0.3);
		border-radius: 2px;
		box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
	}

	.component-4 { /* Diode */
		width: 12px;
		height: 4px;
		background: linear-gradient(90deg, var(--spectral-green), var(--spectral-yellow));
		border-radius: 2px;
		box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
	}

	.component-5 { /* Transistor */
		width: 10px;
		height: 10px;
		background: radial-gradient(circle, var(--purple-bright), var(--purple-glow));
		border-radius: 50%;
		box-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
	}

	.component-6 { /* Inductor */
		width: 18px;
		height: 8px;
		background: linear-gradient(90deg, var(--spectral-orange), var(--spectral-red));
		border-radius: 4px;
		box-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
	}

	/* Background Circuit Traces */
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

	.particle-field {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}

	.particle {
		position: absolute;
		width: 2px;
		height: 2px;
		background: var(--purple-glow);
		border-radius: 50%;
		opacity: 0.3;
		animation: float var(--duration, 20s) infinite linear;
		animation-delay: var(--delay, 0s);
		box-shadow: 0 0 6px var(--purple-glow);
		left: calc(var(--delay) * 2%);
		top: calc(var(--delay) * 1.5%);
	}

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

	@keyframes float {
		0% { 
			transform: translate3d(0, 100vh, 0) scale(0);
			opacity: 0;
		}
		10% {
			opacity: 0.3;
			transform: translate3d(10px, 90vh, 0) scale(1);
		}
		90% {
			opacity: 0.3;
			transform: translate3d(-10px, 10vh, 0) scale(1);
		}
		100% { 
			transform: translate3d(0, -10vh, 0) scale(0);
			opacity: 0;
		}
	}

	.content-wrapper {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		max-width: 1200px;
		padding: 2rem;
		gap: 4rem;
	}

	/* Central 3D Circuit Element */
	.central-3d-container {
		perspective: 1000px;
		transform-style: preserve-3d;
		transition: transform 0.1s ease-out;
		will-change: transform;
	}

	.circuit-core {
		position: relative;
		width: 300px;
		height: 300px;
		transform-style: preserve-3d;
		animation: coreRotate 40s linear infinite;
		will-change: transform;
	}

	.circuit-board {
		position: absolute;
		inset: 0;
		border-radius: 20px;
		background: 
			linear-gradient(135deg, 
				rgba(13, 13, 13, 0.95) 0%, 
				rgba(26, 26, 26, 0.9) 30%,
				rgba(13, 13, 13, 0.95) 70%,
				rgba(0, 0, 0, 0.98) 100%
			);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(139, 92, 246, 0.2);
		box-shadow: 
			0 0 60px rgba(139, 92, 246, 0.3),
			inset 0 0 60px rgba(139, 92, 246, 0.1),
			inset 0 0 20px rgba(0, 0, 0, 0.5);
	}

	/* Circuit Components */
	.component {
		position: absolute;
		border: 1px solid rgba(139, 92, 246, 0.4);
		box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
		animation: componentGlow 3s ease-in-out infinite;
	}

	@keyframes componentGlow {
		0%, 100% { 
			box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
			border-color: rgba(139, 92, 246, 0.4);
		}
		50% { 
			box-shadow: 0 0 25px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3);
			border-color: rgba(139, 92, 246, 0.8);
		}
	}

	.resistor {
		width: 24px;
		height: 8px;
		background: linear-gradient(90deg, 
			var(--spectral-yellow), 
			var(--spectral-orange), 
			var(--spectral-red),
			var(--spectral-orange),
			var(--spectral-yellow)
		);
		border-radius: 4px;
	}
	.resistor-1 { top: 25%; left: 20%; animation-delay: 0s; }

	.capacitor {
		width: 12px;
		height: 20px;
		background: linear-gradient(0deg, var(--spectral-cyan), var(--spectral-blue));
		border-radius: 2px;
	}
	.capacitor-1 { top: 60%; left: 70%; animation-delay: 0.8s; }

	.ic {
		width: 32px;
		height: 20px;
		background: linear-gradient(45deg, var(--black-surface), rgba(139, 92, 246, 0.2));
		border-radius: 4px;
		border: 2px solid rgba(139, 92, 246, 0.6);
	}
	.ic-1 { top: 40%; left: 40%; transform: translate(-50%, -50%); animation-delay: 1.2s; }

	.transistor {
		width: 16px;
		height: 16px;
		background: radial-gradient(circle, var(--purple-bright), var(--purple-glow));
		border-radius: 50%;
		border: 1px solid rgba(168, 85, 247, 0.8);
	}
	.transistor-1 { top: 70%; left: 25%; animation-delay: 1.6s; }

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
	.diode-1 { top: 20%; right: 25%; animation-delay: 2s; }

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

	.node-1 { top: 20%; left: 20%; animation-delay: 0s; }
	.node-2 { top: 20%; right: 20%; animation-delay: 0.6s; }
	.node-3 { bottom: 20%; left: 20%; animation-delay: 1.2s; }
	.node-4 { bottom: 20%; right: 20%; animation-delay: 1.8s; }
	.node-5 { top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: 2.4s; }

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
		stroke-linejoin: round;
		stroke-dasharray: 300;
		stroke-dashoffset: 300;
		animation: traceAnimate 6s ease-in-out infinite;
		filter: drop-shadow(0 0 3px currentColor);
	}

	.trace.signal-trace {
		animation-duration: 8s;
	}

	.trace.power-trace {
		stroke-width: 3;
		animation-duration: 10s;
	}

	.trace.complex-trace {
		stroke-width: 1.5;
		animation-duration: 12s;
	}

	.signal-trace:nth-child(1) { animation-delay: 0s; }
	.signal-trace:nth-child(2) { animation-delay: 2.7s; }
	.signal-trace:nth-child(3) { animation-delay: 5.3s; }

	.power-trace:nth-child(1) { animation-delay: 1.5s; }
	.power-trace:nth-child(2) { animation-delay: 6s; }

	.complex-trace:nth-child(1) { animation-delay: 3s; }
	.complex-trace:nth-child(2) { animation-delay: 8s; }

	.prism-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.light-beam {
		position: absolute;
		background: linear-gradient(90deg, 
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
		background: linear-gradient(90deg, 
			var(--spectral-red), var(--spectral-orange), var(--spectral-yellow), 
			var(--spectral-green), var(--spectral-cyan), var(--spectral-blue)
		);
		animation-delay: 1s;
	}

	.refraction-2 {
		top: 50%;
		left: 10%;
		width: 80%;
		background: linear-gradient(90deg,
			var(--spectral-violet), var(--spectral-indigo), var(--spectral-blue),
			var(--spectral-cyan), var(--spectral-green), var(--spectral-yellow)
		);
		animation-delay: 5s;
	}

	.refraction-3 {
		top: 75%;
		left: 30%;
		width: 40%;
		background: linear-gradient(90deg,
			var(--spectral-orange), var(--spectral-yellow), var(--spectral-green),
			var(--spectral-cyan), var(--spectral-blue), var(--spectral-violet)
		);
		animation-delay: 9s;
	}

	.holographic-shimmer {
		position: absolute;
		inset: 0;
		background: 
			linear-gradient(45deg, transparent 30%, rgba(139, 92, 246, 0.1) 50%, transparent 70%),
			linear-gradient(-45deg, transparent 30%, rgba(168, 85, 247, 0.1) 50%, transparent 70%);
		background-size: 200% 200%;
		animation: shimmerMove 8s ease-in-out infinite;
		border-radius: 20px;
	}

	@keyframes shimmerMove {
		0%, 100% {
			background-position: 0% 0%, 100% 100%;
			opacity: 0.3;
		}
		50% {
			background-position: 100% 100%, 0% 0%;
			opacity: 0.7;
		}
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

	@keyframes ringPulse {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1) rotate(0deg);
			border-color: rgba(139, 92, 246, 0.2);
		}
		50% {
			transform: translate(-50%, -50%) scale(1.1) rotate(180deg);
			border-color: rgba(139, 92, 246, 0.5);
		}
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

	/* Typography */
	.hero-text {
		z-index: 20;
	}

	.headline {
		font-size: clamp(3rem, 8vw, 5.5rem);
		font-weight: 800;
		line-height: 1.1;
		margin: 0;
		letter-spacing: -0.025em;
		background: linear-gradient(135deg, 
			var(--gray-light) 0%, 
			rgba(139, 92, 246, 0.9) 50%,
			var(--gray-light) 100%
		);
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		animation: titleReveal 2s ease-out forwards;
		opacity: 0;
	}

	.headline-word {
		display: inline-block;
		animation: wordSlide 0.8s ease-out forwards;
		animation-delay: 0.5s;
		transform: translateY(100px);
	}

	.headline-separator {
		display: inline-block;
		color: var(--purple-glow);
		animation: wordSlide 0.8s ease-out forwards;
		animation-delay: 0.7s;
		transform: translateY(100px);
	}

	.headline-tagline {
		display: inline-block;
		animation: wordSlide 0.8s ease-out forwards;
		animation-delay: 0.9s;
		transform: translateY(100px);
	}

	.subheadline {
		font-size: 1.25rem;
		font-weight: 300;
		color: var(--gray-muted);
		margin: 1rem 0 0 0;
		opacity: 0;
		animation: fadeInUp 1s ease-out 1.2s forwards;
		letter-spacing: 0.02em;
	}

	/* Holographic Panels */
	.holo-panels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		width: 100%;
		max-width: 800px;
		z-index: 15;
	}

	.holo-panel {
		position: relative;
		background: rgba(13, 13, 13, 0.6);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(139, 92, 246, 0.2);
		border-radius: 12px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		opacity: 0;
		animation: panelReveal 1s ease-out forwards;
	}

	.panel-spice {
		animation-delay: 1.5s;
	}

	.panel-graph {
		animation-delay: 1.7s;
	}

	.holo-panel:hover {
		transform: translateY(-4px);
		border-color: rgba(139, 92, 246, 0.4);
		box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
	}

	.panel-header {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--purple-glow);
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.panel-content {
		color: var(--gray-light);
	}

	.code-snippet {
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
		font-size: 0.75rem;
		line-height: 1.4;
		color: rgba(248, 250, 252, 0.8);
		margin: 0;
		white-space: pre-wrap;
	}

	.graph-display {
		width: 100%;
		height: 60px;
	}

	.graph-line {
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 200;
		stroke-dashoffset: 200;
		animation: drawGraph 3s ease-out forwards;
	}

	.graph-line.secondary {
		stroke-width: 1;
		animation-delay: 0.5s;
	}

	.panel-glow {
		position: absolute;
		inset: -1px;
		background: linear-gradient(135deg, 
			rgba(139, 92, 246, 0.1) 0%,
			transparent 50%,
			rgba(168, 85, 247, 0.1) 100%
		);
		border-radius: 12px;
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
		z-index: -1;
	}

	.holo-panel:hover .panel-glow {
		opacity: 1;
	}

	/* Detailed Hologram */
	.detailed-hologram {
		position: absolute;
		top: 30%;
		right: 5%;
		width: 250px;
		background: rgba(13, 13, 13, 0.9);
		backdrop-filter: blur(30px);
		border: 1px solid rgba(139, 92, 246, 0.4);
		border-radius: 8px;
		padding: 1rem;
		animation: hologramAppear 0.3s ease-out forwards;
		z-index: 25;
	}

	.hologram-header {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--purple-glow);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.hologram-body {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.component-diagram {
		flex: 1;
	}

	.component-diagram svg {
		width: 100%;
		height: auto;
	}

	.data-stream {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.data-line {
		height: 1px;
		background: linear-gradient(90deg,
			transparent 0%,
			var(--purple-glow) 50%,
			transparent 100%
		);
		animation: dataFlow 2s ease-in-out infinite;
		animation-delay: var(--delay, 0s);
	}

	.hologram-glow {
		position: absolute;
		inset: -10px;
		background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
		filter: blur(20px);
		pointer-events: none;
		z-index: -1;
	}

	/* Call to Action */
	.cta-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 1rem 2rem;
		background: transparent;
		border: 1px solid rgba(139, 92, 246, 0.4);
		border-radius: 8px;
		color: var(--gray-light);
		text-decoration: none;
		font-weight: 500;
		font-size: 1rem;
		transition: all 0.3s ease;
		overflow: hidden;
		opacity: 0;
		animation: fadeInUp 1s ease-out 2s forwards;
	}

	.cta-button:hover {
		border-color: var(--purple-glow);
		transform: translateY(-2px);
		box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
	}

	.cta-text {
		position: relative;
		z-index: 2;
	}

	.cta-glow {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, 
			rgba(139, 92, 246, 0.1) 0%,
			rgba(168, 85, 247, 0.1) 100%
		);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.cta-button:hover .cta-glow {
		opacity: 1;
	}

	/* Integrated Analysis System */
	.integrated-analysis {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 8;
	}

	.analysis-trigger {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 40px;
		height: 40px;
		transform: translate(-50%, -50%);
		pointer-events: all;
		cursor: pointer;
		border-radius: 50%;
		background: rgba(139, 92, 246, 0.1);
		border: 1px solid rgba(139, 92, 246, 0.3);
		transition: all 0.3s ease;
	}

	.analysis-trigger:hover {
		transform: translate(-50%, -50%) scale(1.1);
		background: rgba(139, 92, 246, 0.2);
		border-color: rgba(139, 92, 246, 0.6);
	}

	.trigger-glow {
		position: absolute;
		inset: -10px;
		background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
		border-radius: 50%;
		animation: triggerPulse 2s ease-in-out infinite;
	}

	@keyframes triggerPulse {
		0%, 100% { 
			opacity: 0.3; 
			transform: scale(1);
		}
		50% { 
			opacity: 0.6; 
			transform: scale(1.2);
		}
	}

	.spice-indicators {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.indicator {
		position: absolute;
		left: var(--pos-x);
		top: var(--pos-y);
		background: rgba(13, 13, 13, 0.8);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(139, 92, 246, 0.3);
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--gray-light);
		animation: indicatorFloat 4s ease-in-out infinite;
	}

	.indicator.voltage {
		border-color: rgba(239, 68, 68, 0.6);
		animation-delay: 0s;
	}
	.indicator.voltage .value {
		color: var(--spectral-red);
	}

	.indicator.current {
		border-color: rgba(34, 197, 94, 0.6);
		animation-delay: 1.3s;
	}
	.indicator.current .value {
		color: var(--spectral-green);
	}

	.indicator.frequency {
		border-color: rgba(6, 182, 212, 0.6);
		animation-delay: 2.6s;
	}
	.indicator.frequency .value {
		color: var(--spectral-cyan);
	}

	.indicator-pulse {
		position: absolute;
		inset: -2px;
		border-radius: 6px;
		background: linear-gradient(45deg, transparent, rgba(139, 92, 246, 0.2), transparent);
		animation: indicatorPulseAnim 3s ease-in-out infinite;
		z-index: -1;
	}

	@keyframes indicatorFloat {
		0%, 100% { 
			transform: translateY(0px) scale(1);
			opacity: 0.7;
		}
		50% { 
			transform: translateY(-5px) scale(1.05);
			opacity: 1;
		}
	}

	@keyframes indicatorPulseAnim {
		0%, 100% { 
			opacity: 0;
			transform: scale(1);
		}
		50% { 
			opacity: 0.5;
			transform: scale(1.1);
		}
	}

	.ambient-waveform {
		position: absolute;
		bottom: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: 60%;
		height: 60px;
		opacity: 0.4;
	}

	.waveform-bg {
		width: 100%;
		height: 100%;
	}

	.ambient-wave {
		stroke-width: 2;
		stroke-linecap: round;
		stroke-dasharray: 400;
		stroke-dashoffset: 400;
		animation: waveFlow 8s ease-in-out infinite;
	}

	@keyframes waveFlow {
		0%, 100% {
			stroke-dashoffset: 400;
			opacity: 0.2;
		}
		50% {
			stroke-dashoffset: 0;
			opacity: 0.8;
		}
	}

	/* Advanced Hologram */
	.advanced-hologram {
		position: absolute;
		top: 20%;
		right: 10%;
		width: 320px;
		background: rgba(13, 13, 13, 0.95);
		backdrop-filter: blur(30px);
		border: 1px solid rgba(139, 92, 246, 0.4);
		border-radius: 12px;
		padding: 1.5rem;
		animation: hologramAppear 0.4s ease-out forwards;
		z-index: 30;
	}

	.hologram-layers {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.layer {
		background: rgba(26, 26, 26, 0.6);
		border: 1px solid rgba(139, 92, 246, 0.2);
		border-radius: 8px;
		padding: 1rem;
		animation: layerSlide 0.3s ease-out forwards;
	}

	.layer.circuit-analysis {
		animation-delay: 0.1s;
	}
	.layer.spice-code {
		animation-delay: 0.2s;
	}
	.layer.frequency-response {
		animation-delay: 0.3s;
	}

	@keyframes layerSlide {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.analysis-header {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--purple-glow);
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		background: var(--spectral-green);
		border-radius: 50%;
		animation: statusBlink 2s ease-in-out infinite;
	}

	@keyframes statusBlink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}

	.analysis-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.analysis-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.analysis-item .label {
		font-size: 0.7rem;
		color: var(--gray-muted);
		font-weight: 500;
	}

	.analysis-item .value {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--gray-light);
	}

	.gradient-text {
		background: linear-gradient(45deg, var(--purple-bright), var(--spectral-cyan));
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
	}

	.code-header {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--purple-glow);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.code-content {
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
		font-size: 0.7rem;
		line-height: 1.4;
	}

	.code-line {
		margin-bottom: 0.25rem;
		animation: codeType 0.5s ease-out forwards;
		opacity: 0;
	}

	.code-line:nth-child(1) { animation-delay: 0.5s; }
	.code-line:nth-child(2) { animation-delay: 0.7s; }

	@keyframes codeType {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.keyword {
		color: var(--spectral-cyan);
		font-weight: 600;
	}

	.model {
		color: var(--spectral-yellow);
	}

	.node {
		color: var(--spectral-green);
	}

	.value {
		color: var(--spectral-orange);
	}

	.response-graph {
		width: 100%;
		height: 60px;
	}

	.response-curve {
		stroke-width: 2;
		stroke-linecap: round;
		stroke-dasharray: 200;
		stroke-dashoffset: 200;
		animation: drawResponse 2s ease-out forwards;
		animation-delay: 0.8s;
	}

	.response-fill {
		opacity: 0;
		animation: fillResponse 1.5s ease-out forwards;
		animation-delay: 1.5s;
	}

	@keyframes drawResponse {
		to { stroke-dashoffset: 0; }
	}

	@keyframes fillResponse {
		to { opacity: 0.6; }
	}

	.hologram-effects {
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: 12px;
		overflow: hidden;
	}

	.scan-line {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--purple-bright), transparent);
		animation: scanLine 3s ease-in-out infinite;
	}

	@keyframes scanLine {
		0%, 100% {
			transform: translateY(-2px);
			opacity: 0;
		}
		50% {
			transform: translateY(300px);
			opacity: 0.8;
		}
	}

	.data-particles {
		position: absolute;
		inset: 0;
	}

	.data-particle {
		position: absolute;
		width: 3px;
		height: 3px;
		background: var(--purple-bright);
		border-radius: 50%;
		animation: particleFloat var(--duration, 4s) ease-in-out infinite;
		animation-delay: var(--particle-delay, 0s);
		left: calc(20% + var(--particle-delay, 0s) * 15%);
		top: calc(20% + var(--particle-delay, 0s) * 10%);
	}

	@keyframes particleFloat {
		0%, 100% {
			transform: translate3d(0, 0, 0) scale(1);
			opacity: 0.3;
		}
		50% {
			transform: translate3d(20px, -15px, 0) scale(1.5);
			opacity: 1;
		}
	}

	.hologram-border {
		position: absolute;
		inset: -1px;
		border-radius: 12px;
		background: linear-gradient(45deg, 
			transparent 30%,
			rgba(139, 92, 246, 0.3) 50%,
			transparent 70%
		);
		animation: borderShimmer 4s ease-in-out infinite;
		z-index: -1;
	}

	@keyframes borderShimmer {
		0%, 100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	/* Animations */
	@keyframes coreRotate {
		from { transform: rotate(0deg) rotateX(10deg) rotateY(10deg); }
		to { transform: rotate(360deg) rotateX(10deg) rotateY(10deg); }
	}

	@keyframes nodePulse {
		0%, 100% { 
			transform: scale(1); 
			box-shadow: 0 0 20px var(--purple-glow), 0 0 40px var(--purple-glow);
		}
		50% { 
			transform: scale(1.2); 
			box-shadow: 0 0 30px var(--purple-glow), 0 0 60px var(--purple-glow);
		}
	}

	@keyframes traceAnimate {
		0% { stroke-dashoffset: 300; opacity: 0; }
		20% { opacity: 1; }
		80% { opacity: 1; }
		100% { stroke-dashoffset: 0; opacity: 0; }
	}

	@keyframes beamSweep {
		0%, 100% { opacity: 0; transform: scaleX(0); }
		50% { opacity: 0.6; transform: scaleX(1); }
	}

	@keyframes spectralSweep {
		0%, 85%, 100% { 
			opacity: 0; 
			transform: scaleX(0) translateX(-50px);
		}
		15%, 70% { 
			opacity: 0.9; 
			transform: scaleX(1) translateX(0);
		}
		50% {
			opacity: 1;
			transform: scaleX(1.1) translateX(10px);
		}
	}

	@keyframes coreGlowPulse {
		0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
		50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
	}

	@keyframes titleReveal {
		to { opacity: 1; }
	}

	@keyframes wordSlide {
		to { transform: translateY(0); }
	}

	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes panelReveal {
		from { 
			opacity: 0; 
			transform: translateY(40px) rotateX(10deg);
		}
		to { 
			opacity: 1; 
			transform: translateY(0) rotateX(0deg);
		}
	}

	@keyframes drawGraph {
		to { stroke-dashoffset: 0; }
	}

	@keyframes hologramAppear {
		from { 
			opacity: 0; 
			transform: scale(0.9) translateY(20px);
		}
		to { 
			opacity: 1; 
			transform: scale(1) translateY(0);
		}
	}

	@keyframes dataFlow {
		0%, 100% { transform: scaleX(0); opacity: 0; }
		50% { transform: scaleX(1); opacity: 1; }
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.content-wrapper {
			gap: 2rem;
			padding: 1rem;
		}

		.circuit-core {
			width: 250px;
			height: 250px;
		}

		.headline {
			font-size: clamp(2rem, 10vw, 3.5rem);
		}

		.holo-panels {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.advanced-hologram {
			position: relative;
			top: auto;
			right: auto;
			width: 100%;
			margin-top: 1rem;
			max-width: 300px;
		}

		.floating-component {
			opacity: 0.2;
		}

		.background-traces {
			opacity: 0.2;
		}

		.spice-indicators {
			opacity: 0.6;
		}

		.ambient-waveform {
			width: 80%;
			height: 40px;
		}

		.particle {
			display: none;
		}
	}

	@media (max-width: 480px) {
		.circuit-core {
			width: 200px;
			height: 200px;
		}

		.holo-panel {
			padding: 1rem;
		}

		.cta-button {
			padding: 0.75rem 1.5rem;
			font-size: 0.9rem;
		}

		.advanced-hologram {
			padding: 1rem;
			max-width: 280px;
		}

		.analysis-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.floating-components {
			opacity: 0.5;
		}

		.prism-container {
			opacity: 0.3;
		}
	}
</style>
