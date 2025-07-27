import { writable } from 'svelte/store';
import type { Node, Edge } from '@xyflow/svelte';
import { createSupabaseBrowserClient } from '$lib/supabase';
import type { Database } from '$lib/types/database.types';
import { browser } from '$app/environment';

// Simple save function for circuit changes
async function saveCircuitChanges(projectId: string | null, data: any): Promise<boolean> {
	if (!projectId || !browser) return false;

	try {
		const supabase = createSupabaseBrowserClient();
		const { error } = await supabase
			.from('projects')
			.update({
				schematic_data: data,
				updated_at: new Date().toISOString()
			})
			.eq('id', projectId);

		if (error) {
			console.error('Error saving circuit changes:', error);
			return false;
		}

		return true;
	} catch (error) {
		console.error('Error saving circuit changes:', error);
		return false;
	}
}

interface ComponentParameters {
	[key: string]: any;
}

// Component data types
export interface ResistorData {
	label: string;
	parameters: {
		resistance: string;
		tolerance: string;
	};
}

export interface CapacitorData {
	label: string;
	parameters: {
		capacitance: string;
		voltage: string;
	};
}

export interface InductorData {
	label: string;
	parameters: {
		inductance: string;
		current: string;
	};
}

export interface VoltageSourceData {
	label: string;
	parameters: {
		voltage: string;
		type: string;
	};
}

export interface DiodeData {
	label: string;
	parameters: {
		type: string;
	};
}

export interface TransistorData {
	label: string;
	parameters: {
		type: string;
		configuration: string;
	};
}

export interface OpAmpData {
	label: string;
	parameters: {
		type: string;
		gain: string;
		supply: string;
	};
}

export interface GroundData {
	label: string;
	parameters: {};
}

interface CircuitComponent {
	id: string;
	type: string;
	parameters: ComponentParameters;
	position: { x: number; y: number };
	connections: { [portName: string]: string[] };
}

interface CircuitData {
	modules: {
		[moduleName: string]: {
			ports: {
				[portName: string]: {
					direction: 'input' | 'output';
					bits: (number | string)[];
				};
			};
			cells: {
				[cellName: string]: {
					type: string;
					parameters: ComponentParameters;
					port_directions: {
						[portName: string]: 'input' | 'output';
					};
					connections: {
						[portName: string]: (number | string)[];
					};
				};
			};
		};
	};
}

