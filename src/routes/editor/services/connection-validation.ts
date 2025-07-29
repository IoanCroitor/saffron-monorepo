// Connection validation service for realistic circuit component connections
// Based on electrical engineering principles and real-world circuit design rules

export interface ConnectionRule {
	componentType: string;
	handles: {
		[id: string]: {
			type: 'input' | 'output' | 'bidirectional' | 'power' | 'ground';
			allowedConnections: string[];
			description: string;
			voltage?: 'high' | 'low' | 'signal' | 'power' | 'ground';
			current?: 'high' | 'low' | 'signal';
		};
	};
}

export interface ConnectionValidationResult {
	valid: boolean;
	error?: string;
	warning?: string;
	connectionType?: 'signal' | 'power' | 'ground' | 'bidirectional';
}

// Define realistic connection rules for each component type
export const connectionRules: Record<string, ConnectionRule> = {
	resistor: {
		componentType: 'resistor',
		handles: {
			'left': {
				type: 'bidirectional',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Resistor terminal 1 - can connect to any component',
				voltage: 'signal',
				current: 'signal'
			},
			'right': {
				type: 'bidirectional',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Resistor terminal 2 - can connect to any component',
				voltage: 'signal',
				current: 'signal'
			}
		}
	},

	capacitor: {
		componentType: 'capacitor',
		handles: {
			'left': {
				type: 'bidirectional',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Capacitor terminal 1 - can connect to any component',
				voltage: 'signal',
				current: 'signal'
			},
			'right': {
				type: 'bidirectional',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Capacitor terminal 2 - can connect to any component',
				voltage: 'signal',
				current: 'signal'
			}
		}
	},

	inductor: {
		componentType: 'inductor',
		handles: {
			'left': {
				type: 'bidirectional',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Inductor terminal 1 - can connect to any component',
				voltage: 'signal',
				current: 'signal'
			},
			'right': {
				type: 'bidirectional',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Inductor terminal 2 - can connect to any component',
				voltage: 'signal',
				current: 'signal'
			}
		}
	},

	voltageSource: {
		componentType: 'voltageSource',
		handles: {
			'left': {
				type: 'output',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Voltage source positive terminal - outputs voltage',
				voltage: 'power',
				current: 'high'
			},
			'right': {
				type: 'output',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Voltage source negative terminal - outputs voltage',
				voltage: 'ground',
				current: 'high'
			}
		}
	},

	currentSource: {
		componentType: 'currentSource',
		handles: {
			'left': {
				type: 'output',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Current source positive terminal - outputs current',
				voltage: 'signal',
				current: 'high'
			},
			'right': {
				type: 'output',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Current source negative terminal - outputs current',
				voltage: 'signal',
				current: 'high'
			}
		}
	},

	ground: {
		componentType: 'ground',
		handles: {
			'center': {
				type: 'ground',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe'],
				description: 'Ground reference - can connect to any component',
				voltage: 'ground',
				current: 'signal'
			}
		}
	},

	diode: {
		componentType: 'diode',
		handles: {
			'left': {
				type: 'input',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Diode anode - input terminal',
				voltage: 'signal',
				current: 'signal'
			},
			'right': {
				type: 'output',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Diode cathode - output terminal',
				voltage: 'signal',
				current: 'signal'
			}
		}
	},

	transistor: {
		componentType: 'transistor',
		handles: {
			'base': {
				type: 'input',
				allowedConnections: ['resistor', 'capacitor', 'voltageSource', 'currentSource', 'transistor', 'opamp', 'voltmeter', 'probe', 'ground'],
				description: 'Transistor base - control input',
				voltage: 'signal',
				current: 'low'
			},
			'collector': {
				type: 'output',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Transistor collector - output terminal',
				voltage: 'signal',
				current: 'high'
			},
			'emitter': {
				type: 'output',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Transistor emitter - output terminal',
				voltage: 'signal',
				current: 'high'
			}
		}
	},

	opamp: {
		componentType: 'opamp',
		handles: {
			'positive': {
				type: 'input',
				allowedConnections: ['resistor', 'capacitor', 'voltageSource', 'currentSource', 'opamp', 'voltmeter', 'probe', 'ground'],
				description: 'Op-amp non-inverting input (+)',
				voltage: 'signal',
				current: 'low'
			},
			'negative': {
				type: 'input',
				allowedConnections: ['resistor', 'capacitor', 'voltageSource', 'currentSource', 'opamp', 'voltmeter', 'probe', 'ground'],
				description: 'Op-amp inverting input (-)',
				voltage: 'signal',
				current: 'low'
			},
			'output': {
				type: 'output',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'probe', 'ground'],
				description: 'Op-amp output',
				voltage: 'signal',
				current: 'high'
			},
			'vcc': {
				type: 'power',
				allowedConnections: ['voltageSource', 'ground'],
				description: 'Op-amp positive power supply',
				voltage: 'power',
				current: 'high'
			},
			'vee': {
				type: 'power',
				allowedConnections: ['voltageSource', 'ground'],
				description: 'Op-amp negative power supply',
				voltage: 'ground',
				current: 'high'
			}
		}
	},

	voltmeter: {
		componentType: 'voltmeter',
		handles: {
			'left': {
				type: 'input',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'ground'],
				description: 'Voltmeter positive probe - measures voltage',
				voltage: 'signal',
				current: 'low'
			},
			'right': {
				type: 'input',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'ground'],
				description: 'Voltmeter negative probe - measures voltage',
				voltage: 'signal',
				current: 'low'
			}
		}
	},

	ammeter: {
		componentType: 'ammeter',
		handles: {
			'left': {
				type: 'bidirectional',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'ground'],
				description: 'Ammeter terminal 1 - measures current',
				voltage: 'signal',
				current: 'signal'
			},
			'right': {
				type: 'bidirectional',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'ground'],
				description: 'Ammeter terminal 2 - measures current',
				voltage: 'signal',
				current: 'signal'
			}
		}
	},

	probe: {
		componentType: 'probe',
		handles: {
			'center': {
				type: 'input',
				allowedConnections: ['resistor', 'capacitor', 'inductor', 'voltageSource', 'currentSource', 'diode', 'transistor', 'opamp', 'voltmeter', 'ammeter', 'ground'],
				description: 'Test probe - measures signal',
				voltage: 'signal',
				current: 'low'
			}
		}
	}
};

