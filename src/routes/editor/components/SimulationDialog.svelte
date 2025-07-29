<script lang="ts">
    import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { 
        DropdownMenu, 
        DropdownMenuContent, 
        DropdownMenuItem, 
        DropdownMenuTrigger 
    } from '$lib/components/ui/dropdown-menu';
    import { Separator } from '$lib/components/ui/separator';
    import { Badge } from '$lib/components/ui/badge';
    import { 
        Play, 
        Download, 
        Copy, 
        Settings, 
        Zap, 
        Clock, 
        TrendingUp,
        ChevronDown,
        X
    } from '@lucide/svelte';
    import type { SimulationConfig, SimulationResult } from '../services/simulation';
    import { circuitSimulator } from '../services/simulation';
    import type { Node, Edge } from '@xyflow/svelte';

    interface Props {
        isOpen: boolean;
        nodes: Node[];
        edges: Edge[];
        onClose: () => void;
    }

    let { isOpen = $bindable(), nodes, edges, onClose }: Props = $props();

    let simulationConfig = $state<SimulationConfig>({
        type: 'dc',
        startTime: 0,
        endTime: 1,
        stepTime: 0.01,
        frequency: 1000,
        voltage: 5,
        temperature: 27
    });

    let isSimulating = $state(false);
    let simulationResult = $state<SimulationResult | null>(null);
    let generatedNetlist = $state('');

    const simulationTypes = [
        { value: 'dc', label: 'DC Analysis', description: 'DC operating point and sweep analysis', icon: TrendingUp },
        { value: 'ac', label: 'AC Analysis', description: 'Frequency response analysis', icon: Zap },
        { value: 'transient', label: 'Transient Analysis', description: 'Time-domain analysis', icon: Clock }
    ];

    async function runSimulation() {
        if (nodes.length === 0) {
            alert('No components to simulate. Please add some components to the circuit.');
            return;
        }

        isSimulating = true;
        try {
            // Convert nodes and edges to the format expected by the simulator
            const componentData = nodes.map(node => ({
                id: node.id,
                type: node.type || 'unknown',
                parameters: node.data?.parameters || {},
                position: node.position
            }));

            const connectionData = edges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle || undefined,
                targetHandle: edge.targetHandle || undefined
            }));

            // Generate netlist
            generatedNetlist = circuitSimulator.generateNetlist(componentData, connectionData, simulationConfig);

            // Run simulation
            const result = await circuitSimulator.simulate(generatedNetlist, simulationConfig);
            simulationResult = result;

            if (!result.success) {
                alert(`Simulation failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Simulation error:', error);
            alert('Simulation failed. Please check your circuit configuration.');
        } finally {
            isSimulating = false;
        }
    }

    function copyNetlist() {
        if (generatedNetlist) {
            navigator.clipboard.writeText(generatedNetlist);
            // You could add a toast notification here
        }
    }

    function downloadNetlist() {
        if (generatedNetlist) {
            const blob = new Blob([generatedNetlist], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `circuit_${simulationConfig.type}_simulation.cir`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    function updateConfig(key: keyof SimulationConfig, value: any) {
        simulationConfig = { ...simulationConfig, [key]: value };
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-border">
                <div class="flex items-center gap-2">
                    <Settings class="w-5 h-5" />
                    <h2 class="text-lg font-semibold">Circuit Simulation</h2>
                </div>
                <Button variant="ghost" size="sm" onclick={onClose}>
                    <X class="w-4 h-4" />
                </Button>
            </div>

            <div class="flex flex-col h-full max-h-[calc(90vh-80px)]">
                <!-- Configuration Section -->
                <div class="p-4 border-b border-border">
                    <h3 class="text-sm font-medium mb-3">Simulation Configuration</h3>
                    
                    <!-- Simulation Type -->
                    <div class="space-y-3">
                        <div>
                            <Label class="text-xs font-medium">Analysis Type</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="outline" class="w-full justify-between h-8 text-sm">
                                        {simulationTypes.find(t => t.value === simulationConfig.type)?.label}
                                        <ChevronDown class="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent class="w-full">
                                    {#each simulationTypes as type}
                                        <DropdownMenuItem onclick={() => updateConfig('type', type.value)}>
                                            <div class="flex items-center gap-2">
                                                {#if type.icon === TrendingUp}
                                                    <TrendingUp class="w-4 h-4" />
                                                {:else if type.icon === Zap}
                                                    <Zap class="w-4 h-4" />
                                                {:else if type.icon === Clock}
                                                    <Clock class="w-4 h-4" />
                                                {/if}
                                                <div>
                                                    <div class="font-medium">{type.label}</div>
                                                    <div class="text-xs text-muted-foreground">{type.description}</div>
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    {/each}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <!-- Type-specific parameters -->
                        {#if simulationConfig.type === 'transient'}
                            <div class="grid grid-cols-3 gap-2">
                                <div>
                                    <Label class="text-xs font-medium">Start Time (s)</Label>
                                    <Input 
                                        type="number" 
                                        value={simulationConfig.startTime} 
                                        oninput={(e) => updateConfig('startTime', Number(e.currentTarget.value))}
                                        class="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label class="text-xs font-medium">End Time (s)</Label>
                                    <Input 
                                        type="number" 
                                        value={simulationConfig.endTime} 
                                        oninput={(e) => updateConfig('endTime', Number(e.currentTarget.value))}
                                        class="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label class="text-xs font-medium">Step Time (s)</Label>
                                    <Input 
                                        type="number" 
                                        value={simulationConfig.stepTime} 
                                        oninput={(e) => updateConfig('stepTime', Number(e.currentTarget.value))}
                                        class="h-8 text-sm"
                                    />
                                </div>
                            </div>
                        {:else if simulationConfig.type === 'ac'}
                            <div>
                                <Label class="text-xs font-medium">Max Frequency (Hz)</Label>
                                <Input 
                                    type="number" 
                                    value={simulationConfig.frequency} 
                                    oninput={(e) => updateConfig('frequency', Number(e.currentTarget.value))}
                                    class="h-8 text-sm"
                                />
                            </div>
                        {/if}

                        <!-- Common parameters -->
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <Label class="text-xs font-medium">Temperature (°C)</Label>
                                <Input 
                                    type="number" 
                                    value={simulationConfig.temperature} 
                                    oninput={(e) => updateConfig('temperature', Number(e.currentTarget.value))}
                                    class="h-8 text-sm"
                                />
                            </div>
                            <div>
                                <Label class="text-xs font-medium">Reference Voltage (V)</Label>
                                <Input 
                                    type="number" 
                                    value={simulationConfig.voltage} 
                                    oninput={(e) => updateConfig('voltage', Number(e.currentTarget.value))}
                                    class="h-8 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="flex-1 overflow-y-auto p-4">
                    {#if simulationResult}
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-sm font-medium">Simulation Results</h3>
                                <Badge variant={simulationResult.success ? "default" : "destructive"}>
                                    {simulationResult.success ? "Success" : "Failed"}
                                </Badge>
                            </div>

                            {#if simulationResult.success}
                                <Card class="p-4">
                                    <CardHeader class="p-0 pb-3">
                                        <h4 class="text-sm font-medium">Generated Netlist</h4>
                                    </CardHeader>
                                    <CardContent class="p-0">
                                        <pre class="text-xs bg-muted p-3 rounded border overflow-x-auto max-h-40 overflow-y-auto">{generatedNetlist}</pre>
                                    </CardContent>
                                </Card>

                                <div class="flex gap-2">
                                    <Button size="sm" variant="outline" onclick={copyNetlist}>
                                        <Copy class="w-3 h-3 mr-1" />
                                        Copy Netlist
                                    </Button>
                                    <Button size="sm" variant="outline" onclick={downloadNetlist}>
                                        <Download class="w-3 h-3 mr-1" />
                                        Download
                                    </Button>
                                </div>

                                <Card class="p-4">
                                    <CardHeader class="p-0 pb-3">
                                        <h4 class="text-sm font-medium">Simulation Data</h4>
                                    </CardHeader>
                                    <CardContent class="p-0">
                                        <div class="text-xs space-y-1">
                                            <div><strong>Type:</strong> {simulationResult.data?.type}</div>
                                            <div><strong>Time:</strong> {new Date(simulationResult.data?.time).toLocaleString()}</div>
                                            <div><strong>Data Points:</strong> {Object.keys(simulationResult.data?.results || {}).length}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            {:else}
                                <Card class="p-4 border-destructive">
                                    <CardContent class="p-0">
                                        <div class="text-sm text-destructive">
                                            <strong>Error:</strong> {simulationResult.error}
                                        </div>
                                    </CardContent>
                                </Card>
                            {/if}
                        </div>
                    {:else}
                        <div class="text-center text-muted-foreground py-8">
                            <Zap class="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p class="text-sm">No simulation results yet</p>
                            <p class="text-xs mt-2">Configure your simulation and click "Run Simulation" to start</p>
                        </div>
                    {/if}
                </div>

                <!-- Footer -->
                <div class="p-4 border-t border-border flex gap-2">
                    <Button variant="outline" onclick={onClose} class="flex-1">
                        Close
                    </Button>
                    <Button 
                        onclick={runSimulation} 
                        disabled={isSimulating || nodes.length === 0}
                        class="flex-1"
                    >
                        {#if isSimulating}
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Running...
                        {:else}
                            <Play class="w-4 h-4 mr-1" />
                            Run Simulation
                        {/if}
                    </Button>
                </div>
            </div>
        </div>
    </div>
{/if} 