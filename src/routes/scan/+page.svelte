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
	import { page } from '$app/stores';
	import { circuitAPI } from '../editor/services/circuit-api';
	import { circuitRecognitionAPI, type CircuitRecognitionResponse } from '$lib/services/circuit-recognition-api';

	let { data } = $props();
	
	// Get user from server-side data
	const user = $derived(data.user);

	// State management
	let selectedImage: File | null = $state(null);
	let imagePreview: string = $state('');
	let isProcessing = $state(false);
	let spiceNetlist = $state('');
	let error = $state('');
	let success = $state('');
	let showCameraDialog = $state(false);
	let analysisProgress = $state('');
	
	// Circuit Recognition Data
	let circuitRecognitionData: CircuitRecognitionResponse | null = $state(null);
	let apiStatus = $state<'unknown' | 'available' | 'unavailable'>('unknown');
	
	// YOLO Debug Image
	let annotatedImageUrl: string = $state('');
	let showAnnotatedImage = $state(false);
	let isGeneratingAnnotatedImage = $state(false);
	
	// Save as Schematic state
	let showSaveDialog = $state(false);
	let schematicName = $state('');
	let schematicDescription = $state('');
	let isSaving = $state(false);
	
	// Generated Circuit Data
	let generatedCircuitData: any = $state(null);
	
	// Camera state
	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let stream: MediaStream | null = null;
	let isCameraActive = $state(false);
	let cameraError = $state('');

	// File input references
	let fileInput: HTMLInputElement;
	let ascFileInput: HTMLInputElement;

	// Google AI setup
	let genAI: GoogleGenerativeAI;

	onMount(() => {
		// Initialize Google AI with API key from environment
		const apiKey = env.PUBLIC_GEMINI_API_KEY || 'demo-mode';
		if (apiKey !== 'demo-mode') {
			genAI = new GoogleGenerativeAI(apiKey);
		}

		// Check Circuit Recognition API status
		(async () => {
			try {
				await circuitRecognitionAPI.healthCheck();
				apiStatus = 'available';
			} catch (error) {
				console.log('Circuit Recognition API not available:', error);
				apiStatus = 'unavailable';
			}
		})();

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

	// ASC file upload handler
	async function handleAscFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			if (!file.name.endsWith('.asc') && file.type !== 'text/plain') {
				error = 'Please select a valid ASC file (.asc or text file).';
				success = '';
				return;
			}
			
			if (file.size > 10 * 1024 * 1024) { // 10MB limit
				error = 'File size must be less than 10MB.';
				success = '';
				return;
			}
			
			isProcessing = true;
			error = '';
			success = '';
			analysisProgress = 'Converting ASC file to JSON...';
			
			try {
				const jsonResult = await circuitRecognitionAPI.convertAscToJson(file);
				circuitRecognitionData = { circuit: jsonResult, processing_time: 0 };
				spiceNetlist = circuitRecognitionAPI.convertToSpiceNetlist({ circuit: jsonResult });
				success = 'ASC file successfully converted to SPICE netlist!';
				analysisProgress = '';
			} catch (err: any) {
				error = err.message || 'Failed to convert ASC file. Please try again.';
				analysisProgress = '';
				console.error('ASC conversion error:', err);
			} finally {
				isProcessing = false;
			}
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

	// Convert blob to base64 for annotated images
	async function blobToBase64(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	// Augment circuit recognition data with Gemini AI
	async function augmentWithGemini(circuitData: CircuitRecognitionResponse): Promise<any> {
		if (!genAI) {
			// Demo mode - return enhanced mock data
			return enhanceCircuitData(circuitData);
		}

		try {
			analysisProgress = 'Enhancing circuit data with AI...';
			const originalImageBase64 = await fileToBase64(selectedImage!);
			
			// Get annotated image for better component detection
			let annotatedImageBase64 = '';
			try {
				const annotatedImageBlob = await circuitRecognitionAPI.getAnnotatedImage(selectedImage!);
				annotatedImageBase64 = await blobToBase64(annotatedImageBlob);
			} catch (error) {
				console.warn('Failed to get annotated image, using original only:', error);
			}
			
			const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
			
			// Valid component schemas from the editor
			const validComponentSchemas = {
				resistor: {
					parameters: {
						resistance: { type: 'string', suggestions: ['1', '10', '100', '1k', '10k', '100k', '1M'] },
						tolerance: { type: 'string', options: ['1%', '2%', '5%', '10%', '20%'] },
						power: { type: 'string', options: ['0.125W', '0.25W', '0.5W', '1W', '2W', '5W'] },
						temperature_coefficient: { type: 'string', default: '100' }
					}
				},
				capacitor: {
					parameters: {
						capacitance: { type: 'string', suggestions: ['1p', '10p', '100p', '1n', '10n', '100n', '1μ', '10μ', '100μ'] },
						voltage: { type: 'string', suggestions: ['16V', '25V', '50V', '100V', '250V'] },
						type: { type: 'string', options: ['Ceramic', 'Electrolytic', 'Film', 'Tantalum'] },
						esr: { type: 'string', default: '0.1' }
					}
				},
				inductor: {
					parameters: {
						inductance: { type: 'string', suggestions: ['1μH', '10μH', '100μH', '1mH', '10mH', '100mH'] },
						current: { type: 'string', suggestions: ['100mA', '500mA', '1A', '2A', '5A'] },
						dcr: { type: 'string', default: '1' },
						core_material: { type: 'string', options: ['Air Core', 'Ferrite', 'Iron Core'] }
					}
				},
				voltageSource: {
					parameters: {
						voltage: { type: 'string', suggestions: ['1.5V', '3.3V', '5V', '12V', '24V', '48V'] },
						type: { type: 'string', options: ['DC', 'AC', 'PULSE'] },
						frequency: { type: 'string', default: '60' },
						phase: { type: 'number', default: 0 }
					}
				},
				currentSource: {
					parameters: {
						current: { type: 'string', suggestions: ['1mA', '10mA', '100mA', '1A', '10A'] },
						type: { type: 'string', options: ['DC', 'AC'] }
					}
				},
				diode: {
					parameters: {
						type: { type: 'string', options: ['1N4148', '1N4007', 'LED', 'Zener'] },
						forwardVoltage: { type: 'string', default: '0.7' },
						current: { type: 'string', default: '200m' },
						reverse_voltage: { type: 'string', default: '100' }
					}
				},
				transistor: {
					parameters: {
						type: { type: 'string', options: ['2N3904', '2N2222', 'BC547', '2N4401'] },
						configuration: { type: 'string', options: ['NPN', 'PNP'] },
						beta: { type: 'number', default: 100 },
						vce_sat: { type: 'string', default: '0.2' }
					}
				},
				opamp: {
					parameters: {
						type: { type: 'string', options: ['LM741', 'LM358', 'TL072', 'OPA2134'] },
						gain: { type: 'string', default: '100k' },
						supply: { type: 'string', options: ['±15V', '±12V', '±5V'] },
						gainBandwidth: { type: 'string', default: '1M' },
						slew_rate: { type: 'string', default: '0.5' }
					}
				},
				ground: {
					parameters: {
						type: { type: 'string', options: ['Earth', 'Signal', 'Chassis'] },
						impedance: { type: 'string', default: '0' },
						plane_area: { type: 'string', options: ['Small', 'Medium', 'Large'] },
						via_count: { type: 'number', default: 4 }
					}
				},
				voltmeter: {
					parameters: {
						range: { type: 'string', options: ['1V', '10V', '100V', '1kV'] },
						impedance: { type: 'string', default: '10M' },
						accuracy: { type: 'string', options: ['0.1%', '1%', '2%'] }
					}
				},
				ammeter: {
					parameters: {
						range: { type: 'string', options: ['1mA', '10mA', '100mA', '1A', '10A'] },
						resistance: { type: 'string', default: '0.1' }
					}
				},
				probe: {
					parameters: {
						impedance: { type: 'string', default: '1M' },
						capacitance: { type: 'string', default: '10p' },
						attenuation: { type: 'string', options: ['1x', '10x', '100x'] }
					}
				}
			};
			
			const prompt = `Analyze these circuit diagram images and generate a complete circuit schematic with all components and their realistic values.

IMAGES PROVIDED:
1. Original circuit diagram
2. Annotated image with bounding boxes and component detection (if available)

CIRCUIT RECOGNITION DATA:
${JSON.stringify(circuitData.circuit.components.map(c => ({ 
	type: c.type, 
	id: c.id, 
	x: c.x, 
	y: c.y,
	attributes: c.attributes 
})))}

WIRE CONNECTIONS:
${JSON.stringify(circuitData.circuit.wires)}

VALID COMPONENT SCHEMAS (use these exact parameter names and types):
${JSON.stringify(validComponentSchemas, null, 2)}

TASK:
1. Analyze both images to identify ALL components in the circuit
2. Use the wire connections to understand component relationships
3. Generate realistic parameter values using the provided schemas
4. Preserve the bounding box coordinates (x, y) from detection
5. Add any missing components that you can see in the images
6. Create proper connections between components based on the wires

REQUIREMENTS:
- Use ONLY the component types from the valid schemas above
- Follow the exact parameter structure for each component type
- Generate realistic values based on common electronic standards
- Preserve spatial relationships from the original image
- Include all visible components, not just those detected by the recognition API

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "components": {
    "component_id": {
      "type": "component_type",
      "parameters": { /* parameters from schema */ },
      "x": 100,
      "y": 200
    }
  },
  "connections": [
    {
      "source": "component_id_1",
      "target": "component_id_2"
    }
  ]
}`;

			const content = [
				prompt,
				{
					inlineData: {
						data: originalImageBase64,
						mimeType: selectedImage!.type
					}
				}
			];

			// Add annotated image if available
			if (annotatedImageBase64) {
				content.push({
					inlineData: {
						data: annotatedImageBase64,
						mimeType: 'image/png'
					}
				});
			}

			const result = await model.generateContent(content);
			const response = await result.response;
			const text = response.text();
			
			// Extract JSON from response
			let enhancedData;
			if (text.includes('```json')) {
				const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
				if (jsonMatch) {
					enhancedData = JSON.parse(jsonMatch[1]);
				}
			} else if (text.includes('{')) {
				const jsonStart = text.indexOf('{');
				const jsonEnd = text.lastIndexOf('}') + 1;
				enhancedData = JSON.parse(text.slice(jsonStart, jsonEnd));
			}
			
			return enhanceCircuitData(circuitData, enhancedData);
		} catch (error: any) {
			console.error('Gemini enhancement error:', error);
			// Fallback to basic enhancement
			return enhanceCircuitData(circuitData);
		}
	}

	// Enhance circuit data with realistic parameters
	function enhanceCircuitData(circuitData: CircuitRecognitionResponse, aiEnhancement?: any): any {
		const nodes: any[] = [];
		const edges: any[] = [];
		let nodeCounter = 0;
		let edgeCounter = 0;

		// Common component parameters
		const defaultParams = {
			resistor: { resistance: '10k', power: '0.25W', tolerance: '2%', temperature_coefficient: '100' },
			capacitor: { capacitance: '1μ', voltage: '25V', type: 'Ceramic', esr: '0.1' },
			inductor: { inductance: '1mH', current: '100mA', type: 'Air Core' },
			diode: { type: '1N4148', forward_voltage: '0.7V', reverse_voltage: '75V' },
			transistor: { type: '2N3904', configuration: 'NPN', package: 'TO-92' },
			voltageSource: { voltage: '5V', type: 'DC' },
			currentSource: { current: '1mA', type: 'DC' }
		};

		// Process each component from circuit recognition
		circuitData.circuit.components.forEach((comp, index) => {
			const componentType = comp.type.toLowerCase();
			const nodeId = `${componentType}_${Date.now()}_${nodeCounter++}`;
			
			// Get enhanced parameters from AI or use defaults
			let parameters = { ...defaultParams[componentType as keyof typeof defaultParams] };
			if (aiEnhancement && aiEnhancement[comp.id]) {
				parameters = { ...parameters, ...aiEnhancement[comp.id].parameters };
			}

			// Use bounding box coordinates from circuit recognition or AI enhancement
			let x = comp.x;
			let y = comp.y;
			if (aiEnhancement && aiEnhancement[comp.id]) {
				x = aiEnhancement[comp.id].x || comp.x;
				y = aiEnhancement[comp.id].y || comp.y;
			}

			// Fallback to grid layout if no coordinates
			if (!x || !y) {
				x = (index % 4) * 200 + 100;
				y = Math.floor(index / 4) * 150 + 100;
			}

			nodes.push({
				id: nodeId,
				type: componentType,
				position: { x, y },
				data: {
					label: componentType,
					parameters: parameters
				},
				measured: {
					width: 80,
					height: 63
				},
				selected: false
			});
		});

		// Process AI-enhanced data with new format
		if (aiEnhancement && aiEnhancement.components) {
			// Start fresh with AI data
			const aiNodes: any[] = [];
			let aiNodeCounter = 0;
			
			Object.entries(aiEnhancement.components).forEach(([compId, compData]: [string, any]) => {
				const componentType = compData.type || 'resistor';
				const nodeId = `${componentType}_${Date.now()}_${aiNodeCounter++}`;
				
				// Get parameters from AI or use defaults
				let parameters = { ...defaultParams[componentType as keyof typeof defaultParams] };
				if (compData.parameters) {
					parameters = { ...parameters, ...compData.parameters };
				}

				aiNodes.push({
					id: nodeId,
					type: componentType,
					position: { 
						x: compData.x || (aiNodeCounter * 200 + 100), 
						y: compData.y || (Math.floor(aiNodeCounter / 4) * 150 + 100) 
					},
					data: {
						label: componentType,
						parameters: parameters
					},
					measured: {
						width: 80,
						height: 63
					},
					selected: false
				});
			});

			// Replace nodes with AI-generated ones
			nodes.length = 0;
			nodes.push(...aiNodes);

			// Create edges from AI connections
			if (aiEnhancement.connections) {
				aiEnhancement.connections.forEach((connection: any) => {
					// Find the corresponding nodes by their original IDs
					const sourceNode = aiNodes.find(n => n.id.includes(connection.source));
					const targetNode = aiNodes.find(n => n.id.includes(connection.target));
					
					if (sourceNode && targetNode) {
						edges.push({
							id: `edge-${sourceNode.id}-${targetNode.id}-${Date.now()}`,
							data: {
								color: "#64748b",
								wireShape: "smoothstep",
								wireStyle: "solid"
							},
							type: "wire",
							source: sourceNode.id,
							target: targetNode.id
						});
					}
				});
			}
		} else if (aiEnhancement) {
			// Fallback for old format
			Object.entries(aiEnhancement).forEach(([compId, compData]: [string, any]) => {
				// Check if this component wasn't already processed
				const existingComponent = circuitData.circuit.components.find(c => c.id === compId);
				if (!existingComponent && compData.parameters) {
					const componentType = compData.type || 'resistor';
					const nodeId = `${componentType}_${Date.now()}_${nodeCounter++}`;
					
					let parameters = { ...defaultParams[componentType as keyof typeof defaultParams] };
					if (compData.parameters) {
						parameters = { ...parameters, ...compData.parameters };
					}

					nodes.push({
						id: nodeId,
						type: componentType,
						position: { 
							x: compData.x || (nodeCounter * 200 + 100), 
							y: compData.y || (Math.floor(nodeCounter / 4) * 150 + 100) 
						},
						data: {
							label: componentType,
							parameters: parameters
						},
						measured: {
							width: 80,
							height: 63
						},
						selected: false
					});
				}
			});
		}

		// Create edges based on wire connections
		circuitData.circuit.wires.forEach((wire, index) => {
			// Find components that should be connected based on wire positions
			// This is a simplified approach - in practice you'd need more sophisticated wire-to-component mapping
			if (index < nodes.length - 1) {
				const sourceNode = nodes[index];
				const targetNode = nodes[index + 1];
				
				edges.push({
					id: `edge-${sourceNode.id}-${targetNode.id}-${Date.now()}`,
					data: {
						color: "#64748b",
						wireShape: "smoothstep",
						wireStyle: "solid"
					},
					type: "wire",
					source: sourceNode.id,
					target: targetNode.id
				});
			}
		});

		return {
			version: "1.0",
			nodes,
			edges,
			created_at: new Date().toISOString()
		};
	}

	// Combined workflow: Circuit Recognition + Gemini Enhancement
	async function processImageWithCombinedWorkflow(image: File): Promise<string> {
		try {
			analysisProgress = 'Step 1: Detecting circuit components...';
			
			// Step 1: Use Circuit Recognition API
			const jsonResult = await circuitRecognitionAPI.recognizeCircuitWithParsing(image);
			circuitRecognitionData = jsonResult;
			
			analysisProgress = 'Step 2: Enhancing with AI analysis...';
			
			// Step 2: Augment with Gemini AI
			const enhancedCircuitData = await augmentWithGemini(jsonResult);
			generatedCircuitData = enhancedCircuitData;
			
			analysisProgress = 'Step 3: Generating SPICE netlist...';
			
			// Step 3: Generate SPICE netlist
			const spiceNetlist = circuitRecognitionAPI.convertToSpiceNetlist(jsonResult);
			
			// Automatically generate annotated image
			try {
				analysisProgress = 'Step 4: Generating debug visualization...';
				const annotatedImageBlob = await circuitRecognitionAPI.getAnnotatedImage(image);
				annotatedImageUrl = URL.createObjectURL(annotatedImageBlob);
				showAnnotatedImage = true;
			} catch (annotatedError) {
				console.warn('Failed to generate annotated image:', annotatedError);
			}
			
			return spiceNetlist;
		} catch (error: any) {
			console.error('Combined workflow error:', error);
			throw new Error(`Circuit processing failed: ${error.message || 'Unknown error'}`);
		}
	}

	// Generate annotated image with YOLO debug
	async function generateAnnotatedImage() {
		if (!selectedImage) {
			error = 'Please select an image first.';
			return;
		}

		isGeneratingAnnotatedImage = true;
		error = '';
		success = '';

		try {
			analysisProgress = 'Generating annotated image...';
			const annotatedImageBlob = await circuitRecognitionAPI.getAnnotatedImage(selectedImage);
			
			// Create URL for the annotated image
			if (annotatedImageUrl) {
				URL.revokeObjectURL(annotatedImageUrl);
			}
			annotatedImageUrl = URL.createObjectURL(annotatedImageBlob);
			showAnnotatedImage = true;
			
			success = 'Annotated image generated successfully!';
			analysisProgress = '';
		} catch (err: any) {
			error = err.message || 'Failed to generate annotated image. Please try again.';
			analysisProgress = '';
			console.error('Annotated image error:', err);
		} finally {
			isGeneratingAnnotatedImage = false;
		}
	}

	// Process the selected image
	async function processImage() {
		if (!selectedImage) {
			error = 'Please select or capture an image first.';
			return;
		}
		
		if (apiStatus === 'unavailable') {
			error = 'Circuit Recognition API is not available. Please check if the server is running on http://localhost:8000';
			return;
		}
		
		isProcessing = true;
		error = '';
		success = '';
		spiceNetlist = '';
		circuitRecognitionData = null;
		generatedCircuitData = null;
		showAnnotatedImage = false;
		if (annotatedImageUrl) {
			URL.revokeObjectURL(annotatedImageUrl);
			annotatedImageUrl = '';
		}
		analysisProgress = 'Starting combined analysis...';
		
		try {
			const netlist = await processImageWithCombinedWorkflow(selectedImage);
			spiceNetlist = netlist;
			success = 'Circuit successfully analyzed and enhanced with AI!';
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
		circuitRecognitionData = null;
		generatedCircuitData = null;
		error = '';
		success = '';
		analysisProgress = '';
		showAnnotatedImage = false;
		if (annotatedImageUrl) {
			URL.revokeObjectURL(annotatedImageUrl);
			annotatedImageUrl = '';
		}
		if (fileInput) {
			fileInput.value = '';
		}
		if (ascFileInput) {
			ascFileInput.value = '';
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

	// Save as schematic function
	async function saveSchematic() {
		if (!schematicName.trim()) {
			error = 'Please enter a schematic name.';
			return;
		}

		// Check if user is logged in
		if (!user) {
			error = 'You must be logged in to save schematics.';
			return;
		}

		if (!generatedCircuitData) {
			error = 'No circuit data available to save. Please process an image first.';
			return;
		}
		
		isSaving = true;
		error = '';
		success = '';
		
		try {
			// Use the circuit API to save to database
			const result = await circuitAPI.saveCircuit(
				schematicName,
				schematicDescription || 'Generated from Circuit Scanner with AI enhancement',
				user.id,
				generatedCircuitData.nodes,
				generatedCircuitData.edges
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
	<meta name="description" content="Transform circuit diagrams into SPICE netlists and editable schematics using combined AI analysis" />
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
				Transform circuit diagrams into SPICE netlists and editable schematics using combined AI analysis
			</p>
		</div>

		<!-- API Status -->
		{#if apiStatus === 'unavailable'}
			<Card class="mb-8 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
				<CardContent class="flex items-center gap-3 p-6">
					<div class="flex-shrink-0">
						<AlertCircle class="h-6 w-6 text-amber-600" />
					</div>
					<div>
						<p class="text-amber-700 dark:text-amber-300 font-medium">
							Circuit Recognition API is not available
						</p>
						<p class="text-sm text-amber-600 dark:text-amber-400">
							Make sure the API server is running on http://localhost:8000
						</p>
					</div>
				</CardContent>
			</Card>
		{/if}

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
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

							<Button 
								variant="outline" 
								class="h-24 flex-col gap-3 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
								onclick={() => ascFileInput?.click()}
								disabled={isProcessing}
							>
								<div class="p-2 rounded-full bg-green-500/10">
									<FileText class="h-6 w-6 text-green-600" />
								</div>
								<span class="font-medium">Upload ASC File</span>
							</Button>
						</div>

						<!-- Hidden file inputs -->
						<input
							bind:this={fileInput}
							type="file"
							accept="image/*"
							class="hidden"
							onchange={handleFileSelect}
						/>
						
						<input
							bind:this={ascFileInput}
							type="file"
							accept=".asc,text/plain"
							class="hidden"
							onchange={handleAscFileSelect}
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
											<Zap class="h-5 w-5 mr-3" />
											Analyze & Generate
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



				<!-- Generated Circuit Data -->
				{#if generatedCircuitData}
					<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
						<CardHeader class="pb-6">
							<CardTitle class="flex items-center gap-3 text-2xl">
								<div class="p-2 rounded-lg bg-blue-500/10">
									<Zap class="h-6 w-6 text-blue-600" />
								</div>
								Generated Circuit Schematic
							</CardTitle>
							<CardDescription class="text-base">
								AI-enhanced circuit data ready to save as an editable schematic
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-6">
							<!-- Circuit Summary -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-sm font-medium text-muted-foreground">Components</div>
									<div class="text-lg font-semibold">{generatedCircuitData.nodes.length}</div>
								</div>
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-sm font-medium text-muted-foreground">Connections</div>
									<div class="text-lg font-semibold">{generatedCircuitData.edges.length}</div>
								</div>
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-sm font-medium text-muted-foreground">Version</div>
									<div class="text-lg font-semibold">{generatedCircuitData.version}</div>
								</div>
							</div>

							<!-- Component Types -->
							<div class="space-y-4">
								<h4 class="font-medium text-lg">Component Types</h4>
								<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
									{#each Object.entries(generatedCircuitData.nodes.reduce((acc: Record<string, number>, node: any) => {
										const type = node.type;
										acc[type] = (acc[type] || 0) + 1;
										return acc;
									}, {})) as [type, count]}
										<div class="p-3 bg-muted/30 rounded-lg text-center">
											<div class="text-2xl font-bold text-primary">{count}</div>
											<div class="text-sm text-muted-foreground capitalize">{type}</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Sample Component Data -->
							<div class="space-y-4">
								<h4 class="font-medium text-lg">Sample Component Data</h4>
								<div class="p-4 bg-muted/30 rounded-lg">
									<pre class="text-xs text-muted-foreground overflow-x-auto">{JSON.stringify(generatedCircuitData.nodes[0], null, 2)}</pre>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex gap-3">
								<Button 
									onclick={() => showSaveDialog = true}
									class="flex-1"
									variant="default"
								>
									<Save class="h-4 w-4 mr-2" />
									Save as Schematic
								</Button>
								<Button 
									variant="outline" 
									onclick={() => {
										const jsonStr = JSON.stringify(generatedCircuitData, null, 2);
										const blob = new Blob([jsonStr], { type: 'application/json' });
										const url = URL.createObjectURL(blob);
										const a = document.createElement('a');
										a.href = url;
										a.download = 'generated-circuit-schematic.json';
										document.body.appendChild(a);
										a.click();
										document.body.removeChild(a);
										URL.revokeObjectURL(url);
									}}
									class="flex-1"
								>
									<Download class="h-4 w-4 mr-2" />
									Download JSON
								</Button>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Circuit Recognition Data -->
				{#if circuitRecognitionData}
					<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
						<CardHeader class="pb-6">
							<CardTitle class="flex items-center gap-3 text-2xl">
								<div class="p-2 rounded-lg bg-green-500/10">
									<FileText class="h-6 w-6 text-green-600" />
								</div>
								Raw Circuit Recognition Data
							</CardTitle>
							<CardDescription class="text-base">
								Structured circuit data from the recognition API
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-6">
							<!-- Processing Time -->
							{#if circuitRecognitionData.processing_time}
								<div class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
									<span class="text-sm font-medium text-green-700 dark:text-green-300">Processing Time</span>
									<Badge variant="secondary">{circuitRecognitionData.processing_time.toFixed(2)}s</Badge>
								</div>
							{/if}

							<!-- Circuit Info -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-sm font-medium text-muted-foreground">Version</div>
									<div class="text-lg font-semibold">{circuitRecognitionData.circuit.version}</div>
								</div>
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-sm font-medium text-muted-foreground">Sheet</div>
									<div class="text-lg font-semibold">#{circuitRecognitionData.circuit.sheet.number}</div>
								</div>
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-sm font-medium text-muted-foreground">Dimensions</div>
									<div class="text-lg font-semibold">{circuitRecognitionData.circuit.sheet.width}×{circuitRecognitionData.circuit.sheet.height}</div>
								</div>
							</div>

							<!-- Components Summary -->
							<div class="space-y-4">
								<h4 class="font-medium text-lg">Components Detected</h4>
								<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
									{#each Object.entries(circuitRecognitionData.circuit.components.reduce((acc: Record<string, number>, comp: any) => {
										const type = comp.type;
										acc[type] = (acc[type] || 0) + 1;
										return acc;
									}, {})) as [type, count]}
										<div class="p-3 bg-muted/30 rounded-lg text-center">
											<div class="text-2xl font-bold text-primary">{count}</div>
											<div class="text-sm text-muted-foreground capitalize">{type}</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Wires Summary -->
							<div class="space-y-4">
								<h4 class="font-medium text-lg">Connections</h4>
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-2xl font-bold text-primary">{circuitRecognitionData.circuit.wires.length}</div>
									<div class="text-sm text-muted-foreground">Wire connections detected</div>
								</div>
							</div>

							<!-- Download ASC Button -->
							<div class="flex gap-3">
								<Button 
									variant="outline" 
									onclick={() => {
										const ascResult = circuitRecognitionAPI.recognizeCircuit(selectedImage!, 'asc');
										ascResult.then(asc => {
											if (typeof asc === 'string') {
												circuitRecognitionAPI.downloadAscFile(asc, 'circuit-recognition.asc');
											}
										});
									}}
									class="flex-1"
								>
									<Download class="h-4 w-4 mr-2" />
									Download ASC File
								</Button>
								<Button 
									variant="outline" 
									onclick={() => {
										const jsonStr = JSON.stringify(circuitRecognitionData, null, 2);
										const blob = new Blob([jsonStr], { type: 'application/json' });
										const url = URL.createObjectURL(blob);
										const a = document.createElement('a');
										a.href = url;
										a.download = 'circuit-recognition-data.json';
										document.body.appendChild(a);
										a.click();
										document.body.removeChild(a);
										URL.revokeObjectURL(url);
									}}
									class="flex-1"
								>
									<Download class="h-4 w-4 mr-2" />
									Download JSON Data
								</Button>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- YOLO Debug Annotated Image -->
				{#if selectedImage}
					<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
						<CardHeader class="pb-6">
							<CardTitle class="flex items-center gap-3 text-2xl">
								<div class="p-2 rounded-lg bg-blue-500/10">
									<ImageIcon class="h-6 w-6 text-blue-600" />
								</div>
								YOLO Debug - Component Detection
							</CardTitle>
							<CardDescription class="text-base">
								View annotated image showing detected circuit components with bounding boxes and labels
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-6">
							{#if !showAnnotatedImage}
								<div class="text-center space-y-4">
									<div class="p-8 bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/25">
										<div class="space-y-4">
											<div class="p-4 rounded-full bg-blue-500/10 w-fit mx-auto">
												<ImageIcon class="h-12 w-12 text-blue-600" />
											</div>
											<div class="space-y-2">
												<p class="text-lg font-medium text-muted-foreground">No annotated image yet</p>
												<p class="text-sm text-muted-foreground/75">
													Generate an annotated image to see detected components with bounding boxes
												</p>
											</div>
										</div>
									</div>
									<Button 
										onclick={generateAnnotatedImage}
										disabled={isGeneratingAnnotatedImage || apiStatus === 'unavailable'}
										class="w-full sm:w-auto"
									>
										{#if isGeneratingAnnotatedImage}
											<Loader2 class="h-5 w-5 mr-3 animate-spin" />
											Generating...
										{:else}
											<ImageIcon class="h-5 w-5 mr-3" />
											Generate Annotated Image
										{/if}
									</Button>
								</div>
							{:else}
								<div class="space-y-4">
									<div class="relative group">
										<img 
											src={annotatedImageUrl} 
											alt="Annotated circuit with component detection" 
											class="w-full max-h-96 object-contain rounded-xl border shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
										/>
										<div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors duration-200"></div>
									</div>
									
									<div class="flex flex-col sm:flex-row gap-3">
										<Button 
											variant="outline" 
											onclick={() => {
												const a = document.createElement('a');
												a.href = annotatedImageUrl;
												a.download = 'circuit-annotated.png';
												document.body.appendChild(a);
												a.click();
												document.body.removeChild(a);
											}}
											class="flex-1"
										>
											<Download class="h-4 w-4 mr-2" />
											Download Annotated Image
										</Button>
										<Button 
											variant="outline" 
											onclick={() => {
												showAnnotatedImage = false;
												if (annotatedImageUrl) {
													URL.revokeObjectURL(annotatedImageUrl);
													annotatedImageUrl = '';
												}
											}}
											class="flex-1"
										>
											<RotateCcw class="h-4 w-4 mr-2" />
											Clear Annotated Image
										</Button>
									</div>
								</div>
							{/if}

							<!-- Information about YOLO detection -->
							<Card class="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
								<CardContent class="p-4">
									<h4 class="font-medium mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
										<Settings class="h-4 w-4" />
										What you'll see in the annotated image
									</h4>
									<ul class="space-y-1 text-sm text-blue-600 dark:text-blue-400">
										<li>• <strong>Bounding boxes</strong> around detected circuit components</li>
										<li>• <strong>Labels</strong> showing component type (resistor, capacitor, etc.)</li>
										<li>• <strong>Confidence scores</strong> for each detection</li>
										<li>• <strong>Different colors</strong> for different component types</li>
									</ul>
								</CardContent>
							</Card>
						</CardContent>
					</Card>
				{/if}
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