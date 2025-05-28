/**
 * Utility functions for generating colors for collaborative editing
 */

/**
 * Generates a random vibrant color for collaborative cursors
 * Color will be distinctive but not too bright or dark
 * @returns HSL color string
 */
export function getRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65 + Math.floor(Math.random() * 20); // 65-85%
  const lightness = 55 + Math.floor(Math.random() * 15); // 55-70%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get a color for a user based on their user ID
 * This ensures the same user always gets the same color
 * @param userId User identifier 
 * @returns HSL color string
 */
export function getUserColor(userId: string): string {
  // Simple hash function to get a number from a string
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Use the hash to generate a color
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness = 55 + (Math.abs(hash) % 15); // 55-70%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generates a lighter version of a color for backgrounds
 * @param color Any valid CSS color
 * @returns Lighter version as an RGBA color string
 */
export function getLighterColor(color: string): string {
  return `${color}33`; // Add 20% opacity
}

/**
 * Determines if a color is considered dark
 * @param color HSL color string
 * @returns boolean
 */
export function isDarkColor(color: string): boolean {
  // Extract lightness from HSL
  const match = color.match(/hsl\(\s*\d+\s*,\s*\d+%\s*,\s*(\d+)%\s*\)/);
  if (match && match[1]) {
    const lightness = parseInt(match[1], 10);
    return lightness < 50;
  }
  return false;
}
