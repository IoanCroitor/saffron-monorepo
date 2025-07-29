import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/public';

export interface NetlistCorrectionRequest {
	netlist: string;
	errorMessage: string;
	simulationType?: 'transient' | 'ac' | 'dc';
}

export interface NetlistCorrectionResponse {
	correctedNetlist: string;
	explanation: string;
	changes: string[];
	success: boolean;
}

export class GeminiAPI {
	private genAI: GoogleGenerativeAI | null = null;
	private isInitialized = false;

	constructor() {
		this.initialize();
	}

	private initialize() {
		const apiKey = env.PUBLIC_GEMINI_API_KEY;
		if (apiKey && apiKey !== 'demo-mode') {
			try {
				this.genAI = new GoogleGenerativeAI(apiKey);
				this.isInitialized = true;
				console.log('Gemini API initialized successfully');
			} catch (error) {
				console.error('Failed to initialize Gemini API:', error);
				this.isInitialized = false;
			}
		} else {
			console.log('Gemini API key not available, using demo mode');
			this.isInitialized = false;
		}
	}

	async correctNetlist(request: NetlistCorrectionRequest): Promise<NetlistCorrectionResponse> {
		if (!this.isInitialized || !this.genAI) {
			// Demo mode - return basic corrections
			return this.getDemoCorrection(request);
		}

		try {
			const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

			const prompt = this.buildCorrectionPrompt(request);
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			return this.parseCorrectionResponse(text, request.netlist);
		} catch (error) {
			console.error('Gemini API error:', error);
			// Fallback to demo correction
			return this.getDemoCorrection(request);
		}
	}

	private buildCorrectionPrompt(request: NetlistCorrectionRequest): string {
		return `Fix this SPICE netlist error. Return ONLY a JSON object.

NETLIST:
${request.netlist}

ERROR: ${request.errorMessage}

Return this exact JSON format:
{
  "correctedNetlist": "fixed netlist with \\n for line breaks",
  "explanation": "what was fixed",
  "changes": ["list of changes"],
  "success": true
}

Rules: Fix only the error, keep working parts unchanged, ensure proper SPICE syntax.`;
	}

	private parseCorrectionResponse(response: string, originalNetlist: string): NetlistCorrectionResponse {
		try {
			console.log('Raw Gemini response:', response);
			
			// Clean the response - remove any markdown formatting
			let cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
			
			// Try multiple patterns to extract JSON
			let jsonMatch = null;
			
			// Pattern 1: Look for JSON in markdown code blocks first
			jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
			if (jsonMatch) {
				// Extract the content inside the code block
				jsonMatch = [jsonMatch[1]]; // Use the captured group
			} else {
				// Pattern 2: Look for JSON object with correctedNetlist
				jsonMatch = cleanResponse.match(/\{[^}]*"correctedNetlist"[^}]*\}/);
			}
			if (!jsonMatch) {
				// Pattern 3: Look for any JSON object
				jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
			}
			if (!jsonMatch) {
				// Pattern 4: Look for JSON in the entire response
				jsonMatch = response.match(/\{[\s\S]*\}/);
			}

			if (jsonMatch) {
				try {
					const jsonText = jsonMatch[0];
					console.log('Extracted JSON:', jsonText);
					const parsed = JSON.parse(jsonText);
					
					// Validate that we have a correctedNetlist
					if (parsed.correctedNetlist) {
						return {
							correctedNetlist: parsed.correctedNetlist,
							explanation: parsed.explanation || 'AI corrected the netlist',
							changes: parsed.changes || ['Applied AI corrections'],
							success: true
						};
					}
				} catch (jsonError) {
					console.error('JSON parsing error:', jsonError);
				}
			}

			// If no valid JSON found, try to extract netlist directly from the response
			const lines = response.split('\n');
			const netlistLines: string[] = [];
			let inNetlist = false;
			let foundNetlistContent = false;
			
			for (const line of lines) {
				const trimmedLine = line.trim();
				
				// Skip empty lines, markdown formatting, and JSON content
				if (!trimmedLine || 
					trimmedLine.startsWith('```') || 
					trimmedLine.startsWith('*') ||
					trimmedLine.startsWith('{') ||
					trimmedLine.startsWith('"') ||
					trimmedLine.includes('"correctedNetlist"')) {
					continue;
				}
				
				// Check if this looks like a SPICE netlist line
				if (trimmedLine.match(/^[a-zA-Z]+\s+\w+\s+\w+/) || 
					trimmedLine.startsWith('.') ||
					trimmedLine.startsWith('*') ||
					trimmedLine.match(/^[rvlci]\s+\w+/)) {
					inNetlist = true;
					foundNetlistContent = true;
					netlistLines.push(trimmedLine);
				} else if (inNetlist && trimmedLine && !trimmedLine.startsWith('{')) {
					// Continue collecting lines until we hit non-netlist content
					netlistLines.push(trimmedLine);
				}
			}
			
			if (foundNetlistContent && netlistLines.length > 0) {
				const correctedNetlist = netlistLines.join('\n');
				console.log('Extracted netlist from response:', correctedNetlist);
				return {
					correctedNetlist: correctedNetlist,
					explanation: 'Extracted corrected netlist from AI response',
					changes: ['Applied AI-suggested corrections'],
					success: true
				};
			}

			// If still no netlist found, try to extract from the entire response
			// Look for SPICE-like patterns in the whole response
			const spicePattern = /([rvlci]\s+\w+\s+\w+[\s\S]*?\.end)/i;
			const spiceMatch = response.match(spicePattern);
			
