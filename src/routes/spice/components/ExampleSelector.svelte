<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import * as Command from "$lib/components/ui/command";
	import * as Popover from "$lib/components/ui/popover";
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { Check, ChevronsUpDown } from "@lucide/svelte";
	import { cn } from "$lib/utils";

	export let theme: 'light' | 'dark' = 'dark';
	export let selectedExample = '';

	const dispatch = createEventDispatcher<{
		select: { name: string; code: string };
	}>();

	interface CircuitExample {
		name: string;
		category: string;
		description: string;
		code: string;
		value: string;
	}

	const examples: CircuitExample[] = [
		{
			name: 'Fast Series RLC Resonant Circuit',
			category: 'Basic Circuits',
			description: 'High-speed RLC resonant circuit with picosecond timing',
			value: 'fast-series-rlc',
			code: `FAST SERIES RLC RESONANT CIRCUIT
r1 vin n1 1
l1 n1 n2 1u
c1 n2 0 1n
vin vin 0 pulse(0 1 0 1p 1p 10p 20p)
.tran 1p 100p
.end`
		},
		{
			name: 'Fast Parallel RLC Tank',
			category: 'Basic Circuits',
			description: 'Parallel RLC tank circuit with current source',
			value: 'fast-parallel-rlc',
			code: `FAST PARALLEL RLC TANK
i1 0 tank 1m pulse(0 1m 0 1p 1p 5p 10p)
r1 tank 0 100
l1 tank 0 100n
c1 tank 0 1p
.tran 0.1p 50p
.end`
		},
		{
			name: 'Fast RC Filter',
			category: 'Filters',
			description: 'Simple RC low-pass filter with fast response',
			value: 'fast-rc-filter',
			code: `FAST RC FILTER
vin vin 0 pulse(0 1 0 1p 1p 5p 10p)
r1 vin out 1k
c1 out 0 1p
.tran 0.1p 30p
.end`
		},
		{
			name: 'Fast LC Oscillator',
			category: 'Oscillators',
			description: 'LC oscillator using CMOS transistors',
			value: 'fast-lc-oscillator',
			code: `FAST LC OSCILLATOR
.include modelcard.CMOS90
m1 vdd gate out out P90 W=10u L=0.09u
m2 out gate 0 0 N90 W=5u L=0.09u
l1 out fb 10n
c1 fb 0 0.1p
r1 vdd gate 10k
vdd vdd 0 1.8
.tran 0.1p 20p
.end`
		},
		{
			name: 'Fast Inverter Chain',
			category: 'Digital Circuits',
			description: 'CMOS inverter chain with timing analysis',
			value: 'fast-inverter-chain',
			code: `FAST INVERTER CHAIN
.include modelcard.CMOS90
m1 vdd in out1 out1 P90 W=4u L=0.09u
m2 out1 in 0 0 N90 W=2u L=0.09u
m3 vdd out1 out2 out2 P90 W=8u L=0.09u
m4 out2 out1 0 0 N90 W=4u L=0.09u
c1 out1 0 0.1f
c2 out2 0 0.2f
vin in 0 pulse(0 1.8 0 0.1p 0.1p 2p 4p)
vdd vdd 0 1.8
.tran 0.01p 10p
.end`
		},
		{
			name: 'Fast RLC Damped Oscillation',
			category: 'Basic Circuits',
			description: 'RLC circuit showing damped oscillation behavior',
			value: 'fast-rlc-damped',
			code: `FAST RLC DAMPED OSCILLATION
r1 n1 n2 10
l1 n2 n3 100n
c1 n3 0 10f
i1 0 n1 1m pulse(0 1m 0 0.1p 0.1p 1p 20p)
.tran 0.01p 15p
.end`
		},
		{
			name: 'Fast Transmission Line',
			category: 'Transmission Lines',
			description: 'Transmission line with matched impedances',
			value: 'fast-transmission-line',
			code: `FAST TRANSMISSION LINE
t1 in 0 out 0 z0=50 td=1p
r1 in 0 50
r2 out 0 50
vin in 0 pulse(0 1 0 0.1p 0.1p 2p 4p)
.tran 0.01p 12p
.end`
		},
		{
			name: 'Fast Crystal Model',
			category: 'Resonators',
			description: 'Crystal oscillator equivalent circuit model',
			value: 'fast-crystal-model',
			code: `FAST CRYSTAL MODEL
l1 in n1 1u
c1 n1 n2 1f
r1 n2 out 1
c2 in out 10f
vin in 0 sin(0 0.1 1g)
.tran 0.01p 10p
.end`
		},
		{
			name: 'Fast CMOS Ring Oscillator',
			category: 'Oscillators',
			description: 'Three-stage CMOS ring oscillator',
			value: 'fast-cmos-ring',
			code: `FAST CMOS RING OSC
.include modelcard.CMOS90
m1 vdd a b b P90 W=2u L=0.09u
m2 b a 0 0 N90 W=1u L=0.09u
m3 vdd b c c P90 W=2u L=0.09u
m4 c b 0 0 N90 W=1u L=0.09u
m5 vdd c a a P90 W=2u L=0.09u
m6 a c 0 0 N90 W=1u L=0.09u
vdd vdd 0 1.8
.tran 0.01p 5p
.end`
		},
		{
			name: 'Fast Current Mirror',
			category: 'Analog Circuits',
			description: 'CMOS current mirror with load resistor',
			value: 'fast-current-mirror',
			code: `FAST CURRENT MIRROR
.include modelcard.CMOS90
m1 vdd gate gate gate P90 W=10u L=0.09u
m2 vdd gate out out P90 W=10u L=0.09u
i1 gate 0 100u pulse(0 100u 0 0.1p 0.1p 1p 2p)
r1 out 0 1k
vdd vdd 0 1.8
.tran 0.01p 6p
.end`
		},
		{
			name: 'Chaos RLC Circuit (Chua\'s Circuit)',
			category: 'Nonlinear Circuits',
			description: 'Chua\'s circuit exhibiting chaotic behavior',
			value: 'chaos-rlc-circuit',
			code: `CHAOS RLC CIRCUIT (Chua's Circuit)
.include modelcard.CMOS90
r1 vin n1 220.0
l1 n1 n2 18.0
c1 n2 0 0.1
c2 vin n2 0.01

; Nonlinear resistor using MOSFETs
m1 n2 n2 n3 n3 N90 W=200.0u L=0.09u
m2 n3 n2 0 0 N90 W=100.0u L=0.09u
r2 n3 0 500.0
vin vin 0 pulse(0 2.5 0 0.1 0.1 12 25)
vdd vdd 0 1.8
.tran 0.05 45
.end`
		},
		{
			name: 'Parametric Oscillator (Varactor Tuned)',
			category: 'Advanced Circuits',
			description: 'Voltage-controlled oscillator using varactor',
			value: 'parametric-oscillator',
			code: `PARAMETRIC OSCILLATOR (Varactor Tuned)
.include modelcard.CMOS90
l1 osc n1 8.5

; Voltage-controlled capacitor (varactor model)
m1 n1 vtune n2 0 N90 W=50.0u L=0.09u
c1 n2 0 0.05
r1 osc 0 180.0

; Pump frequency
vpump vtune 0 sin(0 0.8 2meg 0 0)

; Main oscillation
m2 vdd gate osc osc P90 W=180.0u L=0.09u
m3 osc gate 0 0 N90 W=90.0u L=0.09u
r2 vdd gate 1.2k
vdd vdd 0 1.8
.tran 0.02 40
.end`
		}
	];

	let open = false;
	let value = "";

	$: selectedLabel = examples.find(example => example.value === value)?.name ?? "Select a circuit example...";

	$: categorizedExamples = examples.reduce((acc, example) => {
		if (!acc[example.category]) {
			acc[example.category] = [];
		}
		acc[example.category].push(example);
		return acc;
	}, {} as Record<string, CircuitExample[]>);

	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function selectExample(example: CircuitExample) {
		value = example.value;
		selectedExample = example.name;
		dispatch('select', { name: example.name, code: example.code });
		closeAndFocusTrigger("example-trigger");
	}
