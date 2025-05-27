/**
 * Unit conversion utilities for SPICE values
 */

const unitPrefixes: { [key: string]: number } = {
  'T': 1e12,  // Tera
  'G': 1e9,   // Giga
  'M': 1e6,   // Mega
  'k': 1e3,   // Kilo
  'm': 1e-3,  // Milli
  'u': 1e-6,  // Micro
  'n': 1e-9,  // Nano
  'p': 1e-12, // Pico
  'f': 1e-15, // Femto
  'a': 1e-18  // Atto
};

export function unitConvert2string(value: number, precision: number = 3): string {
  if (value === 0) return "0";
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  
  // Find the best unit prefix
  let bestUnit = "";
  let bestDivisor = 1;
  let bestDifference = Infinity;
  
  for (const [unit, divisor] of Object.entries(unitPrefixes)) {
    const scaledValue = absValue / divisor;
    if (scaledValue >= 1 && scaledValue < 1000) {
      const difference = Math.abs(Math.log10(scaledValue) - 1); // Prefer values around 10
      if (difference < bestDifference) {
        bestDifference = difference;
        bestUnit = unit;
        bestDivisor = divisor;
      }
    }
  }
  
  // If no good unit found, use the original value
  if (bestUnit === "") {
    return sign + absValue.toPrecision(precision);
  }
  
  const scaledValue = absValue / bestDivisor;
  return sign + scaledValue.toPrecision(precision) + bestUnit;
}

export function parseValueWithUnit(valueStr: string): number {
  const match = valueStr.match(/^([+-]?\d*\.?\d+)([a-zA-Z]*)$/);
  if (!match) {
    return parseFloat(valueStr);
  }
  
  const [, numberPart, unitPart] = match;
  const baseValue = parseFloat(numberPart);
  
  if (!unitPart) {
    return baseValue;
  }
  
  const multiplier = unitPrefixes[unitPart] || 1;
  return baseValue * multiplier;
}
