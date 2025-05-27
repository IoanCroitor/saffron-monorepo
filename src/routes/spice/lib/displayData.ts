/**
 * Display data mapping utilities for circuit simulation results
 */

import type { ResultType } from "eecircuit-engine";
import { isComplex, type ResultArrayType } from "./simulationArray";

export type ColorType = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type DisplayDataType = {
  name: string;
  index: number; // result index
  color: ColorType;
  visible: boolean;
};

const colorPalette: ColorType[] = [
  { r: 0.2, g: 0.6, b: 1.0, a: 1.0 }, // Blue
  { r: 1.0, g: 0.4, b: 0.2, a: 1.0 }, // Orange
  { r: 0.2, g: 0.8, b: 0.4, a: 1.0 }, // Green
  { r: 1.0, g: 0.2, b: 0.6, a: 1.0 }, // Pink
  { r: 0.8, g: 0.6, b: 0.2, a: 1.0 }, // Yellow
  { r: 0.6, g: 0.2, b: 1.0, a: 1.0 }, // Purple
  { r: 0.2, g: 1.0, b: 0.8, a: 1.0 }, // Cyan
  { r: 1.0, g: 0.6, b: 0.4, a: 1.0 }, // Light Orange
];

let colorIndex = 0;

export function getColor(colorMode: "light" | "dark"): ColorType {
  const color = colorPalette[colorIndex % colorPalette.length];
  colorIndex++;
  
  // Adjust colors for light/dark themes
  if (colorMode === "light") {
    return {
      r: Math.max(0.1, color.r * 0.8),
      g: Math.max(0.1, color.g * 0.8),
      b: Math.max(0.1, color.b * 0.8),
      a: color.a
    };
  }
  
  return color;
}

export function changeIntensity(color: ColorType, intensity: number): ColorType {
  return {
    r: Math.min(1.0, color.r * intensity),
    g: Math.min(1.0, color.g * intensity),
    b: Math.min(1.0, color.b * intensity),
    a: color.a
  };
}

export const mapD2W = (
  displayIndex: number,
  sweepIndex: number,
  displayDataArray: DisplayDataType[],
  resultArray: ResultArrayType
): number => {
  const offset = isComplex(resultArray) ? 2 : 1;
  return displayIndex - offset + sweepIndex * displayDataArray.length;
};

export const makeDD = (
  res: ResultType,
  colorMode: "light" | "dark"
): DisplayDataType[] => {
  const dd: DisplayDataType[] = [];
  
  // Reset color index for consistent coloring
  colorIndex = 0;
  
  if (res.dataType === "complex") {
    res.variableNames.forEach((name, index) => {
      if (index > 0) {
        const color1 = getColor(colorMode);
        dd.push({
          name: name + " (mag)",
          index: 2 * index,
          visible: true,
          color: color1,
        });
        dd.push({
          name: name + " (phase)",
          index: 2 * index + 1,
          visible: true,
          color: color1,
        });
      }
    });
  } else {
    res.variableNames.forEach((name, index) => {
      if (index > 0) {
        dd.push({
          name: name,
          index: index,
          visible: true,
          color: getColor(colorMode),
        });
      }
    });
  }

  console.log("makeDD->", dd);
  return dd;
};
