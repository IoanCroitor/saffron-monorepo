<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	import type { Writable } from 'svelte/store';

	export let nodes: Writable<Node[]>;
	export let edges: Writable<Edge[]>;

	const dispatch = createEventDispatcher();

	let nodeList: Node[] = [];
	let edgeList: Edge[] = [];
	let exportedJson = '';
	let showPreview = false;
	let copySuccess = false;

	// Subscribe to store updates
	nodes.subscribe(value => nodeList = value);
	edges.subscribe(value => edgeList = value);

	// Generate the circuit JSON export
	function generateCircuitJSON() {
		const moduleName = 'circuit_module';
		
		// Extract module ports (external connections)
		const modulePorts = extractModulePorts(nodeList);
		
		// Transform nodes to cells with connections
		const cells = transformNodesToCells(nodeList, edgeList);
		
		const circuit = {
			modules: {
				[moduleName]: {
					ports: modulePorts,
					cells: cells
				}
			}
		};
		
		return JSON.stringify(circuit, null, 2);
	}

	function extractModulePorts(nodes: Node[]) {
		const ports: Record<string, any> = {};
		
		nodes.forEach(node => {
			// Add power and ground as module ports
			if (node.type === 'power' || node.type === 'ground') {
				ports[node.data.name || node.id] = {
					direction: node.type === 'power' ? 'input' : 'output',
					bits: [0]
				};
			}
		});
		
		return ports;
	}

	function transformNodesToCells(nodes: Node[], edges: Edge[]) {
		const cells: Record<string, any> = {};
		
		nodes.forEach(node => {
			const cellId = node.data.name || node.id;
			const connections = getNodeConnections(node.id, edges);
			
			const cell: any = {
				type: node.data.componentType || node.type,
				connections: connections
			};

			// Add attributes based on component type
			const attributes: Record<string, any> = {};
			
			switch (node.type) {
				case 'resistor':
					if (node.data.value) attributes.value = node.data.value;
					if (node.data.tolerance) attributes.tolerance = node.data.tolerance;
					if (node.data.power) attributes.power = node.data.power;
					break;
					
				case 'capacitor':
					if (node.data.value) attributes.value = node.data.value;
					if (node.data.voltage) attributes.voltage = node.data.voltage;
					if (node.data.type) attributes.type = node.data.type;
					break;
					
				case 'transistor':
					if (node.data.model) attributes.model = node.data.model;
					if (node.data.transistorType) attributes.transistorType = node.data.transistorType;
					if (node.data.beta) attributes.beta = node.data.beta;
					break;
					
				case 'power':
					if (node.data.voltage) attributes.voltage = node.data.voltage;
					if (node.data.powerType) attributes.powerType = node.data.powerType;
					break;
					
				case 'ground':
					if (node.data.groundType) attributes.groundType = node.data.groundType;
					break;
					
				case 'diode':
					if (node.data.model) attributes.model = node.data.model;
					if (node.data.forwardVoltage) attributes.forwardVoltage = node.data.forwardVoltage;
					break;
					
				case 'inductor':
					if (node.data.value) attributes.value = node.data.value;
					if (node.data.current) attributes.current = node.data.current;
					if (node.data.dcr) attributes.dcr = node.data.dcr;
					break;
					
				case 'ic':
					if (node.data.model) attributes.model = node.data.model;
					if (node.data.pinCount) attributes.pinCount = node.data.pinCount;
					if (node.data.package) attributes.package = node.data.package;
					break;
			}
			
			if (Object.keys(attributes).length > 0) {
				cell.attributes = attributes;
			}

			// Add port directions for ICs and transistors
			if (node.type === 'transistor') {
				cell.port_directions = getTransistorPortDirections(node.data.transistorType);
			} else if (node.type === 'ic') {
				cell.port_directions = getICPortDirections(node.data.pinCount || 8);
			}

			cells[cellId] = cell;
		});
		
		return cells;
	}

	function getNodeConnections(nodeId: string, edges: Edge[]) {
		const connections: Record<string, string[]> = {};
		
		// Group edges by port/handle
		edges.forEach(edge => {
			if (edge.source === nodeId) {
				const port = edge.sourceHandle || 'A';
				const netId = getNetId(edge);
				if (!connections[port]) connections[port] = [];
				connections[port].push(netId);
			}
			if (edge.target === nodeId) {
				const port = edge.targetHandle || 'A';
				const netId = getNetId(edge);
				if (!connections[port]) connections[port] = [];
				connections[port].push(netId);
			}
		});
		
		return connections;
	}

	function getNetId(edge: Edge): string {
		// Use edge ID as net ID, or generate one
		return edge.id || `net_${edge.source}_${edge.target}`;
	}

	function getTransistorPortDirections(transistorType: string) {
		switch (transistorType) {
			case 'npn':
			case 'pnp':
				return {
					B: 'input',   // Base
					C: 'output',  // Collector
					E: 'output'   // Emitter
				};
			case 'nmos':
			case 'pmos':
				return {
					G: 'input',   // Gate
					D: 'output',  // Drain
					S: 'output'   // Source
				};
			default:
				return {};
		}
	}

	function getICPortDirections(pinCount: number) {
		const directions: Record<string, string> = {};
		for (let i = 1; i <= pinCount; i++) {
			// Assume first half are inputs, second half are outputs
			directions[`pin${i}`] = i <= pinCount / 2 ? 'input' : 'output';
		}
		return directions;
	}

	function handleExport() {
		exportedJson = generateCircuitJSON();
		showPreview = true;
	}

	function handleDownload() {
		const blob = new Blob([exportedJson], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'circuit.json';
		link.click();
		URL.revokeObjectURL(url);
	}

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(exportedJson);
			copySuccess = true;
			setTimeout(() => copySuccess = false, 2000);
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		}
	}

	function handleClose() {
		dispatch('close');
	}

	// Generate export on component mount
	handleExport();
