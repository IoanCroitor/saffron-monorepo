/**
 * SimArray - Circuit simulation array management for Svelte
 */

import * as ComLink from "comlink";

// Define all types locally to avoid import issues during development
export type ParserType = {
  dc: boolean;
  sweep: boolean;
  sweepVar: string;
  sweepStart: number;
  sweepEnd: number;
  sweepStep: number;
};

export type ComplexNumber = {
  real: number;
  img: number;
};

export type RealNumber = number;

export type ComplexDataType = {
  name: string;
  type: string;
  values: ComplexNumber[];
};

export type RealDataType = {
  name: string;
  type: string;
  values: RealNumber[];
};

export type ResultType = {
  header: string;
  numVariables: number;
  variableNames: string[];
  numPoints: number;
  dataType: "real";
  data: RealDataType[];
} | {
  header: string;
  numVariables: number;
  variableNames: string[];
  numPoints: number;
  dataType: "complex";
  data: ComplexDataType[];
};

export type ResultArrayType = {
  results: ResultType[];
  sweep: number[];
};

// Local parser function to avoid import issues
function parser(netList: string): ParserType {
  const parseResults: ParserType = {
    dc: false,
    sweep: false,
    sweepVar: "",
    sweepStart: 0,
    sweepEnd: 0,
    sweepStep: 0,
  };

  const dcLine = netList.match(/^(.dc.*)/m);

  if (dcLine) {
    parseResults.dc = true;
    // Split by whitespace
    const s = dcLine[0].toString().split(/[ ]+/);
    if (s.length == 9) {
      parseResults.sweep = true;
      parseResults.sweepVar = s[5];
      parseResults.sweepStart = parseFloat(s[6]);
      parseResults.sweepEnd = parseFloat(s[7]);
      parseResults.sweepStep = parseFloat(s[8]);
    }
  }

  console.log("parser->", parseResults);
  return parseResults;
}

export class SimArray {
  private simArray: ComLink.Remote<any>[] = [];
  private netLists: string[] = [];
  private parserResult: ParserType | null = null;
  private inputNetList = "";
  private results: ResultType[] = [];
  private sweep: number[] = [];
  private threads = 1;
  private error = false;
  private progress = 0;

  constructor() {
    this.results = [];
    this.sweep = [];
    this.parserResult = null;
    this.simArray = [];
    this.threads = 1;
  }

  public async init(threadCount: number): Promise<void> {
    this.results = [];
    this.sweep = [];
    this.parserResult = null;
    this.simArray = [];
    this.threads = threadCount;
    
    console.log(`Initializing ${threadCount} simulation workers...`);
    
    for (let i = 0; i < this.threads; i++) {
      try {
        console.log(`Creating worker ${i}...`);
        const worker = new Worker(
          new URL("./simulationWorker.ts", import.meta.url),
          { type: "module" }
        );
        
        console.log(`Wrapping worker ${i} with ComLink...`);
        const simulation = ComLink.wrap<any>(worker);
        this.simArray.push(simulation);
      } catch (error) {
        console.error(`Failed to create worker ${i}:`, error);
        throw new Error(`Worker ${i} creation failed: ${error}`);
      }
    }
    
    // Start all simulation workers (like in original)
    console.log('Starting all simulation workers...');
    for (let i = 0; i < this.simArray.length; i++) {
      try {
        await this.simArray[i].start();
        console.log(`Worker ${i} started successfully`);
      } catch (error) {
        console.error(`Failed to start worker ${i}:`, error);
        throw new Error(`Worker ${i} start failed: ${error}`);
      }
    }
    
    console.log('All simulation workers initialized successfully');
  }

  public async run(netList: string): Promise<void> {
    this.inputNetList = netList;
    this.error = false;
    this.progress = 0;

    if (this.simArray.length === 0) {
      throw new Error("SimArray not initialized. Call init() first.");
    }

    try {
      const simulation = this.simArray[0];
      
      // Use the correct API: setNetList + runSim (like original)
      simulation.setNetList(netList);
      const result = await simulation.runSim();
      
      // Check for errors
      const error = await simulation.getError();
      if (error && error.length > 0) {
        throw new Error(`Simulation error: ${error.join(', ')}`);
      }
      
      this.results = [result];
      this.sweep = [];
    } catch (error) {
      this.error = true;
      console.error("Simulation error:", error);
      throw error;
    }
  }

  public async runSweep(netList: string, threads: number): Promise<void> {
    this.inputNetList = netList;
    this.error = false;
    this.progress = 0;
    this.threads = threads;

    if (this.simArray.length !== threads) {
      await this.init(threads);
    }

    try {
      // Parse the netlist to extract sweep parameters
      this.parserResult = parser(netList);
      
      if (!this.parserResult.sweep) {
        throw new Error("No sweep parameters found in netlist");
      }

      // Generate netlists for each sweep point
      this.generateNetLists();

      // Run simulations in parallel
      const promises: Promise<ResultType>[] = [];
      const workers = Math.min(this.threads, this.netLists.length);

      for (let i = 0; i < this.netLists.length; i++) {
        const workerIndex = i % workers;
        const netlistCode = this.netLists[i];
        promises.push(this.simArray[workerIndex].run(netlistCode));
      }

      this.results = await Promise.all(promises);
    } catch (error) {
      this.error = true;
      console.error("Sweep simulation error:", error);
      throw error;
    }
  }

  private generateNetLists(): void {
    if (!this.parserResult?.sweep) return;

    this.netLists = [];
    this.sweep = [];

    const { sweepVar, sweepStart, sweepEnd, sweepStep } = this.parserResult;
    let currentValue = sweepStart;

    while (currentValue <= sweepEnd) {
      this.sweep.push(currentValue);
      
      // Replace sweep variable in netlist
      const modifiedNetList = this.inputNetList.replace(
        new RegExp(`\\b${sweepVar}\\s+\\S+\\s+\\S+\\s+[^\\n]*`, 'gi'),
        (match) => {
          const parts = match.split(/\s+/);
          if (parts.length >= 4) {
            parts[3] = `DC ${currentValue}`;
          }
          return parts.join(' ');
        }
      );

      this.netLists.push(modifiedNetList);
      currentValue += sweepStep;
    }
  }

  public getResults(): ResultArrayType | null {
    if (this.results.length === 0) return null;
    return {
      results: this.results,
      sweep: this.sweep
    };
  }

  public getProgress(): number {
    return this.progress;
  }

  public hasError(): boolean {
    return this.error;
  }

  public async destroy(): Promise<void> {
    for (const sim of this.simArray) {
      try {
        await sim.destroy();
      } catch (error) {
        console.warn("Error destroying simulation worker:", error);
      }
    }
    this.simArray = [];
  }
}

export function isComplex(resultArray: ResultArrayType): boolean {
  return resultArray.results.length > 0 && 
         resultArray.results[0].dataType === "complex";
}