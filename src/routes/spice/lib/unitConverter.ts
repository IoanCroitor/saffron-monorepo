
/**
 * SPICE unit conversion utilities
 */

export interface UnitDefinition {
	name: string;
	symbol: string;
	multiplier: number;
	type: UnitType;
}

export type UnitType = 'voltage' | 'current' | 'resistance' | 'capacitance' | 'inductance' | 'frequency' | 'time' | 'power' | 'energy';

// Standard SPICE unit prefixes
export const SPICE_PREFIXES: { [key: string]: number } = {
	'T': 1e12,   // Tera
	'G': 1e9,    // Giga
	'MEG': 1e6,  // Mega (SPICE specific)
	'X': 1e6,    // Mega (alternative)
	'K': 1e3,    // Kilo
	'': 1,       // Base unit
	'M': 1e-3,   // Milli
	'U': 1e-6,   // Micro (SPICE specific)
	'N': 1e-9,   // Nano
	'P': 1e-12,  // Pico
	'F': 1e-15,  // Femto
	'A': 1e-18   // Atto
};

// SI unit prefixes for display
export const SI_PREFIXES: { [key: string]: number } = {
	'T': 1e12,   // Tera
	'G': 1e9,    // Giga
	'M': 1e6,    // Mega
	'k': 1e3,    // Kilo
	'': 1,       // Base unit
	'm': 1e-3,   // Milli
	'μ': 1e-6,   // Micro
	'n': 1e-9,   // Nano
	'p': 1e-12,  // Pico
	'f': 1e-15,  // Femto
	'a': 1e-18   // Atto
};

// Base units for different quantities
export const BASE_UNITS: { [key in UnitType]: string } = {
	voltage: 'V',
	current: 'A',
	resistance: 'Ω',
	capacitance: 'F',
	inductance: 'H',
	frequency: 'Hz',
	time: 's',
	power: 'W',
	energy: 'J'
};

/**
 * Parse a SPICE value string (e.g., "1.5K", "100MEG", "10U")
 */
export function parseSpiceValue(value: string): number {
	if (typeof value === 'number') {
		return value;
	}

	// Clean the input
	const cleanValue = value.toString().trim().toUpperCase();
	
	// Handle special cases
	if (cleanValue === '' || cleanValue === 'INF' || cleanValue === 'INFINITY') {
		return Infinity;
	}
	if (cleanValue === '-INF' || cleanValue === '-INFINITY') {
		return -Infinity;
	}
	if (cleanValue === 'NAN') {
		return NaN;
	}

	// Extract numeric part and suffix
	const match = cleanValue.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)([A-Z]*)$/);
	
	if (!match) {
		// Try to parse as plain number
		const num = parseFloat(cleanValue);
		return isNaN(num) ? 0 : num;
	}

	const [, numericPart, suffix] = match;
	const baseValue = parseFloat(numericPart);
	
	if (isNaN(baseValue)) {
		return 0;
	}

	// Handle suffix
	const multiplier = SPICE_PREFIXES[suffix] ?? 1;
	return baseValue * multiplier;
}

/**
 * Format a number with appropriate SI prefix and unit
 */
export function formatWithUnit(value: number, unitType: UnitType, precision: number = 3): string {
	if (!isFinite(value)) {
		return `${value} ${BASE_UNITS[unitType]}`;
	}

	const absValue = Math.abs(value);
	const unit = BASE_UNITS[unitType];

	// Find appropriate prefix
	let bestPrefix = '';
	let bestMultiplier = 1;
	let bestScore = Math.abs(Math.log10(absValue));

	for (const [prefix, multiplier] of Object.entries(SI_PREFIXES)) {
		const scaledValue = absValue / multiplier;
		if (scaledValue >= 1 && scaledValue < 1000) {
			const score = Math.abs(Math.log10(scaledValue) - 1); // Prefer values around 10
			if (score < bestScore) {
				bestPrefix = prefix;
				bestMultiplier = multiplier;
				bestScore = score;
			}
		}
	}

	const scaledValue = value / bestMultiplier;
	const formattedValue = parseFloat(scaledValue.toPrecision(precision));
	
	return `${formattedValue} ${bestPrefix}${unit}`;
}

/**
 * Convert between different units of the same type
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
	const fromMultiplier = parseUnitMultiplier(fromUnit);
	const toMultiplier = parseUnitMultiplier(toUnit);
	
	return (value * fromMultiplier) / toMultiplier;
}

/**
 * Parse unit string to get multiplier
 */
function parseUnitMultiplier(unit: string): number {
	const cleanUnit = unit.trim();
	
	// Find the longest matching prefix
	for (const [prefix, multiplier] of Object.entries(SI_PREFIXES)) {
		if (cleanUnit.startsWith(prefix) && prefix.length > 0) {
			return multiplier;
		}
	}
	
	// Check SPICE prefixes as fallback
	for (const [prefix, multiplier] of Object.entries(SPICE_PREFIXES)) {
		if (cleanUnit.startsWith(prefix) && prefix.length > 0) {
			return multiplier;
		}
	}
	
	return 1; // Base unit
}

