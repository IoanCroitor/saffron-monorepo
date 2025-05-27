/**
 * Simple test worker to verify worker creation works
 */

import * as ComLink from "comlink";

const testAPI = {
  async ping(): Promise<string> {
    return "pong from test worker";
  },

  async testEECircuit(): Promise<string> {
    try {
      const { Simulation } = await import("eecircuit-engine");
      return "eecircuit-engine imported successfully";
    } catch (error) {
      return `eecircuit-engine import failed: ${error}`;
    }
  }
};

ComLink.expose(testAPI);
