#!/usr/bin/env node
/**
 * AI Simulator Test Script
 * 
 * This script tests the AI simulator functionality to ensure it works correctly.
 * Run with: node test-ai-simulator.js
 */

// Import the AI simulator (we'll test the core logic)
const { aiSimulator } = require('./src/lib/services/ai-simulator.ts');

// Test functions
async function testHealthCheck() {
    console.log('\n=== Testing Health Check ===');
    try {
        const health = await aiSimulator.healthCheck();
        console.log('✅ Health Check:', health.status);
        console.log('✅ Model Loaded:', health.model_loaded);
        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

async function testModelInfo() {
    console.log('\n=== Testing Model Info ===');
    try {
        const modelInfo = await aiSimulator.getModelInfo();
        console.log('✅ Model Parameters:', modelInfo.parameters.toLocaleString());
        console.log('✅ Device:', modelInfo.device);
        console.log('✅ Node Features:', modelInfo.config.node_features);
        console.log('✅ Edge Features:', modelInfo.config.edge_features);
        return true;
    } catch (error) {
        console.error('❌ Model info failed:', error.message);
        return false;
    }
}

async function testRCCircuit() {
    console.log('\n=== Testing RC Circuit ===');
    try {
        const result = await aiSimulator.testRCCircuit();
        
        if (result.success) {
            console.log('✅ RC Circuit prediction successful!');
            console.log('✅ Inference time:', result.inference_time + 's');
            console.log('✅ Node names:', result.node_names.join(', '));
            console.log('✅ Predictions shape:', result.predictions.length + ' nodes × ' + result.predictions[0].length + ' timesteps');
            
            // Show sample predictions
            console.log('📊 Sample predictions (first 5 values):');
            result.node_names.forEach((nodeName, i) => {
                console.log(`   ${nodeName}: [${result.predictions[i].slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
            });
            
            return true;
        } else {
            console.error('❌ RC Circuit prediction failed:', result.error_message);
            return false;
        }
    } catch (error) {
        console.error('❌ RC Circuit test failed:', error.message);
        return false;
    }
}

async function testRLCircuit() {
    console.log('\n=== Testing RL Circuit ===');
    try {
        const result = await aiSimulator.testRLCircuit();
        
        if (result.success) {
            console.log('✅ RL Circuit prediction successful!');
            console.log('✅ Inference time:', result.inference_time + 's');
            return true;
        } else {
            console.error('❌ RL Circuit prediction failed:', result.error_message);
            return false;
        }
    } catch (error) {
        console.error('❌ RL Circuit test failed:', error.message);
        return false;
    }
}

async function testAmplifierCircuit() {
    console.log('\n=== Testing Amplifier Circuit ===');
    try {
        const result = await aiSimulator.testAmplifierCircuit();
        
        if (result.success) {
            console.log('✅ Amplifier Circuit prediction successful!');
            console.log('✅ Inference time:', result.inference_time + 's');
            return true;
        } else {
            console.error('❌ Amplifier Circuit prediction failed:', result.error_message);
            return false;
        }
    } catch (error) {
        console.error('❌ Amplifier Circuit test failed:', error.message);
        return false;
    }
}

async function testCustomCircuit() {
    console.log('\n=== Testing Custom Circuit ===');
    
    const customCircuitData = {
        nodes: [
            { name: "vin", type: "source" },
            { name: "vout", type: "internal" },
            { name: "gnd", type: "ground" }
        ],
        components: [
            ["vin", "vout", "R", 500.0],   // 500Ω resistor
            ["vout", "gnd", "L", 2e-3]     // 2mH inductor
        ],
        input_signal: aiSimulator.generateStepSignal(15, 3),
        time_vector: aiSimulator.generateTimeVector(15, 0.001),
        input_steps: 8,
        predict_steps: 7
    };

    try {
        const result = await aiSimulator.predictCustom(customCircuitData);
        
        if (result.success) {
            console.log('✅ Custom Circuit prediction successful!');
            console.log('✅ Inference time:', result.inference_time + 's');
            console.log('✅ Node names:', result.node_names.join(', '));
            return true;
        } else {
            console.error('❌ Custom Circuit prediction failed:', result.error_message);
            return false;
        }
    } catch (error) {
        console.error('❌ Custom Circuit test failed:', error.message);
        return false;
    }
}

// Main test function
async function runAllTests() {
    console.log('🚀 Starting AI Simulator Tests');
    console.log('=' * 50);
    
    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'Model Info', fn: testModelInfo },
        { name: 'RC Circuit', fn: testRCCircuit },
        { name: 'RL Circuit', fn: testRLCircuit },
        { name: 'Amplifier Circuit', fn: testAmplifierCircuit },
        { name: 'Custom Circuit', fn: testCustomCircuit }
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
        console.log('🎉 All tests passed! The AI simulator is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the implementation and try again.');
    }
    
    console.log('=' * 50);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    });
}

module.exports = {
    testHealthCheck,
    testModelInfo,
    testRCCircuit,
    testRLCircuit,
    testAmplifierCircuit,
    testCustomCircuit,
    runAllTests
}; 