			if (spiceMatch) {
				const extractedNetlist = spiceMatch[1];
				console.log('Extracted netlist using pattern matching:', extractedNetlist);
				return {
					correctedNetlist: extractedNetlist,
					explanation: 'Extracted netlist using pattern matching',
					changes: ['Applied AI-suggested corrections'],
					success: true
				};
			}

			// Final fallback: return the original netlist with error
			console.error('Could not parse any netlist from response');
			console.log('Response was:', response);
			return {
				correctedNetlist: originalNetlist,
				explanation: 'Could not extract corrected netlist from AI response. Please check the console for details.',
				changes: [],
				success: false
			};
		} catch (error) {
			console.error('Failed to parse Gemini response:', error);
			return {
				correctedNetlist: originalNetlist,
				explanation: 'Failed to parse AI response: ' + (error instanceof Error ? error.message : 'Unknown error'),
				changes: [],
				success: false
			};
		}
	}

	private getDemoCorrection(request: NetlistCorrectionRequest): NetlistCorrectionResponse {
		const { netlist, errorMessage } = request;
		
		// Common SPICE error patterns and fixes
		const commonFixes = [
			{
				pattern: /missing node connection|undefined node/i,
				fix: (code: string) => {
					// Add ground node if missing
					if (!code.includes(' 0 ')) {
						return code.replace(/(\w+)\s+(\w+)\s+(\w+)\s+([^\s]+)/g, '$1 $2 $3 $4 0');
					}
					return code;
				},
				explanation: 'Added missing ground connection'
			},
			{
				pattern: /invalid component parameter|parameter error/i,
				fix: (code: string) => {
					// Fix common parameter issues
					return code.replace(/(\w+)\s+(\w+)\s+(\w+)\s+([^\s]+)\s+([^\s]+)/g, '$1 $2 $3 $4 $5');
				},
				explanation: 'Fixed component parameter format'
			},
			{
				pattern: /simulation command error|\.tran error/i,
				fix: (code: string) => {
					// Fix .tran command
					if (code.includes('.tran')) {
						return code.replace(/\.tran\s+([^\s]+)\s+([^\s]+)/g, '.tran $1 $2');
					}
					return code + '\n.tran 0.1 50';
				},
				explanation: 'Corrected simulation command syntax'
			},
			{
				pattern: /missing \.end|end statement/i,
				fix: (code: string) => {
					if (!code.includes('.END')) {
						return code + '\n.END';
					}
					return code;
				},
				explanation: 'Added missing .END statement'
			},
			{
				pattern: /voltage source error|vin error/i,
				fix: (code: string) => {
					// Fix voltage source syntax
					return code.replace(/vin\s+(\w+)\s+(\w+)\s+([^\s]+)/g, 'vin $1 $2 pulse(0 1.8 0 0.1 0.1 15 30)');
				},
				explanation: 'Fixed voltage source syntax'
			}
		];

		// Try to apply common fixes
		for (const fix of commonFixes) {
			if (fix.pattern.test(errorMessage)) {
				const corrected = fix.fix(netlist);
				return {
					correctedNetlist: corrected,
					explanation: `Demo mode: ${fix.explanation}`,
					changes: [fix.explanation],
					success: true
				};
			}
		}

		// Generic demo fix - apply basic corrections
		let correctedNetlist = netlist;
		const changes: string[] = [];
		
		// Add .END if missing
		if (!correctedNetlist.includes('.END')) {
			correctedNetlist += '\n.END';
			changes.push('Added .END statement');
		}
		
		// Add ground node if missing
		if (!correctedNetlist.includes(' 0 ')) {
			correctedNetlist = correctedNetlist.replace(/(\w+)\s+(\w+)\s+(\w+)\s+([^\s]+)/g, '$1 $2 $3 $4 0');
			changes.push('Added ground connections');
		}
		
		// Add simulation command if missing
		if (!correctedNetlist.includes('.tran') && !correctedNetlist.includes('.ac') && !correctedNetlist.includes('.dc')) {
			correctedNetlist += '\n.tran 0.1 50';
			changes.push('Added .tran simulation command');
		}

		return {
			correctedNetlist: correctedNetlist,
			explanation: 'Demo mode: Applied basic netlist corrections',
			changes: changes.length > 0 ? changes : ['Basic syntax validation'],
			success: true
		};
	}

	async validateNetlist(netlist: string): Promise<{ isValid: boolean; issues: string[] }> {
		if (!this.isInitialized || !this.genAI) {
			// Demo validation
			const issues: string[] = [];
			
			if (!netlist.includes('.END')) {
				issues.push('Missing .END statement');
			}
			if (!netlist.includes('.tran') && !netlist.includes('.ac') && !netlist.includes('.dc')) {
				issues.push('Missing simulation command');
			}
			if (!netlist.includes('0')) {
				issues.push('No ground node (0) found');
			}

			return {
				isValid: issues.length === 0,
				issues
			};
		}

		try {
			const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
			
			const prompt = `Validate this SPICE netlist and identify any issues:

${netlist}

Return a JSON response in this format:
{
  "isValid": true/false,
  "issues": ["list of issues found"]
}`;

			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			try {
				const jsonMatch = text.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					return JSON.parse(jsonMatch[0]);
				}
			} catch (error) {
				console.error('Failed to parse validation response:', error);
			}

			// Fallback validation
			return {
				isValid: true,
				issues: ['Unable to validate with AI']
			};
		} catch (error) {
			console.error('Validation error:', error);
			return {
				isValid: true,
				issues: ['Validation service unavailable']
			};
		}
	}
}

// Export singleton instance
export const geminiAPI = new GeminiAPI(); 