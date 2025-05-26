<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Node } from '@xyflow/svelte';

	export let node: Node;

	const dispatch = createEventDispatcher();

	// Local copy of node data for editing
	let editData = { ...node.data };

	function handleSave() {
		dispatch('update', editData);
		dispatch('close');
	}

	function handleCancel() {
		dispatch('close');
	}

	function handleRotate() {
		const currentRotation = editData.rotation || 0;
		editData.rotation = (currentRotation + 90) % 360;
		dispatch('update', { rotation: editData.rotation });
	}

	// Property field definitions based on component type
	function getPropertyFields(componentType: string) {
		const baseFields = [
			{ key: 'name', label: 'Name', type: 'text' },
			{ key: 'componentType', label: 'Component Type', type: 'text', readonly: true }
		];

		switch (componentType) {
			case 'resistor':
				return [
					...baseFields,
					{ key: 'value', label: 'Resistance', type: 'text', placeholder: 'e.g., 10k, 1M' },
					{ key: 'tolerance', label: 'Tolerance', type: 'select', options: ['1%', '5%', '10%', '20%'] },
					{ key: 'power', label: 'Power Rating', type: 'text', placeholder: 'e.g., 0.25W, 1W' },
					{ key: 'orientation', label: 'Orientation', type: 'select', options: ['horizontal', 'vertical'] }
				];

			case 'capacitor':
				return [
					...baseFields,
					{ key: 'value', label: 'Capacitance', type: 'text', placeholder: 'e.g., 100nF, 10µF' },
					{ key: 'voltage', label: 'Voltage Rating', type: 'text', placeholder: 'e.g., 25V, 50V' },
					{ key: 'type', label: 'Type', type: 'select', options: ['ceramic', 'electrolytic', 'tantalum', 'film'] },
					{ key: 'orientation', label: 'Orientation', type: 'select', options: ['horizontal', 'vertical'] }
				];

			case 'transistor':
				return [
					...baseFields,
					{ key: 'model', label: 'Model', type: 'text', placeholder: 'e.g., 2N2222, BC547' },
					{ key: 'transistorType', label: 'Type', type: 'select', options: ['npn', 'pnp', 'nmos', 'pmos'] },
					{ key: 'beta', label: 'Beta (hFE)', type: 'text', placeholder: 'e.g., 100, 200' },
					{ key: 'vceo', label: 'VCEO', type: 'text', placeholder: 'e.g., 40V' },
					{ key: 'ic', label: 'IC Max', type: 'text', placeholder: 'e.g., 800mA' }
				];

			case 'power':
				return [
					...baseFields,
					{ key: 'voltage', label: 'Voltage', type: 'text', placeholder: 'e.g., 5V, 3.3V' },
					{ key: 'powerType', label: 'Power Type', type: 'select', options: ['vcc', 'vdd', 'vss'] },
					{ key: 'current', label: 'Max Current', type: 'text', placeholder: 'e.g., 1A, 500mA' }
				];

			case 'ground':
				return [
					...baseFields,
					{ key: 'groundType', label: 'Ground Type', type: 'select', options: ['gnd', 'dgnd', 'agnd'] }
				];

			case 'diode':
				return [
					...baseFields,
					{ key: 'model', label: 'Model', type: 'text', placeholder: 'e.g., 1N4148, 1N4007' },
					{ key: 'forwardVoltage', label: 'Forward Voltage', type: 'text', placeholder: 'e.g., 0.7V' },
					{ key: 'current', label: 'Max Current', type: 'text', placeholder: 'e.g., 200mA' },
					{ key: 'orientation', label: 'Orientation', type: 'select', options: ['horizontal', 'vertical'] }
				];

			case 'inductor':
				return [
					...baseFields,
					{ key: 'value', label: 'Inductance', type: 'text', placeholder: 'e.g., 10µH, 1mH' },
					{ key: 'current', label: 'Max Current', type: 'text', placeholder: 'e.g., 1A, 500mA' },
					{ key: 'dcr', label: 'DC Resistance', type: 'text', placeholder: 'e.g., 0.1Ω' },
					{ key: 'orientation', label: 'Orientation', type: 'select', options: ['horizontal', 'vertical'] }
				];

			case 'ic':
				return [
					...baseFields,
					{ key: 'model', label: 'Model', type: 'text', placeholder: 'e.g., 74HC00, LM358' },
					{ key: 'pinCount', label: 'Pin Count', type: 'number', min: 4, max: 64 },
					{ key: 'package', label: 'Package', type: 'select', options: ['DIP', 'SOIC', 'QFP', 'BGA'] },
					{ key: 'description', label: 'Description', type: 'textarea', placeholder: 'Function description...' }
				];

			default:
				return baseFields;
		}
	}

	$: propertyFields = getPropertyFields(node.type);
</script>

