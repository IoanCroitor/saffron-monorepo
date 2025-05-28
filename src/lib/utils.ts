import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Generates a random vibrant color suitable for user cursors
 * Ensures colors are visible but not too bright
 */
export function getRandomColor(): string {
  // Generate vibrant colors with good saturation & brightness
  const h = Math.floor(Math.random() * 360); // Hue 0-360
  const s = Math.floor(60 + Math.random() * 20); // Saturation 60-80%
  const l = Math.floor(45 + Math.random() * 15); // Lightness 45-60%
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}
