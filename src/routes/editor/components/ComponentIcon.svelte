<script lang="ts">
	import { getComponentIconClass } from '../utils/component-colors';
	
	interface Props {
		type: string;
		class?: string;
	}

	let { type, class: className = '' }: Props = $props();

	let iconColor = $derived(getComponentIconClass(type as any));
</script>

{#if type === 'resistor'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<path d="M10 20 L25 20 L30 10 L35 30 L40 10 L45 30 L50 10 L55 30 L60 10 L65 30 L70 10 L75 20 L90 20" 
			stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
		<circle cx="15" cy="20" r="2" fill="currentColor" />
		<circle cx="85" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'capacitor'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<line x1="10" y1="20" x2="40" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="40" y1="8" x2="40" y2="32" stroke="currentColor" stroke-width="3" />
		<line x1="60" y1="8" x2="60" y2="32" stroke="currentColor" stroke-width="3" />
		<line x1="60" y1="20" x2="90" y2="20" stroke="currentColor" stroke-width="2" />
		<circle cx="15" cy="20" r="2" fill="currentColor" />
		<circle cx="85" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'inductor'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<path d="M10 20 L25 20 Q30 10 35 20 Q40 30 45 20 Q50 10 55 20 Q60 30 65 20 Q70 10 75 20 L90 20" 
			stroke="currentColor" stroke-width="2" fill="none" />
		<circle cx="15" cy="20" r="2" fill="currentColor" />
		<circle cx="85" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'voltageSource'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="20" r="15" stroke="currentColor" stroke-width="2" fill="none" />
		<line x1="10" y1="20" x2="35" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="65" y1="20" x2="90" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="45" y1="15" x2="45" y2="25" stroke="currentColor" stroke-width="2" />
		<line x1="52" y1="17" x2="52" y2="23" stroke="currentColor" stroke-width="2" />
		<line x1="48" y1="20" x2="56" y2="20" stroke="currentColor" stroke-width="1" />
		<circle cx="15" cy="20" r="2" fill="currentColor" />
		<circle cx="85" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'currentSource'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="20" r="15" stroke="currentColor" stroke-width="2" fill="none" />
		<line x1="10" y1="20" x2="35" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="65" y1="20" x2="90" y2="20" stroke="currentColor" stroke-width="2" />
		<path d="M45 15 L55 20 L45 25" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
		<circle cx="15" cy="20" r="2" fill="currentColor" />
		<circle cx="85" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'ground'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<line x1="50" y1="5" x2="50" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="35" y1="20" x2="65" y2="20" stroke="currentColor" stroke-width="3" />
		<line x1="40" y1="25" x2="60" y2="25" stroke="currentColor" stroke-width="2" />
		<line x1="45" y1="30" x2="55" y2="30" stroke="currentColor" stroke-width="1" />
		<circle cx="50" cy="10" r="2" fill="currentColor" />
	</svg>
{:else if type === 'diode'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<line x1="10" y1="20" x2="45" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="55" y1="20" x2="90" y2="20" stroke="currentColor" stroke-width="2" />
		<polygon points="45,12 45,28 55,20" fill="currentColor" stroke="currentColor" stroke-width="1" />
		<line x1="55" y1="12" x2="55" y2="28" stroke="currentColor" stroke-width="2" />
		<circle cx="15" cy="20" r="2" fill="currentColor" />
		<circle cx="85" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'transistor'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<line x1="40" y1="10" x2="40" y2="30" stroke="currentColor" stroke-width="3" />
		<line x1="10" y1="20" x2="40" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="40" y1="15" x2="65" y2="5" stroke="currentColor" stroke-width="2" />
		<line x1="40" y1="25" x2="65" y2="35" stroke="currentColor" stroke-width="2" />
		<polygon points="55,30 60,28 58,35" fill="currentColor" />
		<circle cx="65" cy="5" r="3" fill="currentColor" />
		<circle cx="65" cy="35" r="3" fill="currentColor" />
		<circle cx="15" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'opamp'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<polygon points="20,8 20,32 75,20" stroke="currentColor" stroke-width="2" fill="none" />
		<line x1="5" y1="15" x2="20" y2="15" stroke="currentColor" stroke-width="2" />
		<line x1="5" y1="25" x2="20" y2="25" stroke="currentColor" stroke-width="2" />
		<line x1="75" y1="20" x2="95" y2="20" stroke="currentColor" stroke-width="2" />
		<text x="25" y="18" font-size="8" fill="currentColor">+</text>
		<text x="25" y="28" font-size="8" fill="currentColor">-</text>
		<circle cx="10" cy="15" r="2" fill="currentColor" />
		<circle cx="10" cy="25" r="2" fill="currentColor" />
		<circle cx="90" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'voltmeter'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="20" r="15" stroke="currentColor" stroke-width="2" fill="none" />
		<line x1="10" y1="20" x2="35" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="65" y1="20" x2="90" y2="20" stroke="currentColor" stroke-width="2" />
		<text x="47" y="24" font-size="10" fill="currentColor" font-weight="bold">V</text>
		<circle cx="15" cy="20" r="2" fill="currentColor" />
		<circle cx="85" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'ammeter'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="20" r="15" stroke="currentColor" stroke-width="2" fill="none" />
		<line x1="10" y1="20" x2="35" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="65" y1="20" x2="90" y2="20" stroke="currentColor" stroke-width="2" />
		<text x="47" y="24" font-size="10" fill="currentColor" font-weight="bold">A</text>
		<circle cx="15" cy="20" r="2" fill="currentColor" />
		<circle cx="85" cy="20" r="2" fill="currentColor" />
	</svg>
{:else if type === 'probe'}
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<line x1="10" y1="20" x2="30" y2="20" stroke="currentColor" stroke-width="2" />
		<polygon points="30,15 30,25 45,20" fill="currentColor" />
		<line x1="45" y1="20" x2="75" y2="20" stroke="currentColor" stroke-width="1" stroke-dasharray="2,2" />
		<circle cx="75" cy="20" r="4" stroke="currentColor" stroke-width="2" fill="none" />
		<circle cx="15" cy="20" r="2" fill="currentColor" />
	</svg>
{:else}
	<!-- Default component icon -->
	<svg class="{className} {iconColor}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
		<rect x="30" y="15" width="40" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
		<line x1="10" y1="20" x2="30" y2="20" stroke="currentColor" stroke-width="2" />
		<line x1="70" y1="20" x2="90" y2="20" stroke="currentColor" stroke-width="2" />
		<circle cx="15" cy="20" r="2" fill="currentColor" />
		<circle cx="85" cy="20" r="2" fill="currentColor" />
	</svg>
{/if}
