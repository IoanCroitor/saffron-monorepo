<!-- SPICE Editor with Custom Syntax Highlighting -->
<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import { browser } from '$app/environment';

	export let value = '';
	export let theme: 'light' | 'dark' = 'dark';

	const dispatch = createEventDispatcher<{ change: string }>();

	let isEditorFullscreen = false;
	let editorWrapper: HTMLDivElement;

	let textareaElement: HTMLTextAreaElement;
	let highlightContainer: HTMLDivElement;
	let highlightedCode = '';
	let highlightingEnabled = false;

	onMount(async () => {
		if (!browser) return;
		highlightingEnabled = true;
		await updateHighlighting();
	});

	// Update highlighting when value or theme changes
	$: if (highlightingEnabled && value !== undefined) {
		updateHighlighting();
	}

	async function updateHighlighting() {
		if (!browser || !highlightingEnabled) return;

		try {
			// Create clean SPICE syntax highlighting
			const lines = (value || '').split('\n');
			const highlightedLines = lines.map(line => {
				let highlightedLine = line;
				
				// Escape HTML first
				highlightedLine = highlightedLine
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
				
				// Apply SPICE-specific highlighting
				if (line.trim().startsWith('*')) {
					// Comments (lines starting with *)
					highlightedLine = `<span class="spice-comment">${highlightedLine}</span>`;
				} else if (line.trim().match(/^\.[a-zA-Z]+/)) {
					// Control statements (lines starting with .)
					highlightedLine = highlightedLine.replace(
						/(^\s*)(\.[a-zA-Z]+.*$)/,
						'$1<span class="spice-directive">$2</span>'
					);
				} else {
					// Components (R, L, C, V, I, M, Q, D, J, K)
					highlightedLine = highlightedLine.replace(
						/\b([RLCVIMQDJKrclvimqdjk]\w*)\b/g,
						'<span class="spice-component">$1</span>'
					);
					
					// Numbers with units
					highlightedLine = highlightedLine.replace(
						/\b(\d+\.?\d*[munpfkMGT]?)\b/g,
						'<span class="spice-number">$1</span>'
					);
					
					// Node names (common patterns)
					highlightedLine = highlightedLine.replace(
						/\b(VDD|VSS|GND|VCC|0)\b/g,
						'<span class="spice-node">$1</span>'
					);
				}
				
				return highlightedLine;
			});
			
			highlightedCode = highlightedLines.join('\n');
			
		} catch (error) {
			console.warn('Highlighting error:', error);
			highlightedCode = value || '';
		}
	}

	function handleTextareaChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		value = target.value;
		dispatch('change', value);
		// Update syntax highlighting on change
		if (highlightingEnabled) {
			updateHighlighting();
		}
	}

	function handleTextareaInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		value = target.value;
		dispatch('change', value);
		// Debounce highlighting for performance
		clearTimeout(highlightTimeout);
		highlightTimeout = setTimeout(() => {
			if (highlightingEnabled) {
				updateHighlighting();
			}
		}, 300);
	}

	function handleTextareaScroll() {
		if (textareaElement && highlightContainer) {
			highlightContainer.scrollTop = textareaElement.scrollTop;
			highlightContainer.scrollLeft = textareaElement.scrollLeft;
		}
	}

	let highlightTimeout: NodeJS.Timeout;

	function toggleEditorFullscreen() {
		if (!isEditorFullscreen) {
			if (editorWrapper.requestFullscreen) {
				editorWrapper.requestFullscreen();
				isEditorFullscreen = true;
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
				isEditorFullscreen = false;
			}
		}
	}

	function handleEditorFullscreenChange() {
		isEditorFullscreen = document.fullscreenElement === editorWrapper;
	}
</script>

<div class="editor-wrapper" bind:this={editorWrapper} class:fullscreen={isEditorFullscreen}>
	<div class="editor-header">
		<span class="editor-title">SPICE Netlist Editor</span>
		<button 
			class="editor-fullscreen-btn"
			on:click={toggleEditorFullscreen}
			title={isEditorFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
		>
			{#if isEditorFullscreen}
				⚏
			{:else}
				⛶
			{/if}
		</button>
	</div>
	<div class="editor-content">
		<div class="highlight-overlay" bind:this={highlightContainer}>
			<pre><code>{@html highlightedCode}</code></pre>
		</div>
		<textarea
			bind:this={textareaElement}
			bind:value
			on:input={handleTextareaInput}
			on:change={handleTextareaChange}
			on:scroll={handleTextareaScroll}
			placeholder="Enter your SPICE netlist here..."
			class="spice-textarea"
			data-theme={theme}
			spellcheck="false"
		></textarea>
	</div>
</div>

<svelte:window on:fullscreenchange={handleEditorFullscreenChange} />

<style>
	.editor-wrapper {
		width: 100%;
		height: 100%;
		min-height: 400px;
		display: flex;
		flex-direction: column;
		position: relative;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		overflow: hidden;
		background: var(--bg-primary);
	}

	.editor-wrapper.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw !important;
		height: 100vh !important;
		z-index: 9999;
		background: var(--bg-primary);
		border-radius: 0;
		border: none;
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.editor-title {
		user-select: none;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.editor-fullscreen-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 2rem;
		width: 2rem;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s;
		font-size: 1rem;
	}

	.editor-fullscreen-btn:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.editor-content {
		position: relative;
		flex: 1;
		overflow: hidden;
	}

	.highlight-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: hidden;
		z-index: 1;
		background: var(--bg-primary);
	}

	.highlight-overlay pre {
		margin: 0;
		padding: 1rem;
		background: transparent !important;
		font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
		word-wrap: break-word;
		height: 100%;
		color: var(--text-primary);
		tab-size: 2;
	}

	.highlight-overlay code {
		background: transparent !important;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		display: block;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.spice-textarea {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 400px;
		padding: 1rem;
		border: none;
		border-radius: 0;
		font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		resize: none;
		outline: none;
		background: transparent;
		color: transparent;
		caret-color: var(--text-primary);
		z-index: 2;
		white-space: pre-wrap;
		word-wrap: break-word;
		tab-size: 2;
	}

	.editor-wrapper.fullscreen .spice-textarea {
		min-height: calc(100vh - 60px);
	}

	.spice-textarea::selection {
		background: rgba(59, 130, 246, 0.3);
	}

	.spice-textarea::-moz-selection {
		background: rgba(59, 130, 246, 0.3);
	}

	.spice-textarea::placeholder {
		color: var(--text-secondary);
	}

	/* SPICE Syntax Highlighting Styles */
	.highlight-overlay :global(.spice-comment) {
		color: #6b7280; /* Gray for comments */
		font-style: italic;
		opacity: 0.8;
	}

	.highlight-overlay :global(.spice-directive) {
		color: #3b82f6; /* Blue for directives */
		font-weight: 600;
	}

	.highlight-overlay :global(.spice-component) {
		color: #10b981; /* Green for components */
		font-weight: 500;
	}

	.highlight-overlay :global(.spice-number) {
		color: #f59e0b; /* Orange for numbers */
		font-weight: 500;
	}

	.highlight-overlay :global(.spice-node) {
		color: #8b5cf6; /* Purple for nodes */
		font-weight: 600;
	}

	/* Additional responsive styles */
	@media (max-width: 768px) {
		.editor-header {
			padding: 0.5rem 0.75rem;
			font-size: 0.8125rem;
		}

		.editor-title {
			font-size: 0.8125rem;
		}

		.highlight-overlay pre,
		.spice-textarea {
			font-size: 0.8125rem;
			padding: 0.75rem;
		}
	}
</style>