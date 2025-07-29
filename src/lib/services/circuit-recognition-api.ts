export interface CircuitRecognitionResponse {
	circuit: {
		version: string;
		sheet: {
			number: number;
			width: number;
			height: number;
		};
		components: Array<{
			id: string;
			type: string;
			x: number;
			y: number;
			rotation: string;
			attributes: Record<string, any>;
		}>;
		wires: Array<{
			x1: number;
			y1: number;
			x2: number;
			y2: number;
		}>;
		flags: any[];
	};
	processing_time?: number;
}

export interface AscToJsonResponse {
	version: string;
	sheet: {
		number: number;
		width: number;
		height: number;
	};
	components: Array<{
		id: string;
		type: string;
		x: number;
		y: number;
		rotation: string;
		attributes: Record<string, any>;
	}>;
	wires: Array<{
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	}>;
	flags: any[];
}

export class CircuitRecognitionAPI {
	private baseUrl: string;
	private apiKey: string;

	constructor(baseUrl: string = 'http://localhost:8000/api/v1', apiKey: string = 'test-key-123') {
		this.baseUrl = baseUrl;
		this.apiKey = apiKey;
	}

	private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
		const url = `${this.baseUrl}${endpoint}`;
		const headers = {
			'X-API-Key': this.apiKey,
			...options.headers
		};

		const response = await fetch(url, {
			...options,
			headers
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.detail || `API Error: ${response.status} - ${response.statusText}`);
		}

		return response;
	}

	async healthCheck(): Promise<{ status: string }> {
		const response = await this.makeRequest('/health');
		return await response.json();
	}

	async recognizeCircuit(file: File, outputFormat: 'asc' | 'json' = 'json'): Promise<string | CircuitRecognitionResponse> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('output_format', outputFormat);

		const response = await this.makeRequest('/recognize-circuit', {
			method: 'POST',
			body: formData
		});

		if (outputFormat === 'asc') {
			const data = await response.json();
			return data.content;
		} else {
			return await response.json();
		}
	}

	async recognizeCircuitWithParsing(file: File): Promise<CircuitRecognitionResponse> {
		const formData = new FormData();
		formData.append('file', file);

		const response = await this.makeRequest('/recognize-circuit/parse', {
			method: 'POST',
			body: formData
		});

		return await response.json();
	}

	async convertAscToJson(file: File): Promise<AscToJsonResponse> {
		const formData = new FormData();
		formData.append('file', file);

		const response = await this.makeRequest('/asc-to-json/convert', {
			method: 'POST',
			body: formData
		});

		return await response.json();
	}

	async parseAscFile(file: File): Promise<AscToJsonResponse> {
		const formData = new FormData();
		formData.append('file', file);

		const response = await this.makeRequest('/asc-to-json/parse', {
			method: 'POST',
			body: formData
		});

		return await response.json();
	}

	async getAnnotatedImage(file: File): Promise<Blob> {
		const formData = new FormData();
		formData.append('file', file);

		const response = await this.makeRequest('/recognize-circuit/annotated-image', {
			method: 'POST',
			body: formData
		});

		return await response.blob();
	}

	// Helper method to convert circuit recognition result to SPICE netlist
	convertToSpiceNetlist(circuitData: CircuitRecognitionResponse): string {
		const { circuit } = circuitData;
		let spiceNetlist = `* Circuit generated from image recognition\n`;
		spiceNetlist += `* Version: ${circuit.version}\n`;
		spiceNetlist += `* Sheet: ${circuit.sheet.number} (${circuit.sheet.width}x${circuit.sheet.height})\n\n`;

		// Add components
		circuit.components.forEach(comp => {
			const compType = comp.type.toLowerCase();
			const compName = comp.attributes.name || comp.id;
			
			switch (compType) {
				case 'res':
				case 'resistor':
					spiceNetlist += `R${compName} ${comp.id}_A ${comp.id}_B ${comp.attributes.resistance || '1k'}\n`;
					break;
				case 'cap':
				case 'capacitor':
					spiceNetlist += `C${compName} ${comp.id}_A ${comp.id}_B ${comp.attributes.capacitance || '1u'}\n`;
					break;
				case 'ind':
				case 'inductor':
					spiceNetlist += `L${compName} ${comp.id}_A ${comp.id}_B ${comp.attributes.inductance || '1m'}\n`;
					break;
				case 'voltage':
				case 'vsrc':
					spiceNetlist += `V${compName} ${comp.id}_POS ${comp.id}_NEG ${comp.attributes.voltage || '5V'}\n`;
					break;
				case 'current':
				case 'isrc':
					spiceNetlist += `I${compName} ${comp.id}_POS ${comp.id}_NEG ${comp.attributes.current || '1A'}\n`;
					break;
				case 'diode':
					spiceNetlist += `D${compName} ${comp.id}_A ${comp.id}_K ${comp.attributes.type || '1N4148'}\n`;
					break;
				case 'transistor':
				case 'bjt':
					spiceNetlist += `Q${compName} ${comp.id}_C ${comp.id}_B ${comp.id}_E ${comp.attributes.type || '2N3904'}\n`;
					break;
				default:
					spiceNetlist += `* Unknown component: ${comp.id} (${comp.type})\n`;
			}
		});

		// Add wires as connections
		spiceNetlist += `\n* Wire connections\n`;
		circuit.wires.forEach((wire, index) => {
			spiceNetlist += `* Wire ${index + 1}: (${wire.x1},${wire.y1}) to (${wire.x2},${wire.y2})\n`;
		});

		// Add analysis commands
		spiceNetlist += `\n* Analysis commands\n`;
		spiceNetlist += `.op\n`;
		spiceNetlist += `.end\n`;

		return spiceNetlist;
	}

	// Helper method to download ASC file
	downloadAscFile(ascContent: string, filename: string = 'circuit.asc'): void {
		const blob = new Blob([ascContent], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
}

// Export a default instance
export const circuitRecognitionAPI = new CircuitRecognitionAPI(); 