</script>

<div class="exporter-overlay">
	<div class="exporter-modal">
		<div class="modal-header">
			<h3>Export Circuit JSON</h3>
			<button class="icon-btn" on:click={handleClose}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="modal-content">
			<div class="export-stats">
				<div class="stat-item">
					<strong>{nodeList.length}</strong>
					<span>Components</span>
				</div>
				<div class="stat-item">
					<strong>{edgeList.length}</strong>
					<span>Connections</span>
				</div>
				<div class="stat-item">
					<strong>{new Set(edgeList.map(e => getNetId(e))).size}</strong>
					<span>Nets</span>
				</div>
			</div>

			{#if showPreview}
				<div class="json-preview">
					<div class="preview-header">					<h4>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
						JSON Preview
					</h4>
						<div class="preview-actions">
							<button 
								class="btn btn-sm" 
								class:btn-success={copySuccess}
								on:click={handleCopy}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
									<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
								</svg>
								{copySuccess ? 'Copied!' : 'Copy'}
							</button>
						</div>
					</div>
					<pre class="json-content">{exportedJson}</pre>
				</div>
			{/if}

			<div class="component-summary">
				<h4>Component Summary</h4>
				<div class="component-list">
					{#each nodeList as node}
						<div class="component-item">
							<div class="component-info">
								<span class="component-name">{node.data.name || node.id}</span>
								<span class="component-type">{node.data.componentType || node.type}</span>
							</div>
							{#if node.data.value}
								<span class="component-value">{node.data.value}</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-secondary" on:click={handleClose}>
				Cancel
			</button>
			<button class="btn btn-primary" on:click={handleDownload}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
				</svg>
				Download JSON
			</button>
		</div>
	</div>
</div>

<style>
	.exporter-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.exporter-modal {
		background: #2a2a2a;
		border: 1px solid #404040;
		border-radius: 0.5rem;
		width: 90%;
		max-width: 800px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #404040;
		background: #333333;
		border-radius: 0.5rem 0.5rem 0 0;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #ffffff;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: none;
		background: #404040;
		color: #ffffff;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.icon-btn:hover {
		background: #505050;
	}

	.modal-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.export-stats {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #1a1a1a;
		border: 1px solid #404040;
		border-radius: 0.375rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.stat-item strong {
		font-size: 1.5rem;
		font-weight: 700;
		color: #0080ff;
	}

	.stat-item span {
		font-size: 0.875rem;
		color: #cccccc;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.json-preview {
		margin-bottom: 1.5rem;
		border: 1px solid #404040;
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #333333;
		border-bottom: 1px solid #404040;
	}

	.preview-header h4 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #ffffff;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.preview-actions {
		display: flex;
		gap: 0.5rem;
	}

	.json-content {
		background: #1a1a1a;
		color: #ffffff;
		padding: 1rem;
		margin: 0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.75rem;
		line-height: 1.4;
		overflow-x: auto;
		max-height: 300px;
		overflow-y: auto;
	}

	.component-summary {
		background: #1a1a1a;
		border: 1px solid #404040;
		border-radius: 0.375rem;
		padding: 1rem;
	}

	.component-summary h4 {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #ffffff;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.component-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 200px;
		overflow-y: auto;
	}

	.component-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: #2a2a2a;
		border: 1px solid #404040;
		border-radius: 0.25rem;
	}

	.component-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.component-name {
		font-weight: 600;
		color: #ffffff;
		font-size: 0.875rem;
	}

	.component-type {
		font-size: 0.75rem;
		color: #888888;
		font-family: monospace;
	}

	.component-value {
		font-size: 0.875rem;
		color: #0080ff;
		font-weight: 500;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid #404040;
		background: #1a1a1a;
		border-radius: 0 0 0.5rem 0.5rem;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
	}

	.btn-primary {
		background: #0080ff;
		color: white;
	}

	.btn-primary:hover {
		background: #0066cc;
	}

	.btn-secondary {
		background: #404040;
		color: white;
	}

	.btn-secondary:hover {
		background: #505050;
	}

	.btn-success {
		background: #00aa00;
		color: white;
	}

	/* Scrollbar styling */
	.modal-content::-webkit-scrollbar,
	.json-content::-webkit-scrollbar,
	.component-list::-webkit-scrollbar {
		width: 6px;
	}

	.modal-content::-webkit-scrollbar-track,
	.json-content::-webkit-scrollbar-track,
	.component-list::-webkit-scrollbar-track {
		background: #1a1a1a;
	}

	.modal-content::-webkit-scrollbar-thumb,
	.json-content::-webkit-scrollbar-thumb,
	.component-list::-webkit-scrollbar-thumb {
		background: #404040;
		border-radius: 3px;
	}

	.modal-content::-webkit-scrollbar-thumb:hover,
	.json-content::-webkit-scrollbar-thumb:hover,
	.component-list::-webkit-scrollbar-thumb:hover {
		background: #505050;
	}
</style>
