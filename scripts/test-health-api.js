#!/usr/bin/env node

/**
 * Test health check API endpoints
 */

const fetch = require('node-fetch');

const baseUrl = 'http://localhost:3000';

async function testHealthAPI() {
  console.log('🏥 Testing Health Check API...\n');

  try {
    // Test quick health check
    console.log('📊 Testing GET /api/health...');
    const quickHealthResponse = await fetch(`${baseUrl}/api/health`);
    const quickHealthData = await quickHealthResponse.json();
    
    console.log(`Status: ${quickHealthResponse.status}`);
    console.log(`Response:`, JSON.stringify(quickHealthData, null, 2));
    
    if (quickHealthResponse.status === 200) {
      console.log('✅ Quick health check passed');
    } else {
      console.log('❌ Quick health check failed');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test full health check
    console.log('📊 Testing POST /api/health...');
    const fullHealthResponse = await fetch(`${baseUrl}/api/health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const fullHealthData = await fullHealthResponse.json();
    
    console.log(`Status: ${fullHealthResponse.status}`);
    console.log(`Response:`, JSON.stringify(fullHealthData, null, 2));
    
    if (fullHealthResponse.status === 200) {
      console.log('✅ Full health check passed');
    } else {
      console.log('❌ Full health check failed');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test metrics endpoint
    console.log('📊 Testing GET /api/metrics...');
    const metricsResponse = await fetch(`${baseUrl}/api/metrics`);
    const metricsData = await metricsResponse.json();
    
    console.log(`Status: ${metricsResponse.status}`);
    console.log(`Response:`, JSON.stringify(metricsData, null, 2));
    
    if (metricsResponse.status === 200) {
      console.log('✅ Metrics endpoint passed');
    } else {
      console.log('❌ Metrics endpoint failed');
    }
    
    console.log('\n🎉 Health API testing completed!');
    
  } catch (error) {
    console.error('❌ Health API test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   npm run dev');
      console.log('   Then run this test again');
    }
  }
}

if (require.main === module) {
  testHealthAPI();
}

module.exports = { testHealthAPI };