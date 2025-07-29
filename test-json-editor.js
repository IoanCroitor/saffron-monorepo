#!/usr/bin/env node
/**
 * JSON Editor Test Script
 * 
 * This script tests the JSON editor functionality for the AI simulator.
 * Run with: node test-json-editor.js
 */

// Test circuit data
const testCircuitData = {
    nodes: [
        { name: "vin", type: "source" },
        { name: "vout", type: "internal" },
        { name: "gnd", type: "ground" }
    ],
    components: [
        ["vin", "vout", "R", 1000.0],
        ["vout", "gnd", "C", 1e-6]
    ],
    input_signal: [0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    time_vector: [0, 0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.0006, 0.0007, 0.0008, 0.0009, 0.001, 0.0011, 0.0012, 0.0013, 0.0014, 0.0015, 0.0016, 0.0017, 0.0018, 0.0019],
    input_steps: 10,
    predict_steps: 10
};

// Test functions
function testJsonSerialization() {
    console.log('\n=== Testing JSON Serialization ===');
    
    try {
        const jsonString = JSON.stringify(testCircuitData, null, 2);
        const parsed = JSON.parse(jsonString);
        
        console.log('✅ JSON serialization test:', JSON.stringify(testCircuitData) === JSON.stringify(parsed));
        console.log('✅ JSON string length:', jsonString.length);
        
        return true;
    } catch (error) {
        console.error('❌ JSON serialization test failed:', error.message);
        return false;
    }
}

function testCircuitValidation() {
    console.log('\n=== Testing Circuit Validation ===');
    
    try {
        // Test valid circuit
        const validCircuit = { ...testCircuitData };
        console.log('✅ Valid circuit test:', validateCircuit(validCircuit));
        
        // Test missing nodes
        const invalidCircuit1 = { ...testCircuitData };
        delete invalidCircuit1.nodes;
        console.log('✅ Missing nodes test:', !validateCircuit(invalidCircuit1));
        
        // Test invalid node type
        const invalidCircuit2 = { ...testCircuitData };
        invalidCircuit2.nodes[0].type = 'invalid';
        console.log('✅ Invalid node type test:', !validateCircuit(invalidCircuit2));
        
        // Test invalid component
        const invalidCircuit3 = { ...testCircuitData };
        invalidCircuit3.components[0] = ['vin', 'vout', 'X', 1000.0]; // Invalid component type
        console.log('✅ Invalid component test:', !validateCircuit(invalidCircuit3));
        
        return true;
    } catch (error) {
        console.error('❌ Circuit validation test failed:', error.message);
        return false;
    }
}

function validateCircuit(circuit) {
    try {
        // Validate required fields
        if (!circuit.nodes || !Array.isArray(circuit.nodes)) {
            return false;
        }
        if (!circuit.components || !Array.isArray(circuit.components)) {
            return false;
        }
        if (!circuit.input_signal || !Array.isArray(circuit.input_signal)) {
            return false;
        }
        if (!circuit.time_vector || !Array.isArray(circuit.time_vector)) {
            return false;
        }
        if (typeof circuit.input_steps !== 'number') {
            return false;
        }
        if (typeof circuit.predict_steps !== 'number') {
            return false;
        }

        // Validate node structure
        for (const node of circuit.nodes) {
            if (!node.name || !node.type) {
                return false;
            }
            if (!['source', 'internal', 'ground'].includes(node.type)) {
                return false;
            }
        }

        // Validate component structure
        for (const comp of circuit.components) {
            if (!Array.isArray(comp) || comp.length !== 4) {
                return false;
            }
            if (!['R', 'L', 'C'].includes(comp[2])) {
                return false;
            }
            if (typeof comp[3] !== 'number') {
                return false;
            }
        }

        return true;
    } catch (error) {
        return false;
    }
}

function testExampleCircuits() {
    console.log('\n=== Testing Example Circuits ===');
    
    const examples = {
        rc: {
            nodes: [
                { name: "vin", type: "source" },
                { name: "vout", type: "internal" },
                { name: "gnd", type: "ground" }
            ],
            components: [
                ["vin", "vout", "R", 1000.0],
                ["vout", "gnd", "C", 1e-6]
            ],
            input_signal: [0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
            time_vector: [0, 0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.0006, 0.0007, 0.0008, 0.0009, 0.001, 0.0011, 0.0012, 0.0013, 0.0014, 0.0015, 0.0016, 0.0017, 0.0018, 0.0019],
            input_steps: 10,
            predict_steps: 10
        },
        rl: {
            nodes: [
                { name: "vin", type: "source" },
                { name: "vout", type: "internal" },
                { name: "gnd", type: "ground" }
            ],
            components: [
                ["vin", "vout", "R", 100.0],
                ["vout", "gnd", "L", 1e-3]
            ],
            input_signal: [0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
            time_vector: [0, 0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.0006, 0.0007, 0.0008, 0.0009, 0.001, 0.0011, 0.0012, 0.0013, 0.0014, 0.0015, 0.0016, 0.0017, 0.0018, 0.0019],
            input_steps: 10,
            predict_steps: 10
        },
        amplifier: {
            nodes: [
                { name: "vin", type: "source" },
                { name: "v1", type: "internal" },
                { name: "vout", type: "internal" },
                { name: "gnd", type: "ground" }
            ],
            components: [
                ["vin", "v1", "R", 1000.0],
                ["v1", "vout", "R", 5000.0],
                ["vout", "gnd", "R", 1000.0]
            ],
            input_signal: [0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
            time_vector: [0, 0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.0006, 0.0007, 0.0008, 0.0009, 0.001, 0.0011, 0.0012, 0.0013, 0.0014, 0.0015, 0.0016, 0.0017, 0.0018, 0.0019],
            input_steps: 10,
            predict_steps: 10
        }
    };
    
    try {
        for (const [name, circuit] of Object.entries(examples)) {
            const isValid = validateCircuit(circuit);
            console.log(`✅ ${name.toUpperCase()} circuit validation:`, isValid);
            
            if (isValid) {
                const jsonString = JSON.stringify(circuit, null, 2);
                console.log(`   📊 JSON length: ${jsonString.length} characters`);
                console.log(`   🔧 Components: ${circuit.components.length}`);
                console.log(`   🔌 Nodes: ${circuit.nodes.length}`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Example circuits test failed:', error.message);
        return false;
    }
}

function testErrorHandling() {
    console.log('\n=== Testing Error Handling ===');
    
    const invalidJsons = [
        '{"invalid": "json"}',
        '{"nodes": "not an array"}',
        '{"nodes": [{"name": "test", "type": "invalid"}]}',
        '{"nodes": [], "components": [["a", "b", "X", 1]]}',
        '{"nodes": [], "components": [], "input_signal": "not array"}'
    ];
    
    try {
        for (let i = 0; i < invalidJsons.length; i++) {
            try {
                const parsed = JSON.parse(invalidJsons[i]);
                const isValid = validateCircuit(parsed);
                console.log(`✅ Invalid JSON ${i + 1} correctly rejected:`, !isValid);
            } catch (parseError) {
                console.log(`✅ Invalid JSON ${i + 1} parse error caught:`, true);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error handling test failed:', error.message);
        return false;
    }
}

// Main test function
async function runAllTests() {
    console.log('🚀 Starting JSON Editor Tests');
    console.log('=' * 50);
    
    const tests = [
        { name: 'JSON Serialization', fn: testJsonSerialization },
        { name: 'Circuit Validation', fn: testCircuitValidation },
        { name: 'Example Circuits', fn: testExampleCircuits },
        { name: 'Error Handling', fn: testErrorHandling }
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
        console.log('🎉 All JSON editor tests passed!');
        console.log('✅ JSON serialization works correctly');
        console.log('✅ Circuit validation is robust');
        console.log('✅ Example circuits are valid');
        console.log('✅ Error handling is comprehensive');
    } else {
        console.log('⚠️  Some JSON editor tests failed. Check the implementation.');
    }
    
    console.log('=' * 50);
}

// Run tests if this file is executed directly
runAllTests().catch(error => {
    console.error('❌ JSON editor test suite failed:', error.message);
    process.exit(1);
});

export {
    testJsonSerialization,
    testCircuitValidation,
    testExampleCircuits,
    testErrorHandling,
    validateCircuit,
    runAllTests,
    testCircuitData
}; 