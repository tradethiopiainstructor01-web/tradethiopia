// Simple test script to verify API functionality
const axios = require('axios');

const API_URL = 'https://portal-back.vercel.app';

async function testAPI() {
  try {
    console.log('Testing root endpoint...');
    const rootResponse = await axios.get(`${API_URL}/`);
    console.log('Root endpoint response:', rootResponse.data);
    
    console.log('\nTesting health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('Health endpoint response:', healthResponse.data);
    
    console.log('\nTesting test endpoint...');
    const testResponse = await axios.get(`${API_URL}/api/test`);
    console.log('Test endpoint response:', testResponse.data);
    
    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('API Test failed:', error.response?.data || error.message);
  }
}

testAPI();