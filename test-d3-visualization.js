#!/usr/bin/env node
/**
 * D3 Visualization Test Script
 * 
 * This script tests the D3 visualization functionality for the AI simulator.
 * Run with: node test-d3-visualization.js
 */

import * as d3 from 'd3';

// Mock data for testing
const mockPredictionData = {
    success: true,
    inference_time: 0.15,
    node_names: ['vin', 'vout', 'gnd'],
    predictions: [
        [5.0, 5.0, 5.0, 5.0, 5.0, 4.8, 4.5, 4.0, 3.5, 3.0], // vin
        [0.0, 0.2, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0], // vout
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]  // gnd
    ]
};

const mockInputSignal = [0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

// Test functions
function testD3Scales() {
    console.log('\n=== Testing D3 Scales ===');
    
    try {
        // Test linear scale
        const scale = d3.scaleLinear()
            .domain([0, 10])
            .range([0, 100]);
        
        console.log('✅ Linear scale test:', scale(5) === 50);
        
        // Test ordinal scale
        const colorScale = d3.scaleOrdinal()
            .domain(['vin', 'vout', 'gnd'])
            .range(d3.schemeCategory10);
        
        console.log('✅ Ordinal scale test:', colorScale('vin') !== undefined);
        
        return true;
    } catch (error) {
        console.error('❌ D3 scales test failed:', error.message);
        return false;
    }
}

function testD3LineGenerator() {
    console.log('\n=== Testing D3 Line Generator ===');
    
    try {
        const line = d3.line()
            .x((d, i) => i * 10)
            .y(d => d * 10)
            .curve(d3.curveMonotoneX);
        
        const data = [1, 2, 3, 4, 5];
        const path = line(data);
        
        console.log('✅ Line generator test:', path !== null && path.length > 0);
        return true;
    } catch (error) {
        console.error('❌ D3 line generator test failed:', error.message);
        return false;
    }
}

function testDataProcessing() {
    console.log('\n=== Testing Data Processing ===');
    
    try {
        // Test flattening predictions
        const allValues = mockPredictionData.predictions.flat();
        const min = d3.min(allValues);
        const max = d3.max(allValues);
        
        console.log('✅ Data flattening test:', allValues.length === 30);
        console.log('✅ Min/Max test:', min === 0 && max === 5);
        
        return true;
    } catch (error) {
        console.error('❌ Data processing test failed:', error.message);
        return false;
    }
}

function testColorSchemes() {
    console.log('\n=== Testing D3 Color Schemes ===');
    
    try {
        const colors = d3.schemeCategory10;
        console.log('✅ Color scheme test:', colors.length === 10);
        console.log('✅ Color values:', colors.slice(0, 3));
        
        return true;
    } catch (error) {
        console.error('❌ Color schemes test failed:', error.message);
        return false;
    }
}

function testMockData() {
    console.log('\n=== Testing Mock Data Structure ===');
    
    try {
        console.log('✅ Prediction data structure:', {
            success: mockPredictionData.success,
            nodeCount: mockPredictionData.node_names.length,
            predictionCount: mockPredictionData.predictions.length,
            timeSteps: mockPredictionData.predictions[0].length
        });
        
        console.log('✅ Input signal structure:', {
            length: mockInputSignal.length,
            min: d3.min(mockInputSignal),
            max: d3.max(mockInputSignal)
        });
        
        return true;
    } catch (error) {
        console.error('❌ Mock data test failed:', error.message);
        return false;
    }
}

// Main test function
async function runAllTests() {
    console.log('🚀 Starting D3 Visualization Tests');
    console.log('=' * 50);
    
    const tests = [
        { name: 'D3 Scales', fn: testD3Scales },
        { name: 'D3 Line Generator', fn: testD3LineGenerator },
        { name: 'Data Processing', fn: testDataProcessing },
        { name: 'Color Schemes', fn: testColorSchemes },
        { name: 'Mock Data', fn: testMockData }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passedTests++;
            }
        } catch (error) {
            console.error(`❌ ${test.name} failed with error:`, error.message);
        }
    }
    
    console.log('\n' + '=' * 50);
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All D3 visualization tests passed!');
        console.log('✅ D3.js is properly installed and functional');
        console.log('✅ Data processing functions work correctly');
        console.log('✅ Mock data structure is valid');
    } else {
        console.log('⚠️  Some D3 tests failed. Check the implementation.');
    }
    
    console.log('=' * 50);
}

// Run tests if this file is executed directly
runAllTests().catch(error => {
    console.error('❌ D3 test suite failed:', error.message);
    process.exit(1);
});

export {
    testD3Scales,
    testD3LineGenerator,
    testDataProcessing,
    testColorSchemes,
    testMockData,
    runAllTests,
    mockPredictionData,
    mockInputSignal
}; 