<div class="property-editor">
	<div class="editor-header">
		<h3>Properties - {node.data.name || node.id}</h3>
		<div class="header-actions">
			<button 
				class="icon-btn" 
				on:click={handleRotate}
				title="Rotate 90°"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M1 4v6h6M23 20v-6h-6"/>
					<path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
				</svg>
			</button>
			<button 
				class="icon-btn" 
				on:click={handleCancel}
				title="Close"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>

	<div class="editor-content">
		<div class="property-section">
			<h4>Basic Properties</h4>
			{#each propertyFields as field}
				<div class="property-field">
					<label for={field.key}>{field.label}:</label>
					
					{#if field.type === 'text'}
						<input
							id={field.key}
							type="text"
							bind:value={editData[field.key]}
							placeholder={field.placeholder || ''}
							readonly={field.readonly || false}
						/>
					{:else if field.type === 'number'}
						<input
							id={field.key}
							type="number"
							bind:value={editData[field.key]}
							min={field.min || 0}
							max={field.max || 1000}
						/>
					{:else if field.type === 'select'}
						<select id={field.key} bind:value={editData[field.key]}>
							{#each field.options as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
					{:else if field.type === 'textarea'}
						<textarea
							id={field.key}
							bind:value={editData[field.key]}
							placeholder={field.placeholder || ''}
							rows="3"
						></textarea>
					{/if}
				</div>
			{/each}
		</div>

		<div class="property-section">
			<h4>Position & Rotation</h4>
			<div class="property-field">
				<label for="rotation">Rotation:</label>
				<select id="rotation" bind:value={editData.rotation}>
					<option value={0}>0°</option>
					<option value={90}>90°</option>
					<option value={180}>180°</option>
					<option value={270}>270°</option>
				</select>
			</div>
		</div>

		{#if node.type !== 'power' && node.type !== 'ground'}
			<div class="property-section">
				<h4>Connection Points</h4>
				<div class="connection-info">
					{#if node.data.connectionPoints}
						{#each Object.entries(node.data.connectionPoints) as [pin, nets]}
							<div class="connection-item">
								<span class="pin-name">{pin}:</span>
								<span class="net-list">{nets.length > 0 ? nets.join(', ') : 'Not connected'}</span>
							</div>
						{/each}
					{:else}
						<div class="no-connections">No connections defined</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<div class="editor-footer">
		<button class="btn btn-secondary" on:click={handleCancel}>
			Cancel
		</button>
		<button class="btn btn-primary" on:click={handleSave}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
				<polyline points="17,21 17,13 7,13 7,21"/>
				<polyline points="7,3 7,8 15,8"/>
			</svg>
			Apply Changes
		</button>
	</div>
</div>

<style>
	.property-editor {
		position: absolute;
		right: 1rem;
		top: 1rem;
		width: 320px;
		background: #2a2a2a;
		border: 1px solid #404040;
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
		z-index: 1000;
		max-height: calc(100vh - 2rem);
		display: flex;
		flex-direction: column;
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #404040;
		background: #333333;
		border-radius: 0.5rem 0.5rem 0 0;
	}

	.editor-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
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

	.editor-content {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}

	.property-section {
		margin-bottom: 1.5rem;
	}

	.property-section:last-child {
		margin-bottom: 0;
	}

	.property-section h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #cccccc;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.property-field {
		margin-bottom: 0.75rem;
	}

	.property-field:last-child {
		margin-bottom: 0;
	}

	.property-field label {
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
		color: #cccccc;
		font-weight: 500;
	}

	.property-field input,
	.property-field select,
	.property-field textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #505050;
		background: #404040;
		color: #ffffff;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.property-field input:focus,
	.property-field select:focus,
	.property-field textarea:focus {
		outline: none;
		border-color: #0080ff;
		box-shadow: 0 0 0 2px rgba(0, 128, 255, 0.2);
	}

	.property-field input[readonly] {
		background: #333333;
		color: #888888;
		cursor: not-allowed;
	}

	.property-field textarea {
		resize: vertical;
		min-height: 60px;
	}

	.connection-info {
		background: #1a1a1a;
		border: 1px solid #404040;
		border-radius: 0.25rem;
		padding: 0.75rem;
	}

	.connection-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
	}

	.connection-item:last-child {
		margin-bottom: 0;
	}

	.pin-name {
		font-weight: 600;
		color: #ffffff;
	}

	.net-list {
		color: #cccccc;
	}

	.no-connections {
		font-size: 0.75rem;
		color: #888888;
		font-style: italic;
	}

	.editor-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem;
		border-top: 1px solid #404040;
		background: #1a1a1a;
		border-radius: 0 0 0.5rem 0.5rem;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.25rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
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

	/* Scrollbar styling */
	.editor-content::-webkit-scrollbar {
		width: 6px;
	}

	.editor-content::-webkit-scrollbar-track {
		background: #1a1a1a;
	}

	.editor-content::-webkit-scrollbar-thumb {
		background: #404040;
		border-radius: 3px;
	}

	.editor-content::-webkit-scrollbar-thumb:hover {
		background: #505050;
	}
</style>