function createCircuitStore() {
	const { subscribe, set, update } = writable<{
		nodes: Node[];
		edges: Edge[];
		circuitData: CircuitData;
		projectId: string | null;
		isCollaborative: boolean;
		throttledSave: boolean;
		pendingChanges: boolean;
	}>({
		nodes: [],
		edges: [],
		circuitData: {
			modules: {
				main: {
					ports: {},
					cells: {}
				}
			}
		},
		projectId: null,
		isCollaborative: false,
		throttledSave: false,
		pendingChanges: false
	});

	// Debouncing variables
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	const SAVE_DEBOUNCE_TIME = 2000; // 2 seconds

	return {
		subscribe,
		addComponent: (type: string, position: { x: number; y: number }, id?: string) => {
			// Snap to grid for better alignment
			const snappedPosition = {
				x: Math.round(position.x / 10) * 10,
				y: Math.round(position.y / 10) * 10
			};

			const componentId = id || `${type}_${Date.now()}`;
			const newNode: Node = {
				id: componentId,
				type,
				position: snappedPosition,
				data: {
					label: type,
					parameters: getDefaultParameters(type)
				}
			};

			update((store) => {
				const updatedStore = {
					...store,
					nodes: [...store.nodes, newNode],
					pendingChanges: true
				};

				// Trigger save if collaborative
				if (store.isCollaborative) {
					debouncedSave(updatedStore);
				}

				return updatedStore;
			});

			return componentId;
		},
		updateComponent: (id: string, parameters: ComponentParameters) => {
			update((store) => {
				const updatedStore = {
					...store,
					nodes: store.nodes.map((node) =>
						node.id === id ? { ...node, data: { ...node.data, parameters } } : node
					),
					pendingChanges: true
				};
				console.log('Updated component:', updatedStore);
				// Trigger save if collaborative
				if (store.isCollaborative) {
					debouncedSave(updatedStore);
				}

				return updatedStore;
			});
		},
		updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
			update((store) => {
				const updatedStore = {
					...store,
					nodes: store.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node)),
					pendingChanges: true
				};

				// Trigger save if collaborative
				if (store.isCollaborative) {
					debouncedSave(updatedStore);
				}

				return updatedStore;
			});
		},
		removeComponent: (id: string) => {
			update((store) => {
				const updatedStore = {
					...store,
					nodes: store.nodes.filter((node) => node.id !== id),
					edges: store.edges.filter((edge) => edge.source !== id && edge.target !== id),
					pendingChanges: true
				};

				// Trigger save if collaborative
				if (store.isCollaborative) {
					debouncedSave(updatedStore);
				}

				return updatedStore;
			});
		},
		addConnection: (edge: Edge) => {
			update((store) => {
				const updatedStore = {
					...store,
					edges: [...store.edges, edge],
					pendingChanges: true
				};

				// Trigger save if collaborative
				if (store.isCollaborative) {
					debouncedSave(updatedStore);
				}

				return updatedStore;
			});
		},
		removeConnection: (edgeId: string) => {
			update((store) => {
				const updatedStore = {
					...store,
					edges: store.edges.filter((edge) => edge.id !== edgeId),
					pendingChanges: true
				};

				// Trigger save if collaborative
				if (store.isCollaborative) {
					debouncedSave(updatedStore);
				}

				return updatedStore;
			});
		},
		updateWireStyle: (edgeId: string, wireShape: string, wireStyle?: string, color?: string) => {
			update((store) => {
				const updatedStore = {
					...store,
					edges: store.edges.map((edge) =>
						edge.id === edgeId
							? {
									...edge,
									data: {
										...edge.data,
										wireShape,
										...(wireStyle && { wireStyle }),
										...(color && { color })
									}
								}
							: edge
					),
					pendingChanges: true
				};

				// Trigger save if collaborative
				if (store.isCollaborative) {
					debouncedSave(updatedStore);
				}

				return updatedStore;
			});
		},
		exportNetlist: () => {
			let state: any;
			subscribe((s) => (state = s))();

			if (!state) return '';

			const netlist: string[] = [];
			netlist.push('* Circuit Netlist Generated by Saffron Circuit Simulator');
			netlist.push('.include modelcard.CMOS90');
			netlist.push('');

			// Create net mapping for connections
			const netMap = new Map<string, string>();
			let netCounter = 1;

			// Process edges to create net connections
			state.edges.forEach((edge: any) => {
				const sourceHandle = `${edge.source}.${edge.sourceHandle || 'output'}`;
				const targetHandle = `${edge.target}.${edge.targetHandle || 'input'}`;

				// Create or get net name
				let netName = netMap.get(sourceHandle);
				if (!netName) {
					netName = `n${netCounter++}`;
					netMap.set(sourceHandle, netName);
				}
				netMap.set(targetHandle, netName);
			});

			// Add components with proper netlist format
			state.nodes.forEach((node: any, index: number) => {
				const { id, type, data } = node;
				const params = data.parameters || {};
				const compId = `${type.charAt(0).toUpperCase()}${index + 1}`;

				switch (type) {
					case 'resistor':
						const rNet1 = netMap.get(`${id}.left`) || `${id}_1`;
						const rNet2 = netMap.get(`${id}.right`) || `${id}_2`;
						netlist.push(`${compId} ${rNet1} ${rNet2} ${params.resistance || '1k'}`);
						break;

					case 'capacitor':
						const cNet1 = netMap.get(`${id}.left`) || `${id}_1`;
						const cNet2 = netMap.get(`${id}.right`) || `${id}_2`;
						netlist.push(`${compId} ${cNet1} ${cNet2} ${params.capacitance || '1u'}`);
						break;

					case 'inductor':
						const lNet1 = netMap.get(`${id}.left`) || `${id}_1`;
						const lNet2 = netMap.get(`${id}.right`) || `${id}_2`;
						netlist.push(`${compId} ${lNet1} ${lNet2} ${params.inductance || '1m'}`);
						break;

					case 'voltageSource':
						const vNet1 = netMap.get(`${id}.positive`) || `${id}_pos`;
						const vNet2 = netMap.get(`${id}.negative`) || '0';
						const voltage = params.voltage || '5V';
						const sourceType = params.type || 'DC';

						if (sourceType === 'PULSE') {
							const freq = params.frequency || '1k';
							const period = 1000 / parseFloat(freq);
							netlist.push(
								`${compId} ${vNet1} ${vNet2} 0 pulse (0 ${voltage} 0 0.1 0.1 ${period / 2} ${period})`
							);
						} else if (sourceType === 'SIN') {
							const freq = params.frequency || '1k';
							netlist.push(`${compId} ${vNet1} ${vNet2} 0 sin (0 ${voltage} ${freq}Hz)`);
						} else {
							netlist.push(`${compId} ${vNet1} ${vNet2} ${voltage}`);
						}
						break;

					case 'currentSource':
						const iNet1 = netMap.get(`${id}.positive`) || `${id}_pos`;
						const iNet2 = netMap.get(`${id}.negative`) || '0';
						netlist.push(`I${compId.slice(1)} ${iNet1} ${iNet2} ${params.current || '1m'}`);
						break;

					case 'diode':
						const dNet1 = netMap.get(`${id}.left`) || `${id}_a`;
						const dNet2 = netMap.get(`${id}.right`) || `${id}_k`;
						netlist.push(`${compId} ${dNet1} ${dNet2} ${params.type || '1N4148'}`);
						break;

					case 'transistor':
						const tNetC = netMap.get(`${id}.collector`) || `${id}_c`;
						const tNetB = netMap.get(`${id}.base`) || `${id}_b`;
						const tNetE = netMap.get(`${id}.emitter`) || `${id}_e`;
						const tType = params.configuration || 'NPN';
						const modelName = tType === 'NPN' ? 'N90' : 'P90';
						netlist.push(
							`M${compId.slice(1)} ${tNetC} ${tNetB} ${tNetE} ${tNetE} ${modelName} W=100.0u L=0.09u`
						);
						break;

					case 'opamp':
						const oNetOut = netMap.get(`${id}.output`) || `${id}_out`;
						const oNetPos = netMap.get(`${id}.positive`) || `${id}_pos`;
						const oNetNeg = netMap.get(`${id}.negative`) || `${id}_neg`;
						const oNetVcc = netMap.get(`${id}.vcc`) || 'vdd';
						const oNetVee = netMap.get(`${id}.vee`) || '0';
						netlist.push(
							`X${compId.slice(1)} ${oNetPos} ${oNetNeg} ${oNetOut} ${oNetVcc} ${oNetVee} ${params.type || 'LM741'}`
						);
						break;

					case 'ground':
						// Ground connections are handled implicitly as net '0'
						break;
				}
			});

			netlist.push('');
			netlist.push('.tran 0.1 50');
			netlist.push('.end');

			return netlist.join('\n');
		},
		exportJSON: () => {
			let state: any;
			subscribe((s) => (state = s))();

			if (!state) return '{}';

			// Create bit counter for unique net IDs
			let bitCounter = 2;
			const netMap = new Map<string, number>();

			// Helper to get or create bit ID for a net
			function getBitId(netName: string): number {
				if (!netMap.has(netName)) {
					netMap.set(netName, bitCounter++);
				}
				return netMap.get(netName)!;
			}

			// Create ports and cells
			const ports: any = {};
			const cells: any = {};

			// Add module ports based on external connections
			// For now, we'll create a simple module structure

			// Process nodes to create cells
			state.nodes.forEach((node: any, index: number) => {
				const { id, type, data, position } = node;
				const params = data.parameters || {};
				const cellName = `${type.charAt(0).toUpperCase()}${index + 1}`;

				// Create cell based on component type
				let cellType = '';
				let portDirections: any = {};
				let connections: any = {};
				let attributes: any = {};
				// Add position to attributes for debug and serialization
				attributes.position = { x: position?.x ?? 0, y: position?.y ?? 0 };

				switch (type) {
					case 'resistor':
						cellType = 'r_v';
						connections = {
							A: [getBitId(`${id}_A`)],
							B: [getBitId(`${id}_B`)]
						};
						attributes = {
							value: params.resistance || '10k'
						};
						break;

					case 'capacitor':
						cellType = 'c_v';
						connections = {
							A: [getBitId(`${id}_A`)],
							B: [getBitId(`${id}_B`)]
						};
						attributes = {
							value: params.capacitance || '1u'
						};
						break;

					case 'inductor':
						cellType = 'l_v';
						connections = {
							A: [getBitId(`${id}_A`)],
							B: [getBitId(`${id}_B`)]
						};
						attributes = {
							value: params.inductance || '1m'
						};
						break;

					case 'voltageSource':
						cellType = 'v_source';
						connections = {
							POS: [getBitId(`${id}_POS`)],
							NEG: [getBitId(`${id}_NEG`)]
						};
						attributes = {
							value: params.voltage || '5V',
							type: params.type || 'DC'
						};
						break;

					case 'currentSource':
						cellType = 'i_source';
						connections = {
							POS: [getBitId(`${id}_POS`)],
							NEG: [getBitId(`${id}_NEG`)]
						};
						attributes = {
							value: params.current || '1A'
						};
						break;

					case 'diode':
						cellType = 'd_v';
						portDirections = { A: 'input', K: 'output' };
						connections = {
							A: [getBitId(`${id}_A`)],
							K: [getBitId(`${id}_K`)]
						};
						attributes = {
							model: params.type || '1N4148'
						};
						break;

					case 'transistor':
						const config = params.configuration || 'NPN';
						cellType = config === 'NPN' ? 'q_npn' : 'q_pnp';
						portDirections = { C: 'input', B: 'input', E: 'output' };
						connections = {
							C: [getBitId(`${id}_C`)],
							B: [getBitId(`${id}_B`)],
							E: [getBitId(`${id}_E`)]
						};
						attributes = {
							model: params.type || '2N3904'
						};
						break;

					case 'opamp':
						cellType = 'opamp';
						portDirections = {
							IN_P: 'input',
							IN_N: 'input',
							OUT: 'output',
							VCC: 'input',
							VEE: 'input'
						};
						connections = {
							IN_P: [getBitId(`${id}_IN_P`)],
							IN_N: [getBitId(`${id}_IN_N`)],
							OUT: [getBitId(`${id}_OUT`)],
							VCC: [getBitId(`${id}_VCC`)],
							VEE: [getBitId(`${id}_VEE`)]
						};
						attributes = {
							model: params.type || 'LM741'
						};
						break;

					case 'ground':
						cellType = 'gnd';
						portDirections = { A: 'input' };
						connections = {
							A: [getBitId(`${id}_GND`)]
						};
						attributes = {
							name: 'DGND'
						};
						break;

					case 'voltmeter':
						cellType = 'voltmeter';
						portDirections = { POS: 'input', NEG: 'input' };
						connections = {
							POS: [getBitId(`${id}_POS`)],
							NEG: [getBitId(`${id}_NEG`)]
						};
						attributes = {
							range: params.range || '10V'
						};
						break;

					case 'ammeter':
						cellType = 'ammeter';
						connections = {
							A: [getBitId(`${id}_A`)],
							B: [getBitId(`${id}_B`)]
						};
						attributes = {
							range: params.range || '1A'
						};
						break;

					case 'probe':
						cellType = 'probe';
						portDirections = { A: 'input' };
						connections = {
							A: [getBitId(`${id}_A`)]
						};
						attributes = {
							attenuation: params.attenuation || '1x'
						};
						break;
				}

				if (cellType) {
					const cell: any = {
						type: cellType,
						connections
					};

					if (Object.keys(portDirections).length > 0) {
						cell.port_directions = portDirections;
					}

					if (Object.keys(attributes).length > 0) {
						cell.attributes = attributes;
					}

					cells[cellName] = cell;
				}
			});

			// Update connections based on edges
			state.edges.forEach((edge: any) => {
				const sourceCell = Object.values(cells).find((cell: any) =>
					Object.keys(cell.connections).some((port) =>
						cell.connections[port].some(
							(bit: number) =>
								netMap.has(`${edge.source}_${port}`) && netMap.get(`${edge.source}_${port}`) === bit
						)
					)
				);

				const targetCell = Object.values(cells).find((cell: any) =>
					Object.keys(cell.connections).some((port) =>
						cell.connections[port].some(
							(bit: number) =>
								netMap.has(`${edge.target}_${port}`) && netMap.get(`${edge.target}_${port}`) === bit
						)
					)
				);

				if (sourceCell && targetCell) {
					// Create shared bit for connection
					const sharedBit = getBitId(`${edge.source}_to_${edge.target}`);

					// Find and update the specific ports
					const sourceCellEntry = Object.entries(cells).find(([_, cell]) => cell === sourceCell);
					const targetCellEntry = Object.entries(cells).find(([_, cell]) => cell === targetCell);

					if (sourceCellEntry && targetCellEntry) {
						const [sourceKey, sourceCellData] = sourceCellEntry;
						const [targetKey, targetCellData] = targetCellEntry;

						// Update source output port
						const sourcePortKey = edge.sourceHandle || 'A';
						if ((sourceCellData as any).connections[sourcePortKey]) {
							(sourceCellData as any).connections[sourcePortKey] = [sharedBit];
						}

						// Update target input port
						const targetPortKey = edge.targetHandle || 'A';
						if ((targetCellData as any).connections[targetPortKey]) {
							(targetCellData as any).connections[targetPortKey] = [sharedBit];
						}
					}
				}
			});

			// Create module name based on circuit content
			const moduleName = state.nodes.length > 0 ? 'circuit_main' : 'empty_circuit';

			const jsonStructure = {
				modules: {
					[moduleName]: {
						ports,
						cells
					}
				}
			};

			return JSON.stringify(jsonStructure, null, 2);
		},
		clear: () => {
			set({
				nodes: [],
				edges: [],
				circuitData: {
					modules: {
						main: {
							ports: {},
							cells: {}
						}
					}
				},
				projectId: null,
				isCollaborative: false,
				throttledSave: false,
				pendingChanges: false
			});
		},
		saveCircuit: async (name: string, description: string, userId: string) => {
			let state: any;
			subscribe((s) => (state = s))();

			if (!state) return { success: false, error: 'No circuit data' };

			const client = createSupabaseBrowserClient();

			// Create schematic data object
			const schematicData = {
				nodes: state.nodes,
				edges: state.edges,
				version: '1.0',
				created_at: new Date().toISOString()
			};

			// Count components for the projects table
			const componentCount = state.nodes.length;

			// Save to projects table
			const { data, error } = await client
				.from('projects')
				.insert([
					{
						user_id: userId,
						name,
						description,
						schematic_data: schematicData,
						component_count: componentCount,
						status: 'active'
					}
				])
				.select()
				.single();

			if (error) {
				console.error('Error saving circuit:', error);
				return { success: false, error: error.message };
			} else {
				console.log('Circuit saved successfully:', data);
				return { success: true, project: data };
			}
		},
		updateCircuit: async (projectId: string, name: string, description: string) => {
			let state: any;
			subscribe((s) => (state = s))();

			if (!state) return { success: false, error: 'No circuit data' };

			const client = createSupabaseBrowserClient();

			// Create schematic data object
			const schematicData = {
				nodes: state.nodes,
				edges: state.edges,
				version: '1.0',
				updated_at: new Date().toISOString()
			};

			// Count components for the projects table
			const componentCount = state.nodes.length;

			// Update the project
			const { data, error } = await client
				.from('projects')
				.update({
					name,
					description,
					schematic_data: schematicData,
					component_count: componentCount,
					updated_at: new Date().toISOString()
				})
				.eq('id', projectId)
				.select()
				.single();

			if (error) {
				console.error('Error updating circuit:', error);
				return { success: false, error: error.message };
			} else {
				console.log('Circuit updated successfully:', data);
				return { success: true, project: data };
			}
		},
		loadCircuit: async (projectId: string) => {
			const client = createSupabaseBrowserClient();

			// Load from projects table
			const { data, error } = await client
				.from('projects')
				.select('name, description, schematic_data')
				.eq('id', projectId)
				.single();

			if (error) {
				console.error('Error loading circuit:', error);
				return { success: false, error: error.message };
			}

			if (!data.schematic_data) {
				return { success: false, error: 'No schematic data found' };
			}

			// Parse the schematic data and update store
			const schematicData = data.schematic_data as any;
			const nodes = schematicData.nodes || [];
			const edges = schematicData.edges || [];

			set({
				nodes,
				edges,
				circuitData: {
					modules: {
						main: {
							ports: {},
							cells: {}
						}
					}
				},
				projectId: null,
				isCollaborative: false,
				throttledSave: false,
				pendingChanges: false
			});

			return {
				success: true,
				name: data.name,
				description: data.description
			};
		},

		saveChanges: async () => {
			let success = false;

			update((store) => {
				if (store.projectId && store.pendingChanges) {
					// Save to Supabase
					const data = {
						nodes: store.nodes,
						edges: store.edges,
						circuitData: store.circuitData
					};

					// Will be awaited in the background
					saveCircuitChanges(store.projectId, data).then((result) => {
						success = result;
						if (success) {
							update((s) => ({ ...s, pendingChanges: false }));
						}
					});
				}

				return {
					...store,
					throttledSave: false
				};
			});

			return success;
		},

		loadFromJson: (data: any) => {
			if (!data) return;

			update((store) => {
				// Don't reset projectId and collaborative settings
				return {
					...store,
					nodes: data.nodes || [],
					edges: data.edges || [],
					circuitData: data.circuitData || {
						modules: {
							main: {
								ports: {},
								cells: {}
							}
						}
					},
					pendingChanges: false
				};
			});
		},

		enableCollaboration: (projectId: string) => {
			update((store) => ({
				...store,
				projectId,
				isCollaborative: true
			}));
		},
		disableCollaboration: () => {
			update((store) => ({
				...store,
				projectId: null,
				isCollaborative: false
			}));
		},
		updateNodePositionFromCollaborator: (nodeId: string, position: { x: number; y: number }) => {
			// Update position without triggering save (since this is from a collaborator)
			update((store) => ({
				...store,
				nodes: store.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node))
			}));
		},
		addComponentFromCollaborator: (
			type: string,
			position: { x: number; y: number },
			id: string
		) => {
			// Add component without triggering save (since this is from a collaborator)
			const newNode: Node = {
				id,
				type,
				position,
				data: {
					label: type,
					parameters: getDefaultParameters(type)
				}
			};

			update((store) => ({
				...store,
				nodes: [...store.nodes, newNode]
			}));
		},
		removeComponentFromCollaborator: (id: string) => {
			// Remove component without triggering save (since this is from a collaborator)
			update((store) => ({
				...store,
				nodes: store.nodes.filter((node) => node.id !== id),
				edges: store.edges.filter((edge) => edge.source !== id && edge.target !== id)
			}));
		},
		addConnectionFromCollaborator: (edge: Edge) => {
			// Add connection without triggering save (since this is from a collaborator)
			update((store) => ({
				...store,
				edges: [...store.edges, edge]
			}));
		},
		removeConnectionFromCollaborator: (edgeId: string) => {
			// Remove connection without triggering save (since this is from a collaborator)
			update((store) => ({
				...store,
				edges: store.edges.filter((edge) => edge.id !== edgeId)
			}));
		}
	};

	// Helper function for debouncing saves
	function debouncedSave(store: any) {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		// Set flag that save is pending
		update((s) => ({ ...s, throttledSave: true }));

		saveTimeout = setTimeout(() => {
			// Will be awaited in the background
			saveCircuitChanges(store.projectId, {
				nodes: store.nodes,
				edges: store.edges,
				circuitData: store.circuitData
			}).then((success) => {
				if (success) {
					update((s) => ({
						...s,
						pendingChanges: false,
						throttledSave: false
					}));
				}
			});

			saveTimeout = null;
		}, SAVE_DEBOUNCE_TIME);
	}
}

