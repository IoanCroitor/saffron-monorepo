
export interface ParsedNetlist {
	title: string;
	components: Component[];
	analyses: Analysis[];
	parameters: Parameter[];
	models: Model[];
	subcircuits: Subcircuit[];
}

export interface Component {
	name: string;
	type: string;
	nodes: string[];
	value?: string;
	model?: string;
	parameters?: { [key: string]: string };
}

export interface Analysis {
	type: string;
	parameters: { [key: string]: string };
}

export interface Parameter {
	name: string;
	value: string;
}

export interface Model {
	name: string;
	type: string;
	parameters: { [key: string]: string };
}

export interface Subcircuit {
	name: string;
	nodes: string[];
	components: Component[];
}

/**
 * Parse a SPICE netlist into structured data
 */
export function parseNetlist(netlist: string): ParsedNetlist {
	const lines = netlist.split('\n').map(line => line.trim()).filter(line => line.length > 0);
	
	const result: ParsedNetlist = {
		title: '',
		components: [],
		analyses: [],
		parameters: [],
		models: [],
		subcircuits: []
	};

	let currentSubcircuit: Subcircuit | null = null;
	let continuationLine = '';

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];

		// Skip comments
		if (line.startsWith('*') || line.startsWith('#')) {
			continue;
		}

		// Handle line continuation
		if (line.startsWith('+')) {
			continuationLine += ' ' + line.substring(1).trim();
			continue;
		}

		// Process previous continuation line if any
		if (continuationLine) {
			line = continuationLine + ' ' + line;
			continuationLine = '';
		}

		// Check if line continues
		if (line.endsWith('+')) {
			continuationLine = line.substring(0, line.length - 1).trim();
			continue;
		}

		// First non-comment line is the title
		if (i === 0 || (result.title === '' && !line.startsWith('.'))) {
			result.title = line;
			continue;
		}

		// Parse different types of statements
		if (line.startsWith('.')) {
			parseDirective(line, result, currentSubcircuit);
		} else if (currentSubcircuit) {
			// Component inside subcircuit
			const component = parseComponent(line);
			if (component) {
				currentSubcircuit.components.push(component);
			}
		} else {
			// Top-level component
			const component = parseComponent(line);
			if (component) {
				result.components.push(component);
			}
		}
	}

	return result;
}

function parseDirective(line: string, result: ParsedNetlist, currentSubcircuit: Subcircuit | null): void {
	const parts = line.split(/\s+/);
	const directive = parts[0].toLowerCase();

	switch (directive) {
		case '.ac':
		case '.dc':
		case '.tran':
		case '.op':
		case '.tf':
			parseAnalysis(line, result);
			break;
		case '.param':
			parseParameter(line, result);
			break;
		case '.model':
			parseModel(line, result);
			break;
		case '.subckt':
			// Start subcircuit definition
			const subckt = parseSubcircuitStart(line);
			if (subckt) {
				result.subcircuits.push(subckt);
			}
			break;
		case '.ends':
			// End subcircuit definition
			currentSubcircuit = null;
			break;
		case '.include':
		case '.lib':
			// Handle include/library statements
			break;
		case '.end':
			// End of netlist
			break;
	}
}

function parseAnalysis(line: string, result: ParsedNetlist): void {
	const parts = line.split(/\s+/);
	const type = parts[0].substring(1).toLowerCase(); // Remove the '.'

	const analysis: Analysis = {
		type,
		parameters: {}
	};

	// Parse analysis-specific parameters
	switch (type) {
		case 'ac':
			// .AC DEC|OCT|LIN NP FSTART FSTOP
			if (parts.length >= 5) {
				analysis.parameters.sweep = parts[1];
				analysis.parameters.points = parts[2];
				analysis.parameters.start = parts[3];
				analysis.parameters.stop = parts[4];
			}
			break;
		case 'dc':
			// .DC SRC1NAME VSTART1 VSTOP1 VINCR1 [SRC2NAME VSTART2 VSTOP2 VINCR2]
			if (parts.length >= 5) {
				analysis.parameters.source = parts[1];
				analysis.parameters.start = parts[2];
				analysis.parameters.stop = parts[3];
				analysis.parameters.step = parts[4];
			}
			if (parts.length >= 9) {
				analysis.parameters.source2 = parts[5];
				analysis.parameters.start2 = parts[6];
				analysis.parameters.stop2 = parts[7];
				analysis.parameters.step2 = parts[8];
			}
			break;
		case 'tran':
			// .TRAN TSTEP TSTOP [TSTART [TMAX]] [UIC]
			if (parts.length >= 3) {
				analysis.parameters.step = parts[1];
				analysis.parameters.stop = parts[2];
			}
			if (parts.length >= 4) {
				analysis.parameters.start = parts[3];
			}
			break;
	}

	result.analyses.push(analysis);
}

function parseParameter(line: string, result: ParsedNetlist): void {
	// .PARAM name=value [name=value ...]
	const parts = line.split(/\s+/).slice(1); // Remove .PARAM

	for (const part of parts) {
		const equalIndex = part.indexOf('=');
		if (equalIndex > 0) {
			const name = part.substring(0, equalIndex).trim();
			const value = part.substring(equalIndex + 1).trim();
			result.parameters.push({ name, value });
		}
	}
}