// Special connection rules for power and ground
export const powerConnectionRules = {
	// Power connections should only connect to power inputs
	powerToPower: ['vcc', 'vee'],
	// Ground connections should only connect to ground inputs
	groundToGround: ['ground', 'center'],
	// Signal connections can connect to most components
	signalToSignal: ['left', 'right', 'base', 'collector', 'emitter', 'positive', 'negative', 'output']
};

/**
 * Validate a connection between two component handles
 */
export function validateConnection(
	sourceNode: any,
	sourceHandle: string,
	targetNode: any,
	targetHandle: string
): ConnectionValidationResult {
	// Get component types
	const sourceType = sourceNode.type;
	const targetType = targetNode.type;

	// Get connection rules for both components
	const sourceRule = connectionRules[sourceType];
	const targetRule = connectionRules[targetType];

	if (!sourceRule || !targetRule) {
		return {
			valid: false,
			error: `Unknown component type: ${sourceType} or ${targetType}`
		};
	}

	// Get handle rules
	const sourceHandleRule = sourceRule.handles[sourceHandle];
	const targetHandleRule = targetRule.handles[targetHandle];

	if (!sourceHandleRule || !targetHandleRule) {
		return {
			valid: false,
			error: `Invalid handle: ${sourceHandle} or ${targetHandle}`
		};
	}

	// Check if target component type is allowed for source handle
	if (!sourceHandleRule.allowedConnections.includes(targetType)) {
		return {
			valid: false,
			error: `Cannot connect ${sourceType} (${sourceHandle}) to ${targetType} (${targetHandle}). ${sourceHandleRule.description}`
		};
	}

	// Check if source component type is allowed for target handle
	if (!targetHandleRule.allowedConnections.includes(sourceType)) {
		return {
			valid: false,
			error: `Cannot connect ${sourceType} (${sourceHandle}) to ${targetType} (${targetHandle}). ${targetHandleRule.description}`
		};
	}

	// Check for power/ground connection rules
	const sourceVoltage = sourceHandleRule.voltage;
	const targetVoltage = targetHandleRule.voltage;

	// Power connections
	if (sourceVoltage === 'power' && targetVoltage !== 'power' && targetVoltage !== 'ground') {
		return {
			valid: false,
			error: `Power connection (${sourceType}) cannot connect to signal connection (${targetType})`
		};
	}

	if (targetVoltage === 'power' && sourceVoltage !== 'power' && sourceVoltage !== 'ground') {
		return {
			valid: false,
			error: `Signal connection (${sourceType}) cannot connect to power connection (${targetType})`
		};
	}

	// Ground connections
	if (sourceVoltage === 'ground' && targetVoltage === 'power') {
		return {
			valid: false,
			error: `Ground connection cannot connect to power connection`
		};
	}

	if (targetVoltage === 'ground' && sourceVoltage === 'power') {
		return {
			valid: false,
			error: `Power connection cannot connect to ground connection`
		};
	}

	// Check for input/output compatibility
	if (sourceHandleRule.type === 'input' && targetHandleRule.type === 'input') {
		return {
			valid: false,
			error: `Cannot connect two input terminals: ${sourceType} (${sourceHandle}) to ${targetType} (${targetHandle})`
		};
	}

	if (sourceHandleRule.type === 'output' && targetHandleRule.type === 'output') {
		return {
			valid: false,
			error: `Cannot connect two output terminals: ${sourceType} (${sourceHandle}) to ${targetType} (${targetHandle})`
		};
	}

	// Check for current compatibility
	const sourceCurrent = sourceHandleRule.current;
	const targetCurrent = targetHandleRule.current;

	if (sourceCurrent === 'high' && targetCurrent === 'low') {
		return {
			valid: true,
			warning: `High current connection (${sourceType}) connecting to low current connection (${targetType}) - ensure proper current handling`,
			connectionType: 'signal'
		};
	}

	// Determine connection type
	let connectionType: 'signal' | 'power' | 'ground' | 'bidirectional' = 'signal';
	if (sourceVoltage === 'power' || targetVoltage === 'power') {
		connectionType = 'power';
	} else if (sourceVoltage === 'ground' || targetVoltage === 'ground') {
		connectionType = 'ground';
	} else if (sourceHandleRule.type === 'bidirectional' || targetHandleRule.type === 'bidirectional') {
		connectionType = 'bidirectional';
	}

	return {
		valid: true,
		connectionType
	};
}