function getDefaultParameters(type: string): ComponentParameters {
	switch (type) {
		case 'resistor':
			return {
				resistance: '1k',
				tolerance: '5%',
				power: '0.25W',
				temperature_coefficient: '100'
			};
		case 'capacitor':
			return {
				capacitance: '1μ',
				voltage: '25V',
				type: 'Ceramic',
				esr: '0.1'
			};
		case 'inductor':
			return {
				inductance: '1m',
				current: '1A',
				dcr: '1',
				core_material: 'Ferrite'
			};
		case 'voltageSource':
			return {
				voltage: '5V',
				type: 'DC',
				frequency: '60',
				phase: 0
			};
		case 'currentSource':
			return {
				current: '1A',
				type: 'DC'
			};
		case 'diode':
			return {
				type: '1N4148',
				forwardVoltage: '0.7',
				current: '200m',
				reverse_voltage: '100'
			};
		case 'transistor':
			return {
				type: '2N3904',
				configuration: 'NPN',
				beta: 100,
				vce_sat: '0.2'
			};
		case 'opamp':
			return {
				type: 'LM741',
				gain: '100k',
				supply: '±15V',
				gainBandwidth: '1M',
				slew_rate: '0.5'
			};
		case 'ground':
			return {
				type: 'Earth',
				impedance: '0',
				plane_area: 'Large',
				via_count: 4
			};
		case 'voltmeter':
			return {
				range: '10V',
				impedance: '10M',
				accuracy: '1%'
			};
		case 'ammeter':
			return {
				range: '1A',
				resistance: '0.1'
			};
		case 'probe':
			return {
				impedance: '1M',
				capacitance: '10p',
				attenuation: '1x'
			};
		default:
			return {};
	}
}

export const circuitStore = createCircuitStore();
