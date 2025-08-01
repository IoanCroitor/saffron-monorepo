<script lang="ts">
    import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Button } from '$lib/components/ui/button';
    import { 
        DropdownMenu, 
        DropdownMenuContent, 
        DropdownMenuItem, 
        DropdownMenuTrigger 
    } from '$lib/components/ui/dropdown-menu';
    import { Slider } from '$lib/components/ui/slider';
    import { Separator } from '$lib/components/ui/separator';
    import { Badge } from '$lib/components/ui/badge';
    import { Zap, Settings, Trash2, Copy, RotateCcw, ChevronDown } from '@lucide/svelte';
    import type { Node } from '@xyflow/svelte';
	import { Switch } from '$lib/components/ui/switch';
	import type { Edge } from '@xyflow/svelte';
    import { onMount, onDestroy } from 'svelte';

    interface Props {
        selectedNode: Node | null;
        nodes: Node[];
        edges: Edge[];
        onUpdateComponent: (id: string, parameters: any) => void;
        onRemoveComponent: (id: string) => void;
        onAddComponent: (type: string, position: { x: number; y: number }) => void;
        onExportNetlist: () => Promise<string>;
        onExportJSON: () => string;
    }

    interface FieldDefinition {
        key: string;
        label: string;
        type: 'input' | 'select' | 'slider' | 'switch';
        unit: string;
        placeholder: string;
        suggestions?: string[];
        options?: string[];
        min?: number;
        max?: number;
        step?: number;
        defaultValue?: any;
        condition?: (params: Record<string, any>) => boolean;
    }

    let { selectedNode = $bindable(), nodes = $bindable(), edges, onUpdateComponent, onRemoveComponent, onAddComponent, onExportNetlist, onExportJSON }: Props = $props();

    let parameters = $state<Record<string, any>>({});
    
    // Resizable functionality
    let sidebarWidth = $state(320); // Default width
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
        const newWidth = Math.max(250, Math.min(600, startWidth + deltaX));
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

    $effect(() => {
        if (selectedNode?.data?.parameters) {
            parameters = { ...selectedNode.data.parameters };
        } else {
            parameters = {};
        }
    });

    // Keep selectedNode synchronized with nodes array changes from store
    $effect(() => {
        if (selectedNode?.id && nodes.length > 0) {
            const updatedNode = nodes.find(node => node.id === selectedNode!.id);
            if (updatedNode && JSON.stringify(updatedNode.data?.parameters) !== JSON.stringify(selectedNode.data?.parameters)) {
                selectedNode = updatedNode;
            }
        }
    });

    function updateParameter(key: string, value: string | number | boolean) {
        // Update local parameters immediately for instant UI feedback
        parameters[key] = value;
        
        if (selectedNode) {
            // Update the store
            onUpdateComponent(selectedNode.id, parameters);
            
            // Force immediate update of nodes array for instant visual feedback
            const nodeIndex = nodes.findIndex(node => node.id === selectedNode!.id);
            if (nodeIndex !== -1) {
                nodes[nodeIndex] = {
                    ...nodes[nodeIndex],
                    data: {
                        ...nodes[nodeIndex].data,
                        parameters: { ...parameters }
                    }
                };
                // Trigger reactivity by creating new array
                nodes = [...nodes];
            }
            
            // Force immediate update of selectedNode for instant UI feedback
            selectedNode = {
                ...selectedNode,
                data: {
                    ...selectedNode.data,
                    parameters: { ...parameters }
                }
            };
        }
    }

    function deleteComponent() {
        if (selectedNode) {
            onRemoveComponent(selectedNode.id);
        }
    }

    function duplicateComponent() {
        if (selectedNode) {
            const newPosition = {
                x: selectedNode.position.x + 50,
                y: selectedNode.position.y + 50
            };
            onAddComponent(selectedNode.type!, newPosition);
        }
    }

    function resetToDefaults() {
        if (selectedNode) {
            const defaultParams = getDefaultParameters(selectedNode.type!);
            parameters = { ...defaultParams };
            
            // Update the store
            onUpdateComponent(selectedNode.id, parameters);
            
            // Force immediate update of nodes array for instant visual feedback
            const nodeIndex = nodes.findIndex(node => node.id === selectedNode!.id);
            if (nodeIndex !== -1) {
                nodes[nodeIndex] = {
                    ...nodes[nodeIndex],
                    data: {
                        ...nodes[nodeIndex].data,
                        parameters: { ...parameters }
                    }
                };
                // Trigger reactivity by creating new array
                nodes = [...nodes];
            }
            
            // Force immediate update of selectedNode for instant visual feedback
            selectedNode = {
                ...selectedNode,
                data: {
                    ...selectedNode.data,
                    parameters: { ...parameters }
                }
            };
        }
    }



    function exportJSON() {
        const jsonData = onExportJSON();
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

    // Enhanced parameter definitions with different input types
    function getParameterFields(nodeType: string): FieldDefinition[] {
        switch (nodeType) {
            case 'resistor':
                return [
                    { 
                        key: 'resistance', 
                        label: 'Resistance', 
                        type: 'input',
                        unit: 'Ω', 
                        placeholder: '1k',
                        suggestions: ['1', '10', '100', '1k', '10k', '100k', '1M']
                    },
                    { 
                        key: 'tolerance', 
                        label: 'Tolerance', 
                        type: 'select',
                        unit: '%', 
                        placeholder: '5%',
                        options: ['1%', '2%', '5%', '10%', '20%']
                    },
                    { 
                        key: 'power', 
                        label: 'Power Rating', 
                        type: 'select',
                        unit: 'W', 
                        placeholder: '0.25W',
                        options: ['0.125W', '0.25W', '0.5W', '1W', '2W', '5W']
                    },
                    {
                        key: 'temperature_coefficient',
                        label: 'Temp. Coefficient',
                        type: 'input',
                        unit: 'ppm/°C',
                        placeholder: '100'
                    }
                ];
            case 'capacitor':
                return [
                    { 
                        key: 'capacitance', 
                        label: 'Capacitance', 
                        type: 'input',
                        unit: 'F', 
                        placeholder: '1μ',
                        suggestions: ['1p', '10p', '100p', '1n', '10n', '100n', '1μ', '10μ', '100μ']
                    },
                    { 
                        key: 'voltage', 
                        label: 'Voltage Rating', 
                        type: 'select',
                        unit: 'V', 
                        placeholder: '25V',
                        options: ['6.3V', '10V', '16V', '25V', '35V', '50V', '63V', '100V']
                    },
                    { 
                        key: 'type', 
                        label: 'Dielectric Type', 
                        type: 'select',
                        unit: '', 
                        placeholder: 'Ceramic',
                        options: ['Ceramic', 'Electrolytic', 'Tantalum', 'Film', 'Mica']
                    },
                    {
                        key: 'esr',
                        label: 'ESR',
                        type: 'input',
                        unit: 'Ω',
                        placeholder: '0.1'
                    }
                ];
            case 'inductor':
                return [
                    { 
                        key: 'inductance', 
                        label: 'Inductance', 
                        type: 'input',
                        unit: 'H', 
                        placeholder: '1m',
                        suggestions: ['1μ', '10μ', '100μ', '1m', '10m', '100m', '1H']
                    },
                    { 
                        key: 'current', 
                        label: 'Current Rating', 
                        type: 'input',
                        unit: 'A', 
                        placeholder: '1A'
                    },
                    { 
                        key: 'dcr', 
                        label: 'DC Resistance', 
                        type: 'input',
                        unit: 'Ω', 
                        placeholder: '1'
                    },
                    {
                        key: 'core_material',
                        label: 'Core Material',
                        type: 'select',
                        unit: '',
                        placeholder: 'Ferrite',
                        options: ['Air', 'Ferrite', 'Iron Powder', 'Laminated Iron']
                    }
                ];
            case 'voltageSource':
                return [
                    { 
                        key: 'voltage', 
                        label: 'Voltage', 
                        type: 'input',
                        unit: 'V', 
                        placeholder: '5V'
                    },
                    { 
                        key: 'type', 
                        label: 'Source Type', 
                        type: 'select',
                        unit: '', 
                        placeholder: 'DC',
                        options: ['DC', 'AC', 'PULSE', 'SIN', 'EXP', 'PWL']
                    },
                    { 
                        key: 'frequency', 
                        label: 'Frequency', 
                        type: 'input',
                        unit: 'Hz', 
                        placeholder: '60',
                        condition: (params: Record<string, any>) => params.type === 'AC' || params.type === 'SIN'
                    },
                    {
                        key: 'phase',
                        label: 'Phase',
                        type: 'slider',
                        unit: '°',
                        placeholder: '0',
                        min: 0,
                        max: 360,
                        step: 1,
                        condition: (params: Record<string, any>) => params.type === 'AC' || params.type === 'SIN'
                    }
                ];
            case 'ground':
                return [
                    {
                        key: 'type',
                        label: 'Ground Type',
                        type: 'select',
                        unit: '',
                        placeholder: 'Earth',
                        options: ['Earth', 'Chassis', 'Signal', 'Digital', 'Analog', 'Shield']
                    },
                    {
                        key: 'impedance',
                        label: 'Ground Impedance',
                        type: 'input',
                        unit: 'Ω',
                        placeholder: '0'
                    },
                    {
                        key: 'plane_area',
                        label: 'Ground Plane Area',
                        type: 'select',
                        unit: 'cm²',
                        placeholder: 'Large',
                        options: ['Small (<1cm²)', 'Medium (1-10cm²)', 'Large (>10cm²)', 'Full Plane']
                    },
                    {
                        key: 'via_count',
                        label: 'Via Count',
                        type: 'slider',
                        unit: '',
                        placeholder: '4',
                        min: 1,
                        max: 50,
                        step: 1,
                        defaultValue: 4
                    }
                ];
            case 'diode':
                return [
                    { 
                        key: 'type', 
                        label: 'Part Number', 
                        type: 'select',
                        unit: '', 
                        placeholder: '1N4148',
                        options: ['1N4148', '1N4007', '1N5819', 'BAT54', 'LED_Red', 'LED_Blue', 'LED_Green', 'Zener_5V1']
                    },
                    { 
                        key: 'forwardVoltage', 
                        label: 'Forward Voltage', 
                        type: 'input',
                        unit: 'V', 
                        placeholder: '0.7'
                    },
                    { 
                        key: 'current', 
                        label: 'Max Current', 
                        type: 'input',
                        unit: 'A', 
                        placeholder: '200m'
                    },
                    {
                        key: 'reverse_voltage',
                        label: 'Peak Reverse Voltage',
                        type: 'input',
                        unit: 'V',
                        placeholder: '100'
                    }
                ];
            case 'transistor':
                return [
                    { 
                        key: 'type', 
                        label: 'Part Number', 
                        type: 'select',
                        unit: '', 
                        placeholder: '2N3904',
                        options: ['2N3904', '2N3906', 'BC547', 'BC557', 'IRF540', 'IRF9540', '2N7002']
                    },
                    { 
                        key: 'configuration', 
                        label: 'Type', 
                        type: 'select',
                        unit: '', 
                        placeholder: 'NPN',
                        options: ['NPN', 'PNP', 'N-Channel', 'P-Channel']
                    },
                    { 
                        key: 'beta', 
                        label: 'Beta (hFE)', 
                        type: 'slider',
                        unit: '', 
                        placeholder: '100',
                        min: 10,
                        max: 1000,
                        step: 10
                    },
                    {
                        key: 'vce_sat',
                        label: 'VCE(sat)',
                        type: 'input',
                        unit: 'V',
                        placeholder: '0.2'
                    }
                ];
            case 'opamp':
                return [
                    { 
                        key: 'type', 
                        label: 'Part Number', 
                        type: 'select',
                        unit: '', 
                        placeholder: 'LM741',
                        options: ['LM741', 'LM358', 'TL072', 'OPA2134', 'AD8066', 'LTC6078']
                    },
                    { 
                        key: 'gain', 
                        label: 'Open Loop Gain', 
                        type: 'input',
                        unit: 'dB', 
                        placeholder: '100k'
                    },
                    { 
                        key: 'supply', 
                        label: 'Supply Voltage', 
                        type: 'select',
                        unit: 'V', 
                        placeholder: '±15V',
                        options: ['±5V', '±9V', '±12V', '±15V', '±18V', '3.3V', '5V']
                    },
                    { 
                        key: 'gainBandwidth', 
                        label: 'Gain-Bandwidth Product', 
                        type: 'input',
                        unit: 'Hz', 
                        placeholder: '1M'
                    },
                    {
                        key: 'slew_rate',
                        label: 'Slew Rate',
                        type: 'input',
                        unit: 'V/μs',
                        placeholder: '0.5'
                    }
                ];
            case 'currentSource':
                return [
                    { 
                        key: 'current', 
                        label: 'Current', 
                        type: 'input',
                        unit: 'A', 
                        placeholder: '1A'
                    },
                    { 
                        key: 'type', 
                        label: 'Source Type', 
                        type: 'select',
                        unit: '', 
                        placeholder: 'DC',
                        options: ['DC', 'AC', 'PULSE', 'SIN']
                    }
                ];
            case 'voltmeter':
                return [
                    { 
                        key: 'range', 
                        label: 'Voltage Range', 
                        type: 'select',
                        unit: 'V', 
                        placeholder: '10V',
                        options: ['1V', '10V', '100V', '1000V', 'Auto']
                    },
                    { 
                        key: 'impedance', 
                        label: 'Input Impedance', 
                        type: 'select',
                        unit: 'Ω', 
                        placeholder: '10M',
                        options: ['1M', '10M', '100M', '1G']
                    },
                    {
                        key: 'accuracy',
                        label: 'Accuracy',
                        type: 'select',
                        unit: '%',
                        placeholder: '1%',
                        options: ['0.1%', '0.5%', '1%', '2%', '5%']
                    }
                ];
            case 'ammeter':
                return [
                    { 
                        key: 'range', 
                        label: 'Current Range', 
                        type: 'select',
                        unit: 'A', 
                        placeholder: '1A',
                        options: ['1μA', '1mA', '10mA', '100mA', '1A', '10A', 'Auto']
                    },
                    { 
                        key: 'resistance', 
                        label: 'Series Resistance', 
                        type: 'input',
                        unit: 'Ω', 
                        placeholder: '0.1'
                    }
                ];
            case 'probe':
                return [
                    { 
                        key: 'impedance', 
                        label: 'Input Impedance', 
                        type: 'input',
                        unit: 'Ω', 
                        placeholder: '1M'
                    },
                    { 
                        key: 'capacitance', 
                        label: 'Input Capacitance', 
                        type: 'input',
                        unit: 'F', 
                        placeholder: '10p'
                    },
                    {
                        key: 'attenuation',
                        label: 'Attenuation',
                        type: 'select',
                        unit: '',
                        placeholder: '1x',
                        options: ['1x', '10x', '100x']
                    }
                ];
            default:
                return [];
        }
    }

    function getDefaultParameters(type: string) {
        switch (type) {
            case 'resistor':
                return { resistance: '1k', tolerance: '5%', power: '0.25W', temperature_coefficient: '100' };
            case 'capacitor':
                return { capacitance: '1μ', voltage: '25V', type: 'Ceramic', esr: '0.1' };
            case 'inductor':
                return { inductance: '1m', current: '1A', dcr: '1', core_material: 'Ferrite' };
            case 'voltageSource':
                return { voltage: '5V', type: 'DC', frequency: '60', phase: 0 };
            case 'ground':
                return { type: 'Earth', impedance: '0', plane_area: 'Large', via_count: 4 };
            case 'diode':
                return { type: '1N4148', forwardVoltage: '0.7', current: '200m', reverse_voltage: '100' };
            case 'transistor':
                return { type: '2N3904', configuration: 'NPN', beta: 100, vce_sat: '0.2' };
            case 'opamp':
                return { type: 'LM741', gain: '100k', supply: '±15V', gainBandwidth: '1M', slew_rate: '0.5' };
            default:
                return {};
        }
    }

    function renderField(field: FieldDefinition, value: any) {
        // Check if field should be shown based on condition
        if (field.condition && !field.condition(parameters)) {
            return null;
        }

        switch (field.type) {
            case 'select':
                return {
                    type: 'select',
                    options: field.options,
                    value: value || field.placeholder
                };
            case 'slider':
                return {
                    type: 'slider',
                    min: field.min || 0,
                    max: field.max || 100,
                    step: field.step || 1,
                    value: typeof value === 'number' ? value : (field.defaultValue || field.min || 0)
                };
            case 'switch':
                return {
                    type: 'switch',
                    value: Boolean(value)
                };
            default:
                return {
                    type: 'input',
                    value: value || '',
                    placeholder: field.placeholder,
                    suggestions: field.suggestions
                };
        }
    }
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
    <!-- Properties Panel -->
    <div class="flex-1 flex flex-col min-h-0">
        <div class="p-4 border-b border-border flex-shrink-0">
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-foreground">Properties</h2>
                <div class="flex items-center gap-2">
                    {#if selectedNode}
                        <Badge variant="secondary" class="text-xs">
                            {selectedNode.type}
                        </Badge>
                    {/if}
                    {#if typeof window !== 'undefined' && window.innerWidth < 768}
                        <button
                            onclick={() => window.dispatchEvent(new CustomEvent('closeSidebar'))}
                            class="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    {/if}
                </div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0 sidebar-content">
            {#if selectedNode}
                <div class="p-4 space-y-4">
                    <!-- Component Info Card -->
                    <Card class="p-4">
                        <CardHeader class="p-0">
                            <div class="flex items-center gap-2">
                                <Settings class="w-4 h-4" />
                                <h3 class="text-sm font-medium">Component Details</h3>
                            </div>
                        </CardHeader>
                        <CardContent class="p-0 space-y-3">
                            <div class="grid grid-rows-2 gap-3">
                                <div>
                                    <Label class="text-xs text-muted-foreground">ID</Label>
                                    <div class="text-sm font-mono bg-muted px-2 py-1 rounded text-xs">{selectedNode.id}</div>
                                </div>
                                <div>
                                    <Label class="text-xs text-muted-foreground">Position</Label>
                                    <div class="text-xs text-muted-foreground">
                                        {Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Parameters Card -->
                    <Card class="p-4">
                        <CardHeader class="p-0 pb-3">
                            <div class="flex items-center justify-between">
                                <h3 class="text-sm font-medium">Parameters</h3>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onclick={resetToDefaults}
                                    class="h-6 px-2 text-xs"
                                >
                                    <RotateCcw class="w-3 h-3 mr-1" />
                                    Reset
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent class="p-0 space-y-4">
                            {#each getParameterFields(selectedNode.type || '') as field}
                                {@const fieldData = renderField(field, parameters[field.key])}
                                {#if fieldData}
                                    {@const sliderValue = fieldData.type === 'slider' ? [fieldData.value] : []}
                                    <div class="space-y-2">
                                        <Label for={field.key} class="text-xs font-medium truncate block">{field.label}</Label>
                                        
                                        {#if fieldData.type === 'select'}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger>
                                                    <Button variant="outline" class="w-full justify-between h-8 text-sm">
                                                        {fieldData.value}
                                                        <ChevronDown class="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent class="w-[var(--radix-dropdown-menu-trigger-width)]">
                                                    {#each (fieldData.options || []) as option}
                                                        <DropdownMenuItem onclick={() => updateParameter(field.key, String(option))}>
                                                            {option}
                                                        </DropdownMenuItem>
                                                    {/each}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        {:else if fieldData.type === 'slider'}
                                            <div class="space-y-2">
                                                <input
                                                    type="range"
                                                    bind:value={fieldData.value}
                                                    min={fieldData.min}
                                                    max={fieldData.max}
                                                    step={fieldData.step}
                                                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                                    oninput={(e) => updateParameter(field.key, Number(e.currentTarget.value))}
                                                />
                                                <div class="flex justify-between text-xs text-muted-foreground">
                                                    <span>{fieldData.min}{field.unit}</span>
                                                    <span class="font-medium">{fieldData.value}{field.unit}</span>
                                                    <span>{fieldData.max}{field.unit}</span>
                                                </div>
                                            </div>
                                        {:else if fieldData.type === 'switch'}
                                            <div class="flex items-center space-x-2">
                                                <Switch
                                                    checked={fieldData.value}
                                                    onCheckedChange={(checked) => updateParameter(field.key, checked)}
                                                />
                                                <Label class="text-sm">{fieldData.value ? 'Enabled' : 'Disabled'}</Label>
                                            </div>
                                        {:else}
                                            <div class="flex">
                                                <Input
                                                    id={field.key}
                                                    value={fieldData.value}
                                                    placeholder={fieldData.placeholder}
                                                    oninput={(e) => updateParameter(field.key, e.currentTarget.value)}
                                                    class="text-sm h-8"
                                                    list={'suggestions' in field && field.suggestions ? `${field.key}-suggestions` : undefined}
                                                />
                                                {#if field.unit}
                                                    <span class="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-l-0 rounded-r-md">
                                                        {field.unit}
                                                    </span>
                                                {/if}
                                            </div>
                                            
                                            {#if field.suggestions}
                                                <datalist id="{field.key}-suggestions">
                                                    {#each field.suggestions as suggestion}
                                                        <option value={suggestion}></option>
                                                    {/each}
                                                </datalist>
                                            {/if}
                                        {/if}
                                    </div>
                                {/if}
                            {/each}
                        </CardContent>
                    </Card>

                    <!-- Action Buttons -->
                    <div class="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onclick={duplicateComponent}>
                            <Copy class="w-3 h-3 mr-1" />
                            Duplicate
                        </Button>
                        <Button variant="destructive" size="sm" onclick={deleteComponent}>
                            <Trash2 class="w-3 h-3 mr-1" />
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
                    <p class="text-xs mt-2 text-muted-foreground">
                        Click on any component in the circuit to see detailed parameters
                    </p>
                </div>
            {/if}
        </div>
    </div>

    <!-- Export Panel -->
    <div class="border-t border-border flex-shrink-0 sidebar-content">
        <div class="p-4">
            <h2 class="text-lg font-semibold text-foreground mb-4">Export</h2>
            
            <div class="space-y-2">
                <Button size="sm" class="w-full" variant="outline" onclick={exportJSON}>
                    Export JSON
                </Button>
            </div>
        </div>
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

    /* Prevent label overflow */
    :global(.truncate) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Ensure proper text wrapping for long labels */
    :global(.text-xs) {
        word-break: break-word;
        hyphens: auto;
    }
</style>