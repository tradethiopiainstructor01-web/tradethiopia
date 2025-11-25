const axios = require('axios');

// Test the package functionality
const testPackages = async () => {
  try {
    console.log('Testing package functionality...');
    
    // Create a test buyer with packageType
    const buyerResponse = await axios.post('http://localhost:5000/api/buyers', {
      companyName: 'Test Buyer Company',
      contactPerson: 'John Buyer',
      email: 'buyer' + Date.now() + '@test.com',
      phoneNumber: '+1234567890',
      country: 'USA',
      industry: 'Agriculture',
      products: ['Coffee', 'Rice'],
      requirements: 'High quality products',
      packageType: 'Premium'
    });
    
    console.log('Created buyer with packageType:', buyerResponse.data.packageType);
    
    // Create a test seller with packageType
    const sellerResponse = await axios.post('http://localhost:5000/api/sellers', {
      companyName: 'Test Seller Company',
      contactPerson: 'Jane Seller',
      email: 'seller' + Date.now() + '@test.com',
      phoneNumber: '+1234567891',
      country: 'Brazil',
      industry: 'Agriculture',
      products: ['Coffee', 'Sugar'],
      certifications: ['ISO 9001', 'Organic'],
      packageType: 'Gold'
    });
    
    console.log('Created seller with packageType:', sellerResponse.data.packageType);
    
    // Add a detailed package to the buyer
    const buyerPackageResponse = await axios.post(`http://localhost:5000/api/buyers/${buyerResponse.data._id}/packages`, {
      packageName: 'Premium B2B Package',
      packageType: 'Premium',
      purchaseDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: 'Active'
    });
    
    console.log('Added package to buyer:', buyerPackageResponse.data.packages.length, 'packages in array');
    
    // Add a detailed package to the seller
    const sellerPackageResponse = await axios.post(`http://localhost:5000/api/sellers/${sellerResponse.data._id}/packages`, {
      packageName: 'Gold Seller Package',
      packageType: 'Gold',
      purchaseDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: 'Active'
    });
    
    console.log('Added package to seller:', sellerPackageResponse.data.packages.length, 'packages in array');
    
    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

testPackages();