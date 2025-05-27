/**
 * Web Worker for circuit simulation using eecircuit-engine
 * Simplified version based on original EEcircuit implementation
 */

import { Simulation } from "eecircuit-engine";
import * as ComLink from "comlink";

// Create simulation instance directly like in the original
const simulation = new Simulation();

// Expose the simulation instance directly
ComLink.expose(simulation);