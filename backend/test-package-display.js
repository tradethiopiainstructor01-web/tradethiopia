const axios = require('axios');

// Test package type display
const testPackageDisplay = async () => {
  try {
    console.log('Testing package type display...');
    
    // Create a new buyer with package type
    const buyerData = {
      companyName: 'Package Test Buyer',
      contactPerson: 'Package Tester',
      email: `buyer-${Date.now()}@test.com`,
      phoneNumber: '+1234567890',
      country: 'USA',
      industry: 'Testing',
      products: ['Test Product'],
      requirements: 'Testing package display',
      packageType: '3'
    };
    
    const buyerResponse = await axios.post('http://localhost:5000/api/buyers', buyerData);
    console.log('Created buyer with packageType:', buyerResponse.data.packageType);
    
    // Create a new seller with package type
    const sellerData = {
      companyName: 'Package Test Seller',
      contactPerson: 'Package Tester',
      email: `seller-${Date.now()}@test.com`,
      phoneNumber: '+1234567891',
      country: 'Canada',
      industry: 'Testing',
      products: ['Test Product'],
      certifications: ['Test Cert'],
      packageType: '5'
    };
    
    const sellerResponse = await axios.post('http://localhost:5000/api/sellers', sellerData);
    console.log('Created seller with packageType:', sellerResponse.data.packageType);
    
    // Fetch the created buyer to verify package type
    const fetchedBuyer = await axios.get(`http://localhost:5000/api/buyers/${buyerResponse.data._id}`);
    console.log('Fetched buyer packageType:', fetchedBuyer.data.packageType);
    
    // Fetch the created seller to verify package type
    const fetchedSeller = await axios.get(`http://localhost:5000/api/sellers/${sellerResponse.data._id}`);
    console.log('Fetched seller packageType:', fetchedSeller.data.packageType);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

testPackageDisplay();