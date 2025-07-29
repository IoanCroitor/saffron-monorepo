<script lang="ts">
    import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Badge } from '$lib/components/ui/badge';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import { 
        Play, 
        Download, 
        Copy, 
        Zap, 
        Clock, 
        TrendingUp,
        CircuitBoard,
        Activity,
        BarChart3,
        ChevronDown,
        FileText
    } from '@lucide/svelte';
    import type { SimulationConfig, SimulationResult } from '../services/simulation';
    import { circuitSimulator } from '../services/simulation';
    import type { Node, Edge } from '@xyflow/svelte';
    import { onMount, onDestroy } from 'svelte';
    import { simulationStore, simulationConfigurationsStore } from '../stores/simulation-store';
    import { goto } from '$app/navigation';

    interface Props {
        nodes: Node[];
        edges: Edge[];
        projectName?: string;
    }

    let { nodes, edges, projectName = 'Untitled Circuit' }: Props = $props();

    let activeTab = $state('dc');
    let simulationName = $state('');
    let generatedNetlist = $state('');
    let showExportSection = $state(false);
    
    // Resizable functionality
    let sidebarWidth = $state(380);
    let isResizing = $state(false);
    let startX = 0;
    let startWidth = 0;

    function startResize(event: MouseEvent) {
        if (typeof document === 'undefined') return;
        
        isResizing = true;
        startX = event.clientX;
        startWidth = sidebarWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.body.classList.add('resizing');
    }

    function handleResize(event: MouseEvent) {
        if (!isResizing) return;
        
        const deltaX = startX - event.clientX;
        const newWidth = Math.max(300, Math.min(600, startWidth + deltaX));
        sidebarWidth = newWidth;
    }

    function stopResize() {
        if (typeof document === 'undefined') return;
        
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('resizing');
    }

    onMount(() => {
        if (typeof document !== 'undefined') {
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        }
    });

    onDestroy(() => {
        if (typeof document !== 'undefined') {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        }
    });

    // Use shared simulation configurations store
    let simulationConfigs = $derived($simulationConfigurationsStore);

    async function runSimulation(type: string) {
        if (nodes.length === 0) {
            alert('No components to simulate. Please add some components to the circuit.');
            return;
        }

        if (!simulationName.trim()) {
            alert('Please enter a name for this simulation run.');
            return;
        }

        try {
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

            const config = simulationConfigs[type as keyof typeof simulationConfigs];
            generatedNetlist = circuitSimulator.generateNetlist(componentData, connectionData, config);
            
            // Redirect to spice page with the netlist
            const encodedNetlist = encodeURIComponent(generatedNetlist);
            const encodedName = encodeURIComponent(simulationName);
            await goto(`/spice?netlist=${encodedNetlist}&name=${encodedName}`);
            
        } catch (error) {
            console.error('Netlist generation error:', error);
            alert('Failed to generate netlist. Please check your circuit configuration.');
        }
    }

    function copyNetlist() {
        if (generatedNetlist) {
            navigator.clipboard.writeText(generatedNetlist);
        }
    }

    function downloadNetlist() {
        if (generatedNetlist) {
            const blob = new Blob([generatedNetlist], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `circuit_${activeTab}_simulation.cir`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    function updateConfig(type: string, key: keyof SimulationConfig, value: any) {
        simulationConfigurationsStore.updateConfig(type as 'dc' | 'ac' | 'transient', key, value);
    }

    // Auto-generate netlist when configuration changes
    function generateNetlist() {
        if (nodes.length === 0) return;
        
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

        const config = simulationConfigs[activeTab as keyof typeof simulationConfigs];
        generatedNetlist = circuitSimulator.generateNetlist(componentData, connectionData, config);
    }

    // Set default simulation name based on active tab and project name
    $effect(() => {
        const typeLabels: Record<string, string> = {
            dc: 'DC Analysis',
            ac: 'AC Analysis', 
            transient: 'Transient Analysis'
        };
        simulationName = `${projectName} - ${typeLabels[activeTab]} - ${new Date().toLocaleTimeString()}`;
    });

    // Auto-generate netlist when configuration or circuit changes
    $effect(() => {
        if (nodes.length > 0) {
            generateNetlist();
        }
    });

    // Auto-generate netlist when simulation configurations change
    $effect(() => {
        if (nodes.length > 0) {
            // Access the store to trigger the effect when it changes
            const configs = $simulationConfigurationsStore;
            generateNetlist();
        }
    });
</script>

<div class="h-full bg-background border-l border-border flex flex-col relative" style="width: {sidebarWidth}px;">
    <!-- Resize Handle (Desktop only) -->
    {#if typeof window !== 'undefined' && window.innerWidth >= 768}
        <div 
            class="absolute left-0 top-0 w-2 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-10 select-none resize-handle"
            onmousedown={startResize}
            title="Drag to resize panel"
        ></div>
    {/if}

    <!-- Header -->
    <div class="p-4 border-b border-border flex-shrink-0 bg-card/50">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <CircuitBoard class="w-5 h-5 text-primary" />
                <h2 class="text-base font-semibold text-card-foreground">Simulation</h2>
            </div>
            <div class="flex items-center gap-1">
                <Badge variant="secondary" class="text-xs font-medium">{nodes.length} comp</Badge>
                <Badge variant="secondary" class="text-xs font-medium">{edges.length} conn</Badge>
                {#if typeof window !== 'undefined' && window.innerWidth < 768}
                    <button
                        onclick={() => window.dispatchEvent(new CustomEvent('closeSidebar'))}
                        class="text-muted-foreground hover:text-foreground transition-colors ml-2"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                {/if}
            </div>
        </div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col min-h-0">
        <Tabs bind:value={activeTab} class="flex-1 flex flex-col">
            <div class="px-4 pt-4 flex-shrink-0">
                <TabsList class="grid w-full grid-cols-3">
                    <TabsTrigger value="dc" class="text-xs">
                        <TrendingUp class="w-3 h-3 mr-1" />
                        DC
                    </TabsTrigger>
                    <TabsTrigger value="ac" class="text-xs">
                        <Zap class="w-3 h-3 mr-1" />
                        AC
                    </TabsTrigger>
                    <TabsTrigger value="transient" class="text-xs">
                        <Clock class="w-3 h-3 mr-1" />
                        Transient
                    </TabsTrigger>
                </TabsList>
            </div>

            {#each ['dc', 'ac', 'transient'] as type}
                <TabsContent value={type} class="flex-1 flex flex-col min-h-0">
                    <div class="flex-1 overflow-y-auto p-4 space-y-3">
                        <!-- Configuration -->
                        <Card class="p-4 border-0 shadow-sm bg-card/50">
                            <CardHeader class="p-0 pb-3">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-sm font-semibold text-card-foreground">{type.toUpperCase()} Analysis</h4>
                                    <Button 
                                        size="sm" 
                                        onclick={() => runSimulation(type)}
                                        disabled={nodes.length === 0}
                                        class="h-7 px-3 text-xs font-medium"
                                    >
                                        <Play class="w-3 h-3 mr-1" />
                                        Run in SPICE
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent class="p-0 space-y-3">
                                <!-- Simulation Name -->
                                <div>
                                    <Label class="text-xs font-medium text-muted-foreground">Simulation Name</Label>
                                    <Input 
                                        type="text" 
                                        bind:value={simulationName}
                                        placeholder="Enter simulation name..."
                                        class="h-8 text-sm mt-1"
                                    />
                                </div>

                                {#if type === 'transient'}
                                    <div class="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label class="text-xs font-medium text-muted-foreground">Start (s)</Label>
                                            <Input 
                                                type="number" 
                                                value={simulationConfigs[type].startTime} 
                                                oninput={(e) => updateConfig(type, 'startTime', Number(e.currentTarget.value))}
                                                class="h-8 text-sm mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label class="text-xs font-medium text-muted-foreground">End (s)</Label>
                                            <Input 
                                                type="number" 
                                                value={simulationConfigs[type].endTime} 
                                                oninput={(e) => updateConfig(type, 'endTime', Number(e.currentTarget.value))}
                                                class="h-8 text-sm mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label class="text-xs font-medium text-muted-foreground">Step (s)</Label>
                                            <Input 
                                                type="number" 
                                                value={simulationConfigs[type].stepTime} 
                                                oninput={(e) => updateConfig(type, 'stepTime', Number(e.currentTarget.value))}
                                                class="h-8 text-sm mt-1"
                                            />
                                        </div>
                                    </div>
                                {:else if type === 'ac'}
                                    <div>
                                        <Label class="text-xs font-medium text-muted-foreground">Max Frequency (Hz)</Label>
                                        <Input 
                                            type="number" 
                                            value={simulationConfigs[type].frequency} 
                                            oninput={(e) => updateConfig(type, 'frequency', Number(e.currentTarget.value))}
                                            class="h-8 text-sm mt-1"
                                        />
                                    </div>
                                {/if}

                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label class="text-xs font-medium text-muted-foreground">Temperature (°C)</Label>
                                        <Input 
                                            type="number" 
                                            value={simulationConfigs[type as keyof typeof simulationConfigs].temperature} 
                                            oninput={(e) => updateConfig(type, 'temperature', Number(e.currentTarget.value))}
                                            class="h-8 text-sm mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label class="text-xs font-medium text-muted-foreground">Voltage (V)</Label>
                                        <Input 
                                            type="number" 
                                            value={simulationConfigs[type as keyof typeof simulationConfigs].voltage} 
                                            oninput={(e) => updateConfig(type, 'voltage', Number(e.currentTarget.value))}
                                            class="h-8 text-sm mt-1"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                    </div>
                </TabsContent>
            {/each}
        </Tabs>
    </div>

    <!-- Export Section -->
    <div class="border-t border-border flex-shrink-0">
        <button
            class="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
            onclick={() => showExportSection = !showExportSection}
        >
            <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm font-medium">Export Options</span>
                <Badge variant="secondary" class="text-xs ml-2">
                    {simulationConfigs[activeTab as keyof typeof simulationConfigs].temperature}°C
                </Badge>
            </div>
            <ChevronDown class="w-4 h-4 text-muted-foreground transition-transform {showExportSection ? 'rotate-180' : ''}" />
        </button>
        
        {#if showExportSection}
            <div class="p-4 space-y-3 border-t border-border bg-muted/30">
                <div class="space-y-2">
                    <h4 class="text-xs font-medium text-muted-foreground">Export Netlist</h4>
                    <div class="flex gap-2">
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onclick={copyNetlist}
                            disabled={!generatedNetlist}
                            class="flex-1 h-8 text-xs"
                        >
                            <Copy class="w-3 h-3 mr-1" />
                            Copy
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onclick={downloadNetlist}
                            disabled={!generatedNetlist}
                            class="flex-1 h-8 text-xs"
                        >
                            <Download class="w-3 h-3 mr-1" />
                            Download
                        </Button>
                    </div>
                </div>

                {#if generatedNetlist}
                    <div class="space-y-2">
                        <h4 class="text-xs font-medium text-muted-foreground">Generated Netlist</h4>
                        <pre class="text-xs bg-background p-2 rounded border overflow-x-auto max-h-32 overflow-y-auto border-border">{generatedNetlist}</pre>
                    </div>
                {/if}



                <div class="space-y-2">
                    <h4 class="text-xs font-medium text-muted-foreground">Circuit Info</h4>
                    <div class="text-xs text-muted-foreground space-y-1">
                        <div>Components: {nodes.length}</div>
                        <div>Connections: {edges.length}</div>
                        <div>Last Updated: {new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    /* Prevent text selection during resize */
    :global(body.resizing) {
        user-select: none;
        cursor: col-resize;
    }
    
    /* Make resize handle more visible */
    .resize-handle {
        background: hsl(var(--border));
        transition: background-color 0.2s ease;
        border-right: 1px solid hsl(var(--border));
    }
    
    .resize-handle:hover {
        background: hsl(var(--primary) / 0.5);
        border-right-color: hsl(var(--primary));
    }
    
    .resize-handle:active {
        background: hsl(var(--primary));
        border-right-color: hsl(var(--primary));
    }
    
    /* Prevent horizontal overflow */
    :global(.overflow-hidden) {
        overflow: hidden !important;
    }
    
    /* Ensure content doesn't overflow the sidebar */
    .sidebar-content {
        max-width: 100%;
        overflow-x: hidden;
    }
</style> 