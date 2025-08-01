export interface SimulationConfig {
    type: 'dc' | 'ac' | 'transient';
    startTime?: number;
    endTime?: number;
    stepTime?: number;
    frequency?: number;
    voltage?: number;
    temperature?: number;
}

export interface SimulationResult {
    success: boolean;
    data?: any;
    error?: string;
    netlist?: string;
}

export interface ComponentData {
    id: string;
    type: string;
    parameters: Record<string, any>;
    position: { x: number; y: number };
}

export interface ConnectionData {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export class CircuitSimulator {
    private nodeCounter = 0;
    private componentMap = new Map<string, string>();

    generateNetlist(nodes: ComponentData[], edges: ConnectionData[], config: SimulationConfig): string {
        this.nodeCounter = 0;
        this.componentMap.clear();
        
        const netlist: string[] = [];
        netlist.push('* Circuit Netlist Generated by Saffron Circuit Simulator');
        netlist.push('* Simulation Configuration:');
        netlist.push(`* Type: ${config.type.toUpperCase()}`);
        netlist.push(`* Temperature: ${config.temperature || 27}°C`);
        netlist.push(`* Voltage: ${config.voltage || 5}V`);
        netlist.push('');

        // Generate node mapping
        const nodeMap = this.generateNodeMapping(nodes, edges);
        
        // Add components
        nodes.forEach((node, index) => {
            const compId = this.getComponentId(node.type, index);
            this.componentMap.set(node.id, compId);
            
            const netlistLine = this.generateComponentLine(node, compId, nodeMap);
            if (netlistLine) {
                netlist.push(netlistLine);
            }
        });

        netlist.push('');

        // Add simulation commands
        netlist.push(...this.generateSimulationCommands(config));

        netlist.push('.end');
        return netlist.join('\n');
    }

    private generateNodeMapping(nodes: ComponentData[], edges: ConnectionData[]): Map<string, number> {
        const nodeMap = new Map<string, number>();
        let nodeId = 1;

        // Add ground node
        nodeMap.set('ground', 0);

        // Process all connections to assign node numbers
        edges.forEach(edge => {
            if (!nodeMap.has(edge.source)) {
                nodeMap.set(edge.source, nodeId++);
            }
            if (!nodeMap.has(edge.target)) {
                nodeMap.set(edge.target, nodeId++);
            }
        });

        // Add isolated nodes
        nodes.forEach(node => {
            if (!nodeMap.has(node.id)) {
                nodeMap.set(node.id, nodeId++);
            }
        });

        return nodeMap;
    }

    private getComponentId(type: string, index: number): string {
        const prefix = type.charAt(0).toUpperCase();
        return `${prefix}${index + 1}`;
    }

    private generateComponentLine(node: ComponentData, compId: string, nodeMap: Map<string, number>): string {
        const params = node.parameters || {};
        const node1 = nodeMap.get(node.id) || 0;
        const node2 = nodeMap.get('ground') || 0; // Default to ground

        switch (node.type) {
            case 'resistor':
                const resistance = this.parseValue(params.resistance || '1k');
                return `${compId} ${node1} ${node2} ${resistance}`;
            
            case 'capacitor':
                const capacitance = this.parseValue(params.capacitance || '1u');
                return `${compId} ${node1} ${node2} ${capacitance}`;
            
            case 'inductor':
                const inductance = this.parseValue(params.inductance || '1m');
                return `${compId} ${node1} ${node2} ${inductance}`;
            
            case 'voltageSource':
                const voltage = this.parseValue(params.voltage || '5V');
                const sourceType = params.type || 'DC';
                if (sourceType === 'AC') {
                    const frequency = params.frequency || '60';
                    const phase = params.phase || '0';
                    return `${compId} ${node1} ${node2} AC ${voltage} ${frequency} ${phase}`;
                } else {
                    return `${compId} ${node1} ${node2} ${voltage}`;
                }
            
            case 'currentSource':
                const current = this.parseValue(params.current || '1A');
                const currentType = params.type || 'DC';
                if (currentType === 'AC') {
                    const frequency = params.frequency || '60';
                    const phase = params.phase || '0';
                    return `${compId} ${node1} ${node2} AC ${current} ${frequency} ${phase}`;
                } else {
                    return `${compId} ${node1} ${node2} ${current}`;
                }
            
            case 'diode':
                const model = params.type || '1N4148';
                return `${compId} ${node1} ${node2} ${model}`;
            
            case 'transistor':
                const transistorType = params.configuration || 'NPN';
                const modelName = params.type || '2N3904';
                const baseNode = nodeMap.get(node.id + '_base') || node1;
                const collectorNode = nodeMap.get(node.id + '_collector') || node1;
                const emitterNode = nodeMap.get(node.id + '_emitter') || node2;
                return `${compId} ${collectorNode} ${baseNode} ${emitterNode} ${modelName}`;
            
            case 'opamp':
                const opampModel = params.type || 'LM741';
                const inPos = nodeMap.get(node.id + '_in+') || node1;
                const inNeg = nodeMap.get(node.id + '_in-') || node2;
                const out = nodeMap.get(node.id + '_out') || (node1 + 1);
                return `${compId} ${out} ${inPos} ${inNeg} ${opampModel}`;
            
            case 'ground':
                return `* Ground node ${compId} at node ${node1}`;
            
            default:
                return `* Unsupported component type: ${node.type}`;
        }
    }