/**
 * Get connection suggestions for a component handle
 */
export function getConnectionSuggestions(componentType: string, handleId: string): string[] {
	const rule = connectionRules[componentType];
	if (!rule || !rule.handles[handleId]) {
		return [];
	}

	return rule.handles[handleId].allowedConnections;
}

/**
 * Check if a connection would create a short circuit
 */
export function checkForShortCircuit(
	nodes: any[],
	edges: any[],
	sourceNode: any,
	sourceHandle: string,
	targetNode: any,
	targetHandle: string
): boolean {
	// Check if connecting to ground would create a short circuit
	if (targetNode.type === 'ground' || sourceNode.type === 'ground') {
		// Check if the other component is already connected to ground
		const existingGroundConnections = edges.filter(edge => 
			(edge.source === sourceNode.id || edge.target === sourceNode.id) &&
			(edge.source === targetNode.id || edge.target === targetNode.id)
		);

		if (existingGroundConnections.length > 0) {
			return true; // Short circuit detected
		}
	}

	// Check for power supply short circuits
	if (sourceNode.type === 'voltageSource' || targetNode.type === 'voltageSource') {
		const voltageSource = sourceNode.type === 'voltageSource' ? sourceNode : targetNode;
		const otherNode = sourceNode.type === 'voltageSource' ? targetNode : sourceNode;

		// Check if the other node is already connected to the same voltage source
		const existingConnections = edges.filter(edge => 
			(edge.source === voltageSource.id || edge.target === voltageSource.id) &&
			(edge.source === otherNode.id || edge.target === otherNode.id)
		);

		if (existingConnections.length > 0) {
			return true; // Short circuit detected
		}
	}

	return false;
}

/**
 * Validate a complete circuit for common electrical issues
 */
export function validateCircuit(nodes: any[], edges: any[]): {
	valid: boolean;
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check for floating components (no connections)
	const connectedNodes = new Set();
	edges.forEach(edge => {
		connectedNodes.add(edge.source);
		connectedNodes.add(edge.target);
	});

	nodes.forEach(node => {
		if (!connectedNodes.has(node.id)) {
			warnings.push(`Component ${node.id} (${node.type}) has no connections`);
		}
	});

	// Check for ground connections
	const hasGround = nodes.some(node => node.type === 'ground');
	if (!hasGround) {
		warnings.push('Circuit has no ground reference');
	}

	// Check for voltage sources
	const voltageSources = nodes.filter(node => node.type === 'voltageSource');
	if (voltageSources.length === 0) {
		warnings.push('Circuit has no voltage sources');
	}

	// Check for measurement components without connections
	const measurementComponents = nodes.filter(node => 
		['voltmeter', 'ammeter', 'probe'].includes(node.type)
	);

	measurementComponents.forEach(component => {
		const componentConnections = edges.filter(edge => 
			edge.source === component.id || edge.target === component.id
		);
		if (componentConnections.length === 0) {
			errors.push(`Measurement component ${component.id} (${component.type}) must be connected to measure`);
		}
	});

	// Check for op-amp power connections
	const opamps = nodes.filter(node => node.type === 'opamp');
	opamps.forEach(opamp => {
		const opampConnections = edges.filter(edge => 
			edge.source === opamp.id || edge.target === opamp.id
		);
		const hasVcc = opampConnections.some(edge => edge.sourceHandle === 'vcc' || edge.targetHandle === 'vcc');
		const hasVee = opampConnections.some(edge => edge.sourceHandle === 'vee' || edge.targetHandle === 'vee');
		
		if (!hasVcc) {
			warnings.push(`Op-amp ${opamp.id} missing VCC power connection`);
		}
		if (!hasVee) {
			warnings.push(`Op-amp ${opamp.id} missing VEE power connection`);
		}
	});

	return {
		valid: errors.length === 0,
		errors,
		warnings
	};
} 