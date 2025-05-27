<!-- Simple SPICE Editor Component -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	export let value = '';
	export let theme: 'light' | 'dark' = 'dark';

	const dispatch = createEventDispatcher<{ change: string }>();

	let editorContainer: HTMLDivElement;
	let textareaElement: HTMLTextAreaElement;
	let editor: any = null;
	let monacoLoaded = false;
	let monacoError = false;

	onMount(async () => {
		if (!browser) return;

		try {
			// Try to load Monaco Editor with simplified approach
			const monaco = await import('monaco-editor');
			
			// Register SPICE language if not already registered
			if (!monaco.languages.getLanguages().find(lang => lang.id === 'spice')) {
				monaco.languages.register({ id: 'spice' });
				
				// Simple SPICE syntax highlighting
				monaco.languages.setMonarchTokensProvider('spice', {
					tokenizer: {
						root: [
							[/\*.*$/, 'comment'],
							[/^\..*$/, 'keyword'],
							[/[RLCVIMQDJKrclvimqdjk]\w*/, 'type'],
							[/\d+\.?\d*[munpfkMGT]?/, 'number'],
							[/\w+/, 'identifier'],
						],
					},
				});

				// Simple themes
				monaco.editor.defineTheme('spice-dark', {
					base: 'vs-dark',
					inherit: true,
					rules: [
						{ token: 'comment', foreground: '6A9955' },
						{ token: 'keyword', foreground: '569CD6' },
						{ token: 'type', foreground: '4EC9B0' },
						{ token: 'number', foreground: 'B5CEA8' },
					],
					colors: {}
				});

				monaco.editor.defineTheme('spice-light', {
					base: 'vs',
					inherit: true,
					rules: [
						{ token: 'comment', foreground: '008000' },
						{ token: 'keyword', foreground: '0000FF' },
						{ token: 'type', foreground: '0070C1' },
						{ token: 'number', foreground: '098658' },
					],
					colors: {}
				});
			}

			// Create the editor
			editor = monaco.editor.create(editorContainer, {
				value: value,
				language: 'spice',
				theme: theme === 'dark' ? 'spice-dark' : 'spice-light',
				minimap: { enabled: false },
				fontSize: 14,
				lineNumbers: 'on',
				automaticLayout: true,
				wordWrap: 'on',
			});

			// Listen for changes
			editor.onDidChangeModelContent(() => {
				const newValue = editor.getValue();
				value = newValue;
				dispatch('change', newValue);
			});

			monacoLoaded = true;

		} catch (error) {
			console.warn('Failed to load Monaco Editor:', error);
			monacoError = true;
		}
	});

	// Update theme when prop changes
	$: if (editor && monacoLoaded) {
		import('monaco-editor').then(monaco => {
			monaco.editor.setTheme(theme === 'dark' ? 'spice-dark' : 'spice-light');
		}).catch(() => {});
	}

	// Update editor value when prop changes
	$: if (editor && monacoLoaded && editor.getValue() !== value) {
		editor.setValue(value);
	}

	function handleTextareaChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		value = target.value;
		dispatch('change', value);
	}
</script>

<div class="editor-wrapper">
	{#if monacoLoaded}
		<div bind:this={editorContainer} class="editor-container"></div>
	{:else if monacoError}
		<!-- Fallback textarea when Monaco fails -->
		<div class="textarea-editor" data-theme={theme}>
			<textarea
				bind:this={textareaElement}
				bind:value
				on:input={handleTextareaChange}
				placeholder="Enter your SPICE netlist here..."
				class="spice-textarea"
				spellcheck="false"
			></textarea>
		</div>
	{:else}
		<!-- Loading state -->
		<div class="loading-container">
			<div class="loading-text">Loading editor...</div>
		</div>
	{/if}
</div>

<style>
	.editor-wrapper {
		width: 100%;
		height: 100%;
		min-height: 400px;
		display: flex;
		flex-direction: column;
	}

	.editor-container {
		width: 100%;
		height: 100%;
		min-height: 400px;
	}

	.textarea-editor {
		width: 100%;
		height: 100%;
		min-height: 400px;
		position: relative;
	}

	.spice-textarea {
		width: 100%;
		height: 100%;
		min-height: 400px;
		padding: 1rem;
		border: 1px solid #404040;
		border-radius: 4px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 14px;
		line-height: 1.5;
		resize: vertical;
		outline: none;
		transition: border-color 0.2s;
	}

	.textarea-editor[data-theme="dark"] .spice-textarea {
		background: #1e1e1e;
		color: #d4d4d4;
		border-color: #404040;
	}

	.textarea-editor[data-theme="light"] .spice-textarea {
		background: #ffffff;
		color: #000000;
		border-color: #d0d7de;
	}

	.spice-textarea:focus {
		border-color: #4f9eff;
		box-shadow: 0 0 0 2px rgba(79, 158, 255, 0.2);
	}

	.loading-container {
		width: 100%;
		height: 100%;
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		border: 1px solid #d0d7de;
		border-radius: 4px;
	}

	.loading-text {
		color: #666;
		font-size: 14px;
	}

	:global(.monaco-editor) {
		border-radius: 4px;
	}
</style>