</script>

<div class="space-y-2">
	<h3 class="text-sm font-medium">Circuit Examples</h3>
	
	<Popover.Root bind:open>
		<Popover.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class="w-full justify-between"
				id="example-trigger"
			>
				<span class="truncate">{selectedLabel}</span>
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Button>
		</Popover.Trigger>
		
		<Popover.Content class="w-[400px] p-0" align="start">
			<Command.Root>
				<Command.Input placeholder="Search examples..." class="h-9" />
				<Command.Empty>No examples found.</Command.Empty>
				
				{#each Object.entries(categorizedExamples) as [category, categoryExamples]}
					<Command.Group heading={category}>
						{#each categoryExamples as example}
							<Command.Item
								value={example.value}
								onSelect={() => selectExample(example)}
							>
								<div class="flex flex-col gap-1 flex-1">
									<div class="flex items-center gap-2">
										<span class="font-medium text-sm">{example.name}</span>
										<Badge variant="secondary" class="text-xs">
											{example.category}
										</Badge>
									</div>
									<span class="text-xs text-muted-foreground">
										{example.description}
									</span>
								</div>
								<Check
									class={cn(
										"ml-2 h-4 w-4",
										value === example.value ? "opacity-100" : "opacity-0"
									)}
								/>
							</Command.Item>
						{/each}
					</Command.Group>
				{/each}
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