/**
 * Format frequency with appropriate prefix
 */
export function formatFrequency(frequency: number, precision: number = 3): string {
	return formatWithUnit(frequency, 'frequency', precision);
}

/**
 * Format time with appropriate prefix
 */
export function formatTime(time: number, precision: number = 3): string {
	return formatWithUnit(time, 'time', precision);
}

/**
 * Format voltage with appropriate prefix
 */
export function formatVoltage(voltage: number, precision: number = 3): string {
	return formatWithUnit(voltage, 'voltage', precision);
}

/**
 * Format current with appropriate prefix
 */
export function formatCurrent(current: number, precision: number = 3): string {
	return formatWithUnit(current, 'current', precision);
}

/**
 * Format resistance with appropriate prefix
 */
export function formatResistance(resistance: number, precision: number = 3): string {
	return formatWithUnit(resistance, 'resistance', precision);
}

/**
 * Format capacitance with appropriate prefix
 */
export function formatCapacitance(capacitance: number, precision: number = 3): string {
	return formatWithUnit(capacitance, 'capacitance', precision);
}

/**
 * Format inductance with appropriate prefix
 */
export function formatInductance(inductance: number, precision: number = 3): string {
	return formatWithUnit(inductance, 'inductance', precision);
}

/**
 * Format power with appropriate prefix
 */
export function formatPower(power: number, precision: number = 3): string {
	return formatWithUnit(power, 'power', precision);
}

/**
 * Auto-detect unit type from signal name
 */
export function detectUnitType(signalName: string): UnitType {
	const name = signalName.toLowerCase();
	
	if (name.startsWith('v(') || name.includes('voltage')) {
		return 'voltage';
	}
	if (name.startsWith('i(') || name.includes('current')) {
		return 'current';
	}
	if (name.includes('power')) {
		return 'power';
	}
	if (name.includes('freq')) {
		return 'frequency';
	}
	if (name.includes('time')) {
		return 'time';
	}
	if (name.includes('resistance') || name.includes('impedance')) {
		return 'resistance';
	}
	
	// Default to voltage for most signals
	return 'voltage';
}

/**
 * Format value based on auto-detected unit type
 */
export function formatAutoUnit(value: number, signalName: string, precision: number = 3): string {
	const unitType = detectUnitType(signalName);
	return formatWithUnit(value, unitType, precision);
}

/**
 * Convert SPICE value to engineering notation
 */
export function toEngineering(value: number, precision: number = 3): string {
	if (!isFinite(value)) {
		return value.toString();
	}

	if (value === 0) {
		return '0';
	}

	const absValue = Math.abs(value);
	const sign = value < 0 ? '-' : '';
	
	// Find the appropriate power of 1000
	const log1000 = Math.floor(Math.log10(absValue) / 3);
	const scaledValue = absValue / Math.pow(1000, log1000);
	
	// Format the scaled value
	const formattedValue = parseFloat(scaledValue.toPrecision(precision));
	
	// Get the appropriate suffix
	const suffixes = ['f', 'p', 'n', 'μ', 'm', '', 'k', 'M', 'G', 'T'];
	const suffixIndex = log1000 + 5; // Offset to make '' correspond to 10^0
	
	const suffix = (suffixIndex >= 0 && suffixIndex < suffixes.length) 
		? suffixes[suffixIndex] 
		: `e${log1000 * 3}`;
	
	return `${sign}${formattedValue}${suffix}`;
}

/**
 * Parse engineering notation to number
 */
export function fromEngineering(value: string): number {
	return parseSpiceValue(value);
}

/**
 * Get appropriate step size for a range
 */
export function getAppropriateStep(min: number, max: number, steps: number = 100): number {
	const range = max - min;
	const rawStep = range / steps;
	
	// Round to appropriate precision
	const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
	const normalized = rawStep / magnitude;
	
	let niceStep;
	if (normalized <= 1) {
		niceStep = 1;
	} else if (normalized <= 2) {
		niceStep = 2;
	} else if (normalized <= 5) {
		niceStep = 5;
	} else {
		niceStep = 10;
	}
	
	return niceStep * magnitude;
}

/**
 * Generate nice tick values for a range
 */
export function generateTicks(min: number, max: number, maxTicks: number = 10): number[] {
	const range = max - min;
	const step = getAppropriateStep(min, max, maxTicks);
	
	const ticks: number[] = [];
	const start = Math.ceil(min / step) * step;
	
	for (let tick = start; tick <= max; tick += step) {
		ticks.push(tick);
	}
	
	return ticks;
}

/**
 * Format tick label with appropriate precision
 */
export function formatTickLabel(value: number, unitType?: UnitType): string {
	if (unitType) {
		return formatWithUnit(value, unitType);
	}
	return toEngineering(value);
}