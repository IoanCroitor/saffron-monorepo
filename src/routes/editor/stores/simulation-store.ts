import { writable } from 'svelte/store';
import type { SimulationResult, SimulationConfig } from '../services/simulation';

export interface SimulationRun {
    id: string;
    name: string;
    type: 'dc' | 'ac' | 'transient';
    config: SimulationConfig;
    result: SimulationResult;
    timestamp: Date;
    netlist: string;
}

interface SimulationStore {
    runs: SimulationRun[];
    isRunning: boolean;
    currentRun: SimulationRun | null;
}

// Shared simulation configurations store
export interface SimulationConfigurations {
    dc: SimulationConfig;
    ac: SimulationConfig;
    transient: SimulationConfig;
}

function createSimulationStore() {
    const { subscribe, set, update } = writable<SimulationStore>({
        runs: [],
        isRunning: false,
        currentRun: null
    });

    return {
        subscribe,
        
        addRun: (run: SimulationRun) => {
            update(store => ({
                ...store,
                runs: [run, ...store.runs], // Add new runs at the beginning
                currentRun: run
            }));
        },

        setRunning: (isRunning: boolean) => {
            update(store => ({ ...store, isRunning }));
        },

        clearRuns: () => {
            update(store => ({ ...store, runs: [], currentRun: null }));
        },

        removeRun: (id: string) => {
            update(store => ({
                ...store,
                runs: store.runs.filter(run => run.id !== id),
                currentRun: store.currentRun?.id === id ? null : store.currentRun
            }));
        },

        setCurrentRun: (run: SimulationRun | null) => {
            update(store => ({ ...store, currentRun: run }));
        }
    };
}

// Create simulation configurations store
function createSimulationConfigurationsStore() {
    const { subscribe, set, update } = writable<SimulationConfigurations>({
        dc: { type: 'dc', temperature: 27, voltage: 5 },
        ac: { type: 'ac', frequency: 1000, temperature: 27, voltage: 5 },
        transient: { type: 'transient', startTime: 0, endTime: 1, stepTime: 0.01, temperature: 27, voltage: 5 }
    });

    return {
        subscribe,
        
        updateConfig: (type: keyof SimulationConfigurations, key: keyof SimulationConfig, value: any) => {
            update(configs => ({
                ...configs,
                [type]: { ...configs[type], [key]: value }
            }));
        },

        getConfig: (type: keyof SimulationConfigurations): SimulationConfig => {
            let configs: SimulationConfigurations | undefined;
            subscribe(c => configs = c)();
            return configs?.[type] || { type: 'dc', temperature: 27, voltage: 5 };
        },

        reset: () => {
            set({
                dc: { type: 'dc', temperature: 27, voltage: 5 },
                ac: { type: 'ac', frequency: 1000, temperature: 27, voltage: 5 },
                transient: { type: 'transient', startTime: 0, endTime: 1, stepTime: 0.01, temperature: 27, voltage: 5 }
            });
        }
    };
}

export const simulationStore = createSimulationStore();
export const simulationConfigurationsStore = createSimulationConfigurationsStore(); 