    private generateSimulationCommands(config: SimulationConfig): string[] {
        const commands: string[] = [];

        switch (config.type) {
            case 'dc':
                const voltage = config.voltage || 5;
                commands.push(`.dc V1 0 ${voltage} 0.1`); // DC sweep
                break;
            
            case 'ac':
                const freq = config.frequency || 1000;
                const acVoltage = config.voltage || 5;
                commands.push(`.ac DEC 10 0.1 ${freq}`);
                commands.push(`.print AC V(1)`);
                break;
            
            case 'transient':
                const start = config.startTime || 0;
                const end = config.endTime || 1;
                const step = config.stepTime || 0.01;
                const tranVoltage = config.voltage || 5;
                commands.push(`.tran ${step} ${end} ${start}`);
                commands.push(`.print TRAN V(1)`);
                break;
        }

        // Add analysis commands
        const temperature = config.temperature || 27;
        commands.push(`.options TEMP=${temperature}`);
        commands.push('.options ABSTOL=1e-9');
        commands.push('.options RELTOL=1e-3');
        commands.push('.options CHGTOL=1e-12');
        commands.push('.options VNTOL=1e-6');

        return commands;
    }

    private parseValue(value: string): string {
        // Convert common units to SPICE format
        const units: Record<string, string> = {
            'k': 'e3',
            'K': 'e3',
            'm': 'e-3',
            'M': 'e6',
            'u': 'e-6',
            'μ': 'e-6',
            'n': 'e-9',
            'p': 'e-12',
            'f': 'e-15'
        };

        let result = value;
        for (const [unit, multiplier] of Object.entries(units)) {
            if (value.includes(unit)) {
                result = value.replace(unit, multiplier);
                break;
            }
        }

        return result;
    }

    async simulate(netlist: string, config: SimulationConfig): Promise<SimulationResult> {
        try {
            // For now, return a mock simulation result
            // In a real implementation, this would call a SPICE engine
            return {
                success: true,
                data: {
                    type: config.type,
                    time: new Date().toISOString(),
                    results: this.generateMockResults(config)
                },
                netlist
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private generateMockResults(config: SimulationConfig): any {
        switch (config.type) {
            case 'dc':
                return {
                    voltage: Array.from({ length: 100 }, (_, i) => ({
                        x: i * 0.1,
                        y: Math.sin(i * 0.1) * 5
                    }))
                };
            
            case 'ac':
                return {
                    frequency: Array.from({ length: 50 }, (_, i) => ({
                        x: Math.pow(10, i * 0.1),
                        y: 20 * Math.log10(1 / (1 + i * 0.1))
                    }))
                };
            
            case 'transient':
                return {
                    time: Array.from({ length: 100 }, (_, i) => ({
                        x: i * 0.01,
                        y: Math.exp(-i * 0.01) * Math.sin(i * 0.1 * Math.PI)
                    }))
                };
            
            default:
                return {};
        }
    }
}

export const circuitSimulator = new CircuitSimulator(); 