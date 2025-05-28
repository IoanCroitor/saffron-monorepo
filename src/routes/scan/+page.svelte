<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { 
		Camera, 
		Upload, 
		Image as ImageIcon, 
		FileText, 
		Loader2, 
		AlertCircle, 
		CheckCircle,
		RotateCcw,
		Copy,
		Download,
		Zap,
   		Settings,
		Save
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { GoogleGenerativeAI } from '@google/generative-ai';
	import {env}  from '$env/dynamic/public';
	import { currentUser } from '$lib/stores/auth';
	import { circuitStore } from '../editor/stores/circuit-store';

	// State management
	let selectedImage: File | null = $state(null);
	let imagePreview: string = $state('');
	let isProcessing = $state(false);
	let spiceNetlist = $state('');
	let error = $state('');
	let success = $state('');
	let showCameraDialog = $state(false);
	let analysisProgress = $state('');
	
	// Save as Schematic state
	let showSaveDialog = $state(false);
	let schematicName = $state('');
	let schematicDescription = $state('');
	let isSaving = $state(false);
	
	// Camera state
	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let stream: MediaStream | null = null;
	let isCameraActive = $state(false);
	let cameraError = $state('');

	// File input reference
	let fileInput: HTMLInputElement;

	// Google AI setup
	let genAI: GoogleGenerativeAI;

	onMount(() => {
		// Initialize Google AI with API key from environment
		const apiKey = env.PUBLIC_GEMINI_API_KEY || 'demo-mode';
		if (apiKey !== 'demo-mode') {
			genAI = new GoogleGenerativeAI(apiKey);
		}

		return () => {
			// Cleanup camera stream on component destroy
			if (stream) {
				stream.getTracks().forEach(track => track.stop());
			}
		};
	});

	// File upload handler
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			if (!file.type.startsWith('image/')) {
				error = 'Please select a valid image file (PNG, JPG, etc.).';
				success = '';
				return;
			}
			
			if (file.size > 10 * 1024 * 1024) { // 10MB limit
				error = 'File size must be less than 10MB.';
				success = '';
				return;
			}
			
			selectedImage = file;
			error = '';
			success = 'Image selected successfully!';
			
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	// Start camera
	async function startCamera() {
		cameraError = '';
		try {
			// Stop any existing stream first
			if (stream) {
				stream.getTracks().forEach(track => track.stop());
			}

			const constraints = {
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 },
					facingMode: 'environment' // Use back camera on mobile
				}
			};

			stream = await navigator.mediaDevices.getUserMedia(constraints);
			showCameraDialog = true;
			
			// Wait a bit for dialog to render
			await new Promise(resolve => setTimeout(resolve, 100));
			
			if (videoElement) {
				videoElement.srcObject = stream;
				videoElement.onloadedmetadata = () => {
					isCameraActive = true;
				};
			}
		} catch (err: any) {
			cameraError = `Camera access failed: ${err.message || 'Unknown error'}`;
			error = 'Could not access camera. Please check permissions or try uploading a file instead.';
			console.error('Camera error:', err);
		}
	}

	// Stop camera
	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		isCameraActive = false;
		showCameraDialog = false;
		cameraError = '';
	}

	// Capture photo from camera
	function capturePhoto() {
		if (!videoElement || !canvasElement || !isCameraActive) return;
		
		const context = canvasElement.getContext('2d');
		if (!context) return;
		
		// Set canvas dimensions to match video
		canvasElement.width = videoElement.videoWidth || videoElement.clientWidth;
		canvasElement.height = videoElement.videoHeight || videoElement.clientHeight;
		
		// Draw video frame to canvas
		context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
		
		// Convert canvas to blob
		canvasElement.toBlob((blob) => {
			if (blob) {
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
				const file = new File([blob], `circuit-capture-${timestamp}.jpg`, { type: 'image/jpeg' });
				selectedImage = file;
				imagePreview = canvasElement.toDataURL('image/jpeg', 0.9);
				stopCamera();
				success = 'Photo captured successfully!';
				error = '';
			}
		}, 'image/jpeg', 0.9);
	}

	// Convert file to base64 for Google AI
	async function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	// Process image with Google Generative AI
	async function processImageWithGemini(image: File): Promise<string> {
		if (!genAI) {
			// Demo mode - return mock data
			analysisProgress = 'Running in demo mode...';
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			const mockNetlists = [
				`* Circuit extracted from image (Demo Mode)
.subckt rc_filter in out
R1 in out 1k
C1 out 0 100nF
.ends

* Main circuit
X1 input output rc_filter
V1 input 0 DC 5V AC 1V
.ac dec 100 1Hz 100kHz
.tran 0.1ms 10ms
.end`,
				
				`* Analog amplifier circuit detected (Demo Mode)
R1 input node1 10k
R2 node1 0 1k
C1 node1 output 1uF
R3 output 0 10k

V_in input 0 AC 1V
.ac dec 100 1Hz 1MHz
.end`,

				`* Digital logic circuit (Demo Mode)
.subckt nand_gate a b y
* NAND gate implementation
.ends

X1 input1 input2 output nand_gate
V_a input1 0 PULSE(0 3.3 0 1ns 1ns 10ns 20ns)
V_b input2 0 PULSE(0 3.3 0 1ns 1ns 20ns 40ns)
.tran 0.1ns 100ns
.end`
			];
			
			return mockNetlists[Math.floor(Math.random() * mockNetlists.length)];
		}

		try {
			analysisProgress = 'Preparing image for analysis...';
			const base64Data = await fileToBase64(image);
			
			analysisProgress = 'Analyzing circuit diagram...';
			const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
			
			const prompt = `Analyze this circuit diagram image and generate a SPICE netlist. 
You are given an image of an electrical circuit. Follow the steps below to generate a complete and runnable SPICE netlist:

    Identify all circuit components (resistors, capacitors, inductors, transistors, diodes, voltage sources, current sources, etc.)

    Determine how components are connected and assign meaningful node names or numbers

    Follow standard SPICE netlist syntax

    Add appropriate voltage and/or current sources to make the circuit simulatable

    Include inline comments explaining the function of each part of the circuit

    Ensure the netlist is complete, correct, and can be directly used in a SPICE simulator

Important:
Only output the SPICE netlist. Do not include any explanations, headers, or additional text.`;

			const result = await model.generateContent([
				prompt,
				{
					inlineData: {
						data: base64Data,
						mimeType: image.type
					}
				}
			]);

			analysisProgress = 'Processing AI response...';
			const response = await result.response;
			const text = response.text();
			
			// Extract SPICE code from response (remove markdown formatting if present)
			let spiceCode = text;
			if (text.includes('```')) {
				const codeBlocks = text.match(/```[\s\S]*?```/g);
				if (codeBlocks && codeBlocks.length > 0) {
					spiceCode = codeBlocks[0].replace(/```\w*\n?/g, '').trim();
				}
			}
			
			return spiceCode;
		} catch (error: any) {
			console.error('Google AI error:', error);
			throw new Error(`AI analysis failed: ${error.message || 'Unknown error'}`);
		}
	}

	// Process the selected image
	async function processImage() {
		if (!selectedImage) {
			error = 'Please select or capture an image first.';
			return;
		}
		
		isProcessing = true;
		error = '';
		success = '';
		spiceNetlist = '';
		analysisProgress = 'Starting analysis...';
		
		try {
			const netlist = await processImageWithGemini(selectedImage);
			spiceNetlist = netlist;
			success = 'Circuit successfully extracted from image!';
			analysisProgress = '';
		} catch (err: any) {
			error = err.message || 'Failed to process image. Please try again.';
			analysisProgress = '';
			console.error('Processing error:', err);
		} finally {
			isProcessing = false;
		}
	}

	// Reset form
	function resetForm() {
		selectedImage = null;
		imagePreview = '';
		spiceNetlist = '';
		error = '';
		success = '';
		analysisProgress = '';
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// Copy netlist to clipboard
	async function copyNetlist() {
		try {
			await navigator.clipboard.writeText(spiceNetlist);
			success = 'Netlist copied to clipboard!';
			// Clear success message after 3 seconds
			setTimeout(() => success = '', 3000);
		} catch (err) {
			error = 'Failed to copy to clipboard.';
		}
	}

	// Download netlist as file
	function downloadNetlist() {
		const blob = new Blob([spiceNetlist], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
		a.download = `circuit-netlist-${timestamp}.cir`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		success = 'Netlist downloaded successfully!';
		setTimeout(() => success = '', 3000);
	}

	// Convert SPICE netlist to JSON schematic format
	function convertSpiceToJSON(spiceNetlist: string, name: string, description: string) {
		const lines = spiceNetlist.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('*'));
		
		const nodes: any[] = [];
		const edges: any[] = [];
		const cells: any = {};
		const netMap = new Map<string, string[]>();
		
		let nodeCounter = 0;
		let edgeCounter = 0;
		let bitCounter = 2;
		
		// Helper to get or create bit ID for a net
		function getBitId(netName: string): number {
			return bitCounter++;
		}
		
		// Parse SPICE netlist and extract components
		lines.forEach((line, index) => {
			if (line.startsWith('.') || !line) return;
			
			const parts = line.split(/\s+/);
			if (parts.length < 3) return;
			
			const componentId = parts[0];
			const type = componentId.charAt(0).toUpperCase();
			let componentType = '';
			let parameters: any = {};
			let connections: any = {};
			
			// Position components in a grid layout
			const x = (index % 4) * 200 + 100;
			const y = Math.floor(index / 4) * 150 + 100;
			
			switch (type) {
				case 'R':
					componentType = 'resistor';
					parameters = { resistance: parts[3] || '1k' };
					connections = {
						A: [getBitId(`${componentId}_A`)],
						B: [getBitId(`${componentId}_B`)]
					};
					break;
				case 'C':
					componentType = 'capacitor';
					parameters = { capacitance: parts[3] || '1u' };
					connections = {
						A: [getBitId(`${componentId}_A`)],
						B: [getBitId(`${componentId}_B`)]
					};
					break;
				case 'L':
					componentType = 'inductor';
					parameters = { inductance: parts[3] || '1m' };
					connections = {
						A: [getBitId(`${componentId}_A`)],
						B: [getBitId(`${componentId}_B`)]
					};
					break;
				case 'V':
					componentType = 'voltageSource';
					parameters = { voltage: parts[3] || '5V', type: 'DC' };
					connections = {
						POS: [getBitId(`${componentId}_POS`)],
						NEG: [getBitId(`${componentId}_NEG`)]
					};
					break;
				case 'I':
					componentType = 'currentSource';
					parameters = { current: parts[3] || '1A' };
					connections = {
						POS: [getBitId(`${componentId}_POS`)],
						NEG: [getBitId(`${componentId}_NEG`)]
					};
					break;
				case 'D':
					componentType = 'diode';
					parameters = { type: parts[3] || '1N4148' };
					connections = {
						A: [getBitId(`${componentId}_A`)],
						K: [getBitId(`${componentId}_K`)]
					};
					break;
				case 'M':
				case 'Q':
					componentType = 'transistor';
					parameters = { type: parts[4] || '2N3904', configuration: 'NPN' };
					connections = {
						C: [getBitId(`${componentId}_C`)],
						B: [getBitId(`${componentId}_B`)],
						E: [getBitId(`${componentId}_E`)]
					};
					break;
				default:
					componentType = 'resistor'; // Default fallback
					parameters = { resistance: '1k' };
					connections = {
						A: [getBitId(`${componentId}_A`)],
						B: [getBitId(`${componentId}_B`)]
					};
			}
			
			// Create node for the visual editor
			const nodeId = `${componentType}_${nodeCounter++}`;
			nodes.push({
				id: nodeId,
				type: componentType,
				position: { x, y },
				data: {
					label: componentType,
					parameters: parameters
				}
			});
			
			// Store net connections for this component
			if (parts[1] && parts[1] !== '0') {
				if (!netMap.has(parts[1])) netMap.set(parts[1], []);
				netMap.get(parts[1])!.push(`${nodeId}.A`);
			}
			if (parts[2] && parts[2] !== '0') {
				if (!netMap.has(parts[2])) netMap.set(parts[2], []);
				netMap.get(parts[2])!.push(`${nodeId}.B`);
			}
			
			// Create cell for JSON export
			const cellName = `${componentType.charAt(0).toUpperCase()}${Math.floor(index / 4) + 1}`;
			cells[cellName] = {
				type: `${componentType}_v`,
				connections: connections,
				attributes: parameters
			};
		});
		
		// Create edges based on net connections
		for (const [netName, connectedPins] of netMap.entries()) {
			if (connectedPins.length >= 2) {
				for (let i = 0; i < connectedPins.length - 1; i++) {
					const [sourceNodeId, sourceHandle] = connectedPins[i].split('.');
					const [targetNodeId, targetHandle] = connectedPins[i + 1].split('.');
					
					edges.push({
						id: `edge_${edgeCounter++}`,
						source: sourceNodeId,
						target: targetNodeId,
						sourceHandle: sourceHandle || 'A',
						targetHandle: targetHandle || 'B'
					});
				}
			}
		}
		
		// Create the complete JSON structure
		const schematicData = {
			nodes,
			edges,
			version: '1.0',
			created_at: new Date().toISOString(),
			metadata: {
				name,
				description,
				source: 'Circuit Scanner - SPICE Import'
			}
		};
		
		return {
			schematicData,
			jsonStructure: {
				modules: {
					main: {
						ports: {},
						cells
					}
				}
			}
		};
	}

	// Save as schematic function
	async function saveSchematic() {
		if (!schematicName.trim()) {
			error = 'Please enter a schematic name.';
			return;
		}

		// Check if user is logged in
		if (!$currentUser) {
			error = 'You must be logged in to save schematics.';
			return;
		}
		
		isSaving = true;
		error = '';
		success = '';
		
		try {
			const { schematicData } = convertSpiceToJSON(spiceNetlist, schematicName, schematicDescription);
			
			// Use the circuit store's saveCircuit method to save to database
			const result = await circuitStore.saveCircuit(
				schematicName,
				schematicDescription || 'Converted from SPICE netlist via Circuit Scanner',
				$currentUser.id
			);
			
			if (result.success) {
				// Close dialog and show success
				showSaveDialog = false;
				const savedName = schematicName;
				schematicName = '';
				schematicDescription = '';
				success = `Schematic "${savedName}" saved to your projects!`;
				setTimeout(() => success = '', 5000);
			} else {
				error = `Failed to save schematic: ${result.error}`;
			}
		} catch (err: any) {
			error = `Failed to save schematic: ${err.message}`;
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Circuit Scanner - Saffron</title>
	<meta name="description" content="Extract SPICE netlists from circuit images using AI" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-background to-muted/20">
	<div class="container mx-auto px-4 py-8 max-w-7xl">
		<!-- Header Section -->
		<div class="text-center mb-12">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
				<Zap class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-5xl font-bold text-foreground mb-4 tracking-tight">Circuit Scanner</h1>
			<p class="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
				Transform circuit diagrams into SPICE netlists using AI-powered image analysis
			</p>
		</div>

		<!-- Status Messages -->
		{#if error}
			<Card class="mb-8 border-destructive/50 bg-destructive/5">
				<CardContent class="flex items-center gap-3 p-6">
					<div class="flex-shrink-0">
						<AlertCircle class="h-6 w-6 text-destructive" />
					</div>
					<p class="text-destructive font-medium">{error}</p>
				</CardContent>
			</Card>
		{/if}

		{#if success}
			<Card class="mb-8 border-green-500/50 bg-green-50 dark:bg-green-950/20">
				<CardContent class="flex items-center gap-3 p-6">
					<div class="flex-shrink-0">
						<CheckCircle class="h-6 w-6 text-green-600" />
					</div>
					<p class="text-green-600 font-medium">{success}</p>
				</CardContent>
			</Card>
		{/if}

		<!-- Progress Indicator -->
		{#if analysisProgress}
			<Card class="mb-8 border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
				<CardContent class="flex items-center gap-3 p-6">
					<Loader2 class="h-6 w-6 animate-spin text-blue-600" />
					<p class="text-blue-600 font-medium">{analysisProgress}</p>
				</CardContent>
			</Card>
		{/if}

		<!-- Main Content Grid -->
		<div class="grid gap-8 lg:grid-cols-2 xl:gap-12">
			<!-- Image Input Section -->
			<div class="space-y-8">
				<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
					<CardHeader class="pb-6">
						<CardTitle class="flex items-center gap-3 text-2xl">
							<div class="p-2 rounded-lg bg-primary/10">
								<ImageIcon class="h-6 w-6 text-primary" />
							</div>
							Image Input
						</CardTitle>
						<CardDescription class="text-base">
							Capture a photo or upload an image of your circuit diagram
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-8">
						<!-- Action Buttons -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<Button 
								variant="outline" 
								class="h-24 flex-col gap-3 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
								onclick={startCamera}
								disabled={isProcessing}
							>
								<div class="p-2 rounded-full bg-primary/10">
									<Camera class="h-6 w-6 text-primary" />
								</div>
								<span class="font-medium">Capture Photo</span>
							</Button>
							
							<Button 
								variant="outline" 
								class="h-24 flex-col gap-3 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
								onclick={() => fileInput?.click()}
								disabled={isProcessing}
							>
								<div class="p-2 rounded-full bg-primary/10">
									<Upload class="h-6 w-6 text-primary" />
								</div>
								<span class="font-medium">Upload Image</span>
							</Button>
						</div>

						<!-- Hidden file input -->
						<input
							bind:this={fileInput}
							type="file"
							accept="image/*"
							class="hidden"
							onchange={handleFileSelect}
						/>

						<!-- Image Preview -->
						{#if imagePreview}
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<Label class="text-lg font-medium">Selected Image</Label>
									<Badge variant="secondary" class="px-3 py-1">
										{selectedImage?.name || 'Captured Image'}
									</Badge>
								</div>
								<div class="relative group">
									<img 
										src={imagePreview} 
										alt="Selected circuit" 
										class="w-full max-h-96 object-contain rounded-xl border shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
									/>
									<div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors duration-200"></div>
								</div>
								<div class="flex flex-col sm:flex-row gap-3">
									<Button 
										onclick={processImage} 
										disabled={isProcessing}
										class="flex-1 h-12"
										size="lg"
									>
										{#if isProcessing}
											<Loader2 class="h-5 w-5 mr-3 animate-spin" />
											Processing...
										{:else}
											<FileText class="h-5 w-5 mr-3" />
											Extract Circuit
										{/if}
									</Button>
									<Button variant="outline" onclick={resetForm} class="h-12 px-6">
										<RotateCcw class="h-4 w-4 mr-2" />
										Clear
									</Button>
								</div>
							</div>
						{:else}
							<div class="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center bg-muted/30">
								<div class="space-y-4">
									<div class="p-4 rounded-full bg-muted/50 w-fit mx-auto">
										<ImageIcon class="h-12 w-12 text-muted-foreground/50" />
									</div>
									<div class="space-y-2">
										<p class="text-lg font-medium text-muted-foreground">No image selected</p>
										<p class="text-sm text-muted-foreground/75">
											Use the buttons above to capture or upload an image
										</p>
									</div>
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Results Section -->
			<div class="space-y-8">
				<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
					<CardHeader class="pb-6">
						<CardTitle class="flex items-center gap-3 text-2xl">
							<div class="p-2 rounded-lg bg-primary/10">
								<FileText class="h-6 w-6 text-primary" />
							</div>
							SPICE Netlist
						</CardTitle>
						<CardDescription class="text-base">
							Generated netlist from your circuit image
						</CardDescription>
					</CardHeader>
					<CardContent>
						{#if spiceNetlist}
							<div class="space-y-6">
								<div class="relative">
									<textarea
										readonly
										bind:value={spiceNetlist}
										rows="20"
										class="w-full p-4 font-mono text-sm border rounded-xl bg-muted/30 backdrop-blur-sm focus:ring-2 focus:ring-primary/20 transition-all duration-200"
										placeholder="Generated SPICE netlist will appear here..."
									></textarea>
									<div class="absolute top-3 right-3">
										<Badge variant="secondary">
											{spiceNetlist.split('\n').length} lines
										</Badge>
									</div>
								</div>
								<div class="flex flex-col sm:flex-row gap-3">
									<Button variant="outline" onclick={copyNetlist} class="flex-1 h-12">
										<Copy class="h-4 w-4 mr-2" />
										Copy to Clipboard
									</Button>
									<Button variant="outline" onclick={downloadNetlist} class="flex-1 h-12">
										<Download class="h-4 w-4 mr-2" />
										Download File
									</Button>
									<Button variant="outline" onclick={() => showSaveDialog = true} class="flex-1 h-12">
										<Save class="h-4 w-4 mr-2" />
										Save as Schematic
									</Button>
								</div>
							</div>
						{:else}
							<div class="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center bg-muted/30">
								<div class="space-y-4">
									<div class="p-4 rounded-full bg-muted/50 w-fit mx-auto">
										<FileText class="h-12 w-12 text-muted-foreground/50" />
									</div>
									<div class="space-y-2">
										<p class="text-lg font-medium text-muted-foreground">No netlist generated yet</p>
										<p class="text-sm text-muted-foreground/75">
											Process an image to see the extracted SPICE netlist
										</p>
									</div>
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Information Card -->
				<Card class="shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10">
					<CardHeader>
						<CardTitle class="text-lg flex items-center gap-2">
							<Settings class="h-5 w-5" />
							How it works
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-3">
							<div class="flex items-start gap-4">
								<div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
									<span class="text-sm font-bold text-primary">1</span>
								</div>
								<p class="text-sm text-muted-foreground leading-relaxed">
									Take a clear photo or upload an image of your circuit diagram
								</p>
							</div>
							<div class="flex items-start gap-4">
								<div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
									<span class="text-sm font-bold text-primary">2</span>
								</div>
								<p class="text-sm text-muted-foreground leading-relaxed">
									AI analyzes the circuit components and connections using Google's Gemini model
								</p>
							</div>
							<div class="flex items-start gap-4">
								<div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
									<span class="text-sm font-bold text-primary">3</span>
								</div>
								<p class="text-sm text-muted-foreground leading-relaxed">
									Generates a SPICE netlist ready for simulation in your favorite tool
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</div>

<!-- Camera Dialog -->
<Dialog.Root bind:open={showCameraDialog}>
	<Dialog.Content class="max-w-4xl w-[90vw] max-h-[90vh] overflow-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Camera class="h-5 w-5" />
				Capture Circuit Image
			</Dialog.Title>
			<Dialog.Description>
				Position your camera over the circuit diagram. The preview will show what will be captured.
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="space-y-6">
			{#if cameraError}
				<Card class="border-destructive">
					<CardContent class="flex items-center gap-3 p-4">
						<AlertCircle class="h-5 w-5 text-destructive" />
						<p class="text-destructive">{cameraError}</p>
					</CardContent>
				</Card>
			{/if}

			<!-- Camera Preview Container -->
			<div class="relative bg-black rounded-xl overflow-hidden">
				<!-- Loading state -->
				{#if !isCameraActive && !cameraError}
					<div class="flex items-center justify-center h-64 bg-muted">
						<div class="text-center space-y-3">
							<Loader2 class="h-8 w-8 animate-spin mx-auto" />
							<p class="text-muted-foreground">Starting camera...</p>
						</div>
					</div>
				{/if}

				<!-- Video element for camera preview -->
				<video
					bind:this={videoElement}
					autoplay
					playsinline
					muted
					class="w-full h-auto {!isCameraActive ? 'hidden' : ''}"
					style="max-height: 60vh; min-height: 300px;"
				>
					<track kind="captions" />
				</video>

				<!-- Camera overlay with grid lines -->
				{#if isCameraActive}
					<div class="absolute inset-0 pointer-events-none">
						<!-- Grid overlay for better framing -->
						<div class="absolute inset-4 border-2 border-white/30 rounded-lg">
							<div class="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0">
								{#each Array(9) as _, i}
									<div class="border border-white/20"></div>
								{/each}
							</div>
						</div>
						
						<!-- Corner guides -->
						<div class="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-white/60"></div>
						<div class="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-white/60"></div>
						<div class="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-white/60"></div>
						<div class="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-white/60"></div>
						
						<!-- Instructions overlay -->
						<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
							<Badge variant="secondary" class="bg-black/60 text-white border-white/30">
								Position circuit within the guides
							</Badge>
						</div>
					</div>
				{/if}
				
				<!-- Hidden canvas for capturing -->
				<canvas bind:this={canvasElement} class="hidden"></canvas>
			</div>

			<!-- Camera Controls -->
			<div class="flex flex-col sm:flex-row justify-between items-center gap-4">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<div class="w-2 h-2 rounded-full bg-green-500 {isCameraActive ? 'animate-pulse' : 'bg-muted'}"></div>
					{isCameraActive ? 'Camera active' : 'Camera inactive'}
				</div>
				
				<div class="flex gap-3">
					<Button variant="outline" onclick={stopCamera} class="min-w-24">
						Cancel
					</Button>
					<Button 
						onclick={capturePhoto} 
						disabled={!isCameraActive}
						class="min-w-32 bg-primary hover:bg-primary/90"
					>
						{#if !isCameraActive}
							<Loader2 class="h-4 w-4 mr-2 animate-spin" />
							Loading...
						{:else}
							<Camera class="h-4 w-4 mr-2" />
							Capture Photo
						{/if}
					</Button>
				</div>
			</div>

			<!-- Tips -->
			<Card class="bg-muted/50">
				<CardContent class="p-4">
					<h4 class="font-medium mb-2 flex items-center gap-2">
						<Settings class="h-4 w-4" />
						Tips for best results
					</h4>
					<ul class="space-y-1 text-sm text-muted-foreground">
						<li>• Ensure good lighting on the circuit diagram</li>
						<li>• Hold the camera steady and parallel to the diagram</li>
						<li>• Make sure the entire circuit fits within the guides</li>
						<li>• Avoid shadows and reflections on the diagram</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Save as Schematic Dialog -->
<Dialog.Root bind:open={showSaveDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Save class="h-5 w-5" />
				Save as Schematic
			</Dialog.Title>
			<Dialog.Description>
				Convert the extracted SPICE netlist to a JSON schematic file compatible with the circuit editor.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="schematic-name">Schematic Name</Label>
				<Input
					id="schematic-name"
					bind:value={schematicName}
					placeholder="Enter schematic name..."
					class="w-full"
				/>
			</div>
			<div class="space-y-2">
				<Label for="schematic-description">Description (Optional)</Label>
				<textarea
					id="schematic-description"
					bind:value={schematicDescription}
					placeholder="Enter a brief description of the circuit..."
					rows="3"
					class="w-full p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
				></textarea>
			</div>
		</div>
		<Dialog.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
			<Button variant="outline" onclick={() => showSaveDialog = false}>
				Cancel
			</Button>
			<Button onclick={saveSchematic} disabled={!schematicName.trim() || isSaving}>
				{#if isSaving}
					<Loader2 class="h-4 w-4 mr-2 animate-spin" />
					Saving...
				{:else}
					<Save class="h-4 w-4 mr-2" />
					Save Schematic
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* Enhanced responsive behavior and animations */
	@media (max-width: 768px) {
		.container {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}

	/* Camera preview enhancements */
	video {
		object-fit: cover;
		background-color: #000;
		transition: all 0.3s ease;
	}

	/* Smooth animations for state changes */
	.grid {
		transition: all 0.3s ease;
	}

	/* Progress indicator animations */
	@keyframes pulse-border {
		0%, 100% {
			border-color: rgba(59, 130, 246, 0.3);
		}
		50% {
			border-color: rgba(59, 130, 246, 0.6);
		}
	}

	/* Image preview enhancements */
	img {
		transition: all 0.3s ease;
	}

	/* Custom scrollbar for textarea */
	textarea::-webkit-scrollbar {
		width: 8px;
	}

	textarea::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 4px;
	}

	textarea::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	textarea::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.3);
	}
</style>