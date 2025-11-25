const axios = require('axios');

// Test frontend display by creating a buyer with package type
const testFrontendDisplay = async () => {
  try {
    console.log('Testing frontend display...');
    
    // Create a new buyer with package type
    const newBuyer = {
      companyName: 'Display Test Buyer',
      contactPerson: 'Display Tester',
      email: `display-${Date.now()}@test.com`,
      phoneNumber: '+1234567890',
      country: 'Displayland',
      industry: 'Testing',
      products: ['Display Product'],
      requirements: 'Testing frontend display',
      packageType: '7'
    };
    
    const createResponse = await axios.post('http://localhost:5000/api/buyers', newBuyer);
    console.log('Created buyer with packageType:', createResponse.data.packageType);
    
    // Fetch the created buyer
    const fetchResponse = await axios.get(`http://localhost:5000/api/buyers/${createResponse.data._id}`);
    console.log('Fetched buyer packageType:', fetchResponse.data.packageType);
    
    console.log('This should display as "Package 7" in the frontend.');
    console.log('Buyers without packageType show as "Not specified".');
    
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

testFrontendDisplay();