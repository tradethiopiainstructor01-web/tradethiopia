const axios = require('axios');

// Test the API endpoints
const testApiEndpoints = async () => {
  try {
    console.log('Testing API endpoints...');
    
    // Test buyers endpoint
    const buyersResponse = await axios.get('http://localhost:5000/api/buyers');
    console.log('Buyers endpoint working, found', buyersResponse.data.length, 'buyers');
    
    // Test sellers endpoint
    const sellersResponse = await axios.get('http://localhost:5000/api/sellers');
    console.log('Sellers endpoint working, found', sellersResponse.data.length, 'sellers');
    
    console.log('API endpoint tests completed successfully!');
  } catch (error) {
    console.error('API test failed:', error.response ? error.response.data : error.message);
  }
};

testApiEndpoints();