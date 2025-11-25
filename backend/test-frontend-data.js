const axios = require('axios');

// Test what the frontend is receiving
const testFrontendData = async () => {
  try {
    console.log('Testing frontend data...');
    
    // Get buyers
    const buyersResponse = await axios.get('http://localhost:5000/api/buyers');
    console.log('Buyers API response structure:');
    if (buyersResponse.data.length > 0) {
      console.log('First buyer keys:', Object.keys(buyersResponse.data[0]));
      console.log('First buyer packageType:', buyersResponse.data[0].packageType);
    }
    
    // Get sellers
    const sellersResponse = await axios.get('http://localhost:5000/api/sellers');
    console.log('\nSellers API response structure:');
    if (sellersResponse.data.length > 0) {
      console.log('First seller keys:', Object.keys(sellersResponse.data[0]));
      console.log('First seller packageType:', sellersResponse.data[0].packageType);
    }
    
    // Test creating a new buyer with package type
    console.log('\nTesting new buyer creation...');
    const newBuyer = {
      companyName: 'Frontend Test Buyer',
      contactPerson: 'Frontend Tester',
      email: `frontend-${Date.now()}@test.com`,
      phoneNumber: '+1234567890',
      country: 'Testland',
      industry: 'Testing',
      products: ['Test Product'],
      requirements: 'Testing frontend display',
      packageType: '4'
    };
    
    const createResponse = await axios.post('http://localhost:5000/api/buyers', newBuyer);
    console.log('Created buyer response keys:', Object.keys(createResponse.data));
    console.log('Created buyer packageType:', createResponse.data.packageType);
    
    // Fetch the created buyer
    const fetchResponse = await axios.get(`http://localhost:5000/api/buyers/${createResponse.data._id}`);
    console.log('Fetched buyer keys:', Object.keys(fetchResponse.data));
    console.log('Fetched buyer packageType:', fetchResponse.data.packageType);
    
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

testFrontendData();