function parseModel(line: string, result: ParsedNetlist): void {
	// .MODEL name type [(param=value ...)]
	const parts = line.split(/\s+/);
	
	if (parts.length >= 3) {
		const model: Model = {
			name: parts[1],
			type: parts[2],
			parameters: {}
		};

		// Parse parameters in parentheses
		const paramStart = line.indexOf('(');
		const paramEnd = line.lastIndexOf(')');
		
		if (paramStart > 0 && paramEnd > paramStart) {
			const paramString = line.substring(paramStart + 1, paramEnd);
			const paramPairs = paramString.split(/\s+/);
			
			for (const pair of paramPairs) {
				const equalIndex = pair.indexOf('=');
				if (equalIndex > 0) {
					const name = pair.substring(0, equalIndex).trim();
					const value = pair.substring(equalIndex + 1).trim();
					model.parameters[name] = value;
				}
			}
		}

		result.models.push(model);
	}
}

function parseSubcircuitStart(line: string): Subcircuit | null {
	// .SUBCKT name node1 node2 ...
	const parts = line.split(/\s+/).slice(1); // Remove .SUBCKT
	
	if (parts.length >= 2) {
		return {
			name: parts[0],
			nodes: parts.slice(1),
			components: []
		};
	}
	
	return null;
}

function parseComponent(line: string): Component | null {
	const parts = line.split(/\s+/);
	
	if (parts.length < 3) {
		return null;
	}

	const name = parts[0];
	const type = getComponentType(name);
	
	const component: Component = {
		name,
		type,
		nodes: [],
		parameters: {}
	};

	switch (type) {
		case 'resistor':
		case 'capacitor':
		case 'inductor':
			// R/C/L name node1 node2 value
			if (parts.length >= 4) {
				component.nodes = [parts[1], parts[2]];
				component.value = parts[3];
			}
			break;
		case 'voltage_source':
		case 'current_source':
			// V/I name node+ node- value
			if (parts.length >= 4) {
				component.nodes = [parts[1], parts[2]];
				component.value = parts[3];
			}
			// Handle AC/DC/PULSE sources
			if (parts.length > 4) {
				const sourceType = parts[3].toUpperCase();
				if (['AC', 'DC', 'PULSE', 'SIN', 'EXP'].includes(sourceType)) {
					component.parameters!.type = sourceType;
					component.value = parts.slice(4).join(' ');
				}
			}
			break;
		case 'diode':
			// D name anode cathode model
			if (parts.length >= 4) {
				component.nodes = [parts[1], parts[2]];
				component.model = parts[3];
			}
			break;
		case 'bjt':
		case 'mosfet':
			// Q/M name collector base emitter [substrate] model
			if (parts.length >= 5) {
				component.nodes = [parts[1], parts[2], parts[3]];
				if (type === 'mosfet' && parts.length >= 6) {
					component.nodes.push(parts[4]);
					component.model = parts[5];
				} else {
					component.model = parts[4];
				}
			}
			break;
		case 'subcircuit':
			// X name node1 node2 ... subckt_name
			if (parts.length >= 3) {
				component.nodes = parts.slice(1, -1);
				component.model = parts[parts.length - 1];
			}
			break;
	}

	return component;
}

function getComponentType(name: string): string {
	const firstChar = name.charAt(0).toUpperCase();
	
	switch (firstChar) {
		case 'R': return 'resistor';
		case 'C': return 'capacitor';
		case 'L': return 'inductor';
		case 'V': return 'voltage_source';
		case 'I': return 'current_source';
		case 'D': return 'diode';
		case 'Q': return 'bjt';
		case 'M': return 'mosfet';
		case 'X': return 'subcircuit';
		case 'E': return 'vcvs'; // Voltage-controlled voltage source
		case 'F': return 'cccs'; // Current-controlled current source
		case 'G': return 'vccs'; // Voltage-controlled current source
		case 'H': return 'ccvs'; // Current-controlled voltage source
		case 'K': return 'coupling'; // Mutual inductance
		case 'T': return 'transmission_line';
		default: return 'unknown';
	}
}

/**
 * Extract parameter values from netlist
 */
export function extractParameters(netlist: string): { [key: string]: string } {
	const parsed = parseNetlist(netlist);
	const params: { [key: string]: string } = {};
	
	for (const param of parsed.parameters) {
		params[param.name] = param.value;
	}
	
	return params;
}

/**
 * Get all node names from netlist
 */
export function extractNodes(netlist: string): string[] {
	const parsed = parseNetlist(netlist);
	const nodes = new Set<string>();
	
	for (const component of parsed.components) {
		for (const node of component.nodes) {
			nodes.add(node);
		}
	}
	
	return Array.from(nodes).sort();
}

/**
 * Validate netlist for basic syntax errors
 */
export function validateNetlist(netlist: string): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	const lines = netlist.split('\n');
	
	// Check for empty netlist
	if (netlist.trim().length === 0) {
		errors.push('Netlist is empty');
		return { valid: false, errors };
	}
	
	// Check for title line
	const nonCommentLines = lines.filter(line => {
		const trimmed = line.trim();
		return trimmed.length > 0 && !trimmed.startsWith('*') && !trimmed.startsWith('#');
	});
	
	if (nonCommentLines.length === 0) {
		errors.push('No valid statements found');
		return { valid: false, errors };
	}
	
	// Parse and check for basic errors
	try {
		const parsed = parseNetlist(netlist);
		
		// Check for components
		if (parsed.components.length === 0) {
			errors.push('No components found in netlist');
		}
		
		// Check for analysis statements
		if (parsed.analyses.length === 0) {
			errors.push('No analysis statements found (.DC, .AC, .TRAN, etc.)');
		}
		
		// Check for ground node
		const nodes = extractNodes(netlist);
		if (!nodes.includes('0') && !nodes.includes('gnd') && !nodes.includes('ground')) {
			errors.push('No ground node (0, gnd, or ground) found');
		}
		
	} catch (error) {
		errors.push(`Parse error: ${error}`);
	}
	
	return { valid: errors.length === 0, errors };
}