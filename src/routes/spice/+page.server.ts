import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    // Parse URL parameters
    const netlist = url.searchParams.get('netlist');
    const simulationName = url.searchParams.get('name') || 'Circuit Simulation';
    const example = url.searchParams.get('example');
    const theme = url.searchParams.get('theme') as 'light' | 'dark' | null;
    const plotType = url.searchParams.get('plot') as 'webgl' | 'd3' | null;
    const threads = parseInt(url.searchParams.get('threads') || '4');
    const autoRun = url.searchParams.get('autorun') === 'true';
    const showGrid = url.searchParams.get('grid') !== 'false'; // Default to true
    const showCrosshair = url.searchParams.get('crosshair') !== 'false'; // Default to true
    
    // Parse measurement mode settings
    const measurementMode = url.searchParams.get('measure') === 'true';
    const lockedSignal = url.searchParams.get('signal') || null;
    
    // Parse display settings for signals
    const visibleSignals = url.searchParams.get('signals')?.split(',').filter(Boolean) || [];
    const hiddenSignals = url.searchParams.get('hide')?.split(',').filter(Boolean) || [];
    
    // Parse simulation parameters
    const simulationType = url.searchParams.get('type') || 'transient';
    const timeStep = url.searchParams.get('step') || null;
    const endTime = url.searchParams.get('end') || null;
    
    // Parse export settings
    const exportFormat = url.searchParams.get('export') as 'csv' | 'json' | null;
    const exportFilename = url.searchParams.get('filename') || 'simulation_results';
    
    // Parse collaboration settings (if applicable)
    const collaborationId = url.searchParams.get('collab') || null;
    const readOnly = url.searchParams.get('readonly') === 'true';
    
    // Parse advanced settings
    const tolerance = url.searchParams.get('tol') || null;
    const maxIterations = parseInt(url.searchParams.get('maxiter') || '100');
    const convergenceMethod = url.searchParams.get('conv') || 'newton';
    
    // Validate and sanitize parameters
    const validatedThreads = Math.max(1, Math.min(threads, navigator?.hardwareConcurrency || 8));
    const validatedTheme = theme === 'light' || theme === 'dark' ? theme : null;
    const validatedPlotType = plotType === 'webgl' || plotType === 'd3' ? plotType : null;
    
    return {
        // Basic simulation data
        netlist: netlist || '',
        simulationName,
        example,
        
        // UI configuration
        theme: validatedTheme,
        plotType: validatedPlotType,
        showGrid,
        showCrosshair,
        
        // Simulation configuration
        threads: validatedThreads,
        autoRun,
        simulationType,
        timeStep,
        endTime,
        
        // Measurement and display settings
        measurementMode,
        lockedSignal,
        visibleSignals,
        hiddenSignals,
        
        // Export settings
        exportFormat,
        exportFilename,
        
        // Collaboration settings
        collaborationId,
        readOnly,
        
        // Advanced simulation settings
        tolerance,
        maxIterations,
        convergenceMethod,
        
        // Raw URL for reference
        url: url.toString()
    };
}; 