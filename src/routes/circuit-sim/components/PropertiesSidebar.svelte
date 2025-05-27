<script lang="ts">
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { BarChart3, Zap, Activity } from '@lucide/svelte';
	import type { Node } from '@xyflow/svelte';
	import { circuitStore } from '../stores/circuit-store';

	interface Props {
		selectedNode: Node | null;
	}

	let { selectedNode }: Props = $props();

	let parameters = $state<Record<string, any>>({});

	$effect(() => {
		if (selectedNode?.data?.parameters) {
			parameters = { ...selectedNode.data.parameters };
		} else {
			parameters = {};
		}
	});

	function updateParameter(key: string, value: string) {
		parameters[key] = value;
		if (selectedNode) {
			circuitStore.updateComponent(selectedNode.id, parameters);
		}
	}

	function deleteComponent() {
		if (selectedNode) {
			circuitStore.removeComponent(selectedNode.id);
		}
	}

	function exportNetlist() {
		const netlist = circuitStore.exportNetlist();
		downloadFile(netlist, 'circuit.cir', 'text/plain');
	}

	function exportJSON() {
		const jsonData = circuitStore.exportJSON();
		downloadFile(jsonData, 'circuit.json', 'application/json');
	}

	function downloadFile(content: string, filename: string, mimeType: string) {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function getParameterFields(nodeType: string) {
		switch (nodeType) {
			case 'resistor':
				return [
					{ key: 'resistance', label: 'Resistance', unit: 'Ω', placeholder: '1k' },
					{ key: 'tolerance', label: 'Tolerance', unit: '%', placeholder: '5%' },
					{ key: 'power', label: 'Power Rating', unit: 'W', placeholder: '0.25W' }
				];
			case 'capacitor':
				return [
					{ key: 'capacitance', label: 'Capacitance', unit: 'F', placeholder: '1u' },
					{ key: 'voltage', label: 'Voltage Rating', unit: 'V', placeholder: '25V' },
					{ key: 'type', label: 'Type', unit: '', placeholder: 'Ceramic' }
				];
			case 'inductor':
				return [
					{ key: 'inductance', label: 'Inductance', unit: 'H', placeholder: '1m' },
					{ key: 'current', label: 'Current Rating', unit: 'A', placeholder: '1A' },
					{ key: 'dcr', label: 'DC Resistance', unit: 'Ω', placeholder: '1' }
				];
			case 'voltageSource':
				return [
					{ key: 'voltage', label: 'Voltage', unit: 'V', placeholder: '5V' },
					{ key: 'type', label: 'Type', unit: '', placeholder: 'DC' },
					{ key: 'frequency', label: 'Frequency', unit: 'Hz', placeholder: '60' }
				];
			case 'diode':
				return [
					{ key: 'type', label: 'Part Number', unit: '', placeholder: '1N4148' },
					{ key: 'forwardVoltage', label: 'Forward Voltage', unit: 'V', placeholder: '0.7' },
					{ key: 'current', label: 'Max Current', unit: 'A', placeholder: '200m' }
				];
			case 'transistor':
				return [
					{ key: 'type', label: 'Part Number', unit: '', placeholder: '2N3904' },
					{ key: 'configuration', label: 'Type', unit: '', placeholder: 'NPN' },
					{ key: 'beta', label: 'Beta (hFE)', unit: '', placeholder: '100' }
				];
			case 'opamp':
				return [
					{ key: 'type', label: 'Part Number', unit: '', placeholder: 'LM741' },
					{ key: 'gain', label: 'Open Loop Gain', unit: 'dB', placeholder: '100k' },
					{ key: 'supply', label: 'Supply Voltage', unit: 'V', placeholder: '±15V' },
					{ key: 'gainBandwidth', label: 'GBW', unit: 'Hz', placeholder: '1M' }
				];
			case 'currentSource':
				return [
					{ key: 'current', label: 'Current', unit: 'A', placeholder: '1A' },
					{ key: 'type', label: 'Type', unit: '', placeholder: 'DC' },
					{ key: 'frequency', label: 'Frequency', unit: 'Hz', placeholder: '60' }
				];
			case 'voltmeter':
				return [
					{ key: 'range', label: 'Range', unit: 'V', placeholder: '10V' },
					{ key: 'impedance', label: 'Input Impedance', unit: 'Ω', placeholder: '10M' }
				];
			case 'ammeter':
				return [
					{ key: 'range', label: 'Range', unit: 'A', placeholder: '1A' },
					{ key: 'resistance', label: 'Series Resistance', unit: 'Ω', placeholder: '0.1' }
				];
			case 'probe':
				return [
					{ key: 'impedance', label: 'Input Impedance', unit: 'Ω', placeholder: '1M' },
					{ key: 'capacitance', label: 'Input Capacitance', unit: 'F', placeholder: '10p' }
				];
			default:
				return [];
		}
	}
</script>

<div class="w-80 h-full bg-background border-l border-border flex flex-col">
	<!-- Properties Panel -->
	<div class="flex-1 flex flex-col">
		<div class="p-4 border-b border-border">
			<h2 class="text-lg font-semibold text-foreground">Properties</h2>
		</div>

		<div class="flex-1 overflow-y-auto">
			{#if selectedNode}
				<div class="p-4 space-y-4">
					<Card class="p-4">
						<CardHeader class="p-0 pb-3">
							<h3 class="text-sm font-medium">Component Details</h3>
						</CardHeader>
						<CardContent class="p-0 space-y-3">
							<div>
								<Label class="text-xs text-muted-foreground">ID</Label>
								<div class="text-sm font-mono bg-muted px-2 py-1 rounded">{selectedNode.id}</div>
							</div>
							<div>
								<Label class="text-xs text-muted-foreground">Type</Label>
								<div class="text-sm capitalize">{selectedNode.type}</div>
							</div>
						</CardContent>
					</Card>

					<Card class="p-4">
						<CardHeader class="p-0 pb-3">
							<h3 class="text-sm font-medium">Parameters</h3>
						</CardHeader>
						<CardContent class="p-0 space-y-3">
							{#each getParameterFields(selectedNode.type || '') as field}
								<div>
									<Label for={field.key} class="text-xs">{field.label}</Label>
									<div class="flex">
										<Input
											id={field.key}
											value={parameters[field.key] || ''}
											placeholder={field.placeholder}
											onchange={(e) => updateParameter(field.key, e.currentTarget.value)}
											class="text-sm"
										/>
										{#if field.unit}
											<span class="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-l-0 rounded-r-md">
												{field.unit}
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</CardContent>
					</Card>

					<div class="flex gap-2">
						<Button variant="outline" size="sm" class="flex-1">
							Simulate
						</Button>
						<Button variant="destructive" size="sm" onclick={deleteComponent}>
							Delete
						</Button>
					</div>
				</div>
			{:else}
				<div class="p-4 text-center text-muted-foreground">
					<div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
						<Zap class="w-8 h-8" />
					</div>
					<p class="text-sm">Select a component to view and edit its properties</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Analysis Panel -->
	<div class="border-t border-border">
		<div class="p-4">
			<h2 class="text-lg font-semibold text-foreground mb-4">Analysis</h2>
			
			<Card class="p-4 mb-4">
				<CardHeader class="p-0 pb-2">
					<div class="flex items-center gap-2">
						<BarChart3 class="w-4 h-4" />
						<h3 class="text-sm font-medium">Frequency Response</h3>
					</div>
				</CardHeader>
				<CardContent class="p-0">
					<div class="h-24 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
						Bode Plot Preview
					</div>
				</CardContent>
			</Card>

			<Card class="p-4">
				<CardHeader class="p-0 pb-2">
					<div class="flex items-center gap-2">
						<Activity class="w-4 h-4" />
						<h3 class="text-sm font-medium">Time Domain</h3>
					</div>
				</CardHeader>
				<CardContent class="p-0">
					<div class="h-24 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
						Transient Analysis
					</div>
				</CardContent>
			</Card>

			<div class="mt-4 space-y-2">
				<Button size="sm" class="w-full" variant="outline">
					Run DC Analysis
				</Button>
				<Button size="sm" class="w-full" variant="outline">
					Run AC Analysis
				</Button>
				<Button size="sm" class="w-full" variant="outline" onclick={exportNetlist}>
					Export Netlist
				</Button>
				<Button size="sm" class="w-full" variant="outline" onclick={exportJSON}>
					Export JSON
				</Button>
			</div>
		</div>
	</div>
</div>
