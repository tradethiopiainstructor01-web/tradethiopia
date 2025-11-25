const axios = require('axios');

// Verify that frontend receives correct data
const verifyFrontendData = async () => {
  try {
    console.log('Verifying frontend data...');
    
    // Create a test buyer with package type
    const testBuyer = {
      companyName: 'Frontend Verification Buyer',
      contactPerson: 'Frontend Verifier',
      email: `verify-${Date.now()}@test.com`,
      phoneNumber: '+1234567890',
      country: 'Verificationland',
      industry: 'Testing',
      products: ['Verification Product'],
      requirements: 'Verifying frontend data',
      packageType: '6'
    };
    
    // Create the buyer
    const createResponse = await axios.post('http://localhost:5000/api/buyers', testBuyer);
    console.log('Created buyer:');
    console.log('- Company Name:', createResponse.data.companyName);
    console.log('- Package Type:', createResponse.data.packageType);
    console.log('- All keys:', Object.keys(createResponse.data));
    
    // Fetch the buyer
    const fetchResponse = await axios.get(`http://localhost:5000/api/buyers/${createResponse.data._id}`);
    console.log('\nFetched buyer:');
    console.log('- Company Name:', fetchResponse.data.companyName);
    console.log('- Package Type:', fetchResponse.data.packageType);
    console.log('- Type of packageType:', typeof fetchResponse.data.packageType);
    console.log('- Is packageType truthy:', !!fetchResponse.data.packageType);
    
    // Simulate frontend display logic
    const displayText = fetchResponse.data.packageType ? `Package ${fetchResponse.data.packageType}` : 'Not specified';
    console.log('\nFrontend would display:', displayText);
    
    console.log('\n=== SUMMARY ===');
    console.log('The frontend should now display "Package 6" for this buyer.');
    console.log('For existing buyers without packageType, it will show "Not specified".');
    
  } catch (error) {
    console.error('Verification failed:', error.response ? error.response.data : error.message);
  }
};

verifyFrontendData();