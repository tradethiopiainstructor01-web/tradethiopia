const axios = require('axios');

// Test the customer detail view functionality
const testCustomerDetails = async () => {
  try {
    console.log('Testing customer detail view functionality...');
    
    // Create a test buyer with package type
    const buyerResponse = await axios.post('http://localhost:5000/api/buyers', {
      companyName: 'Test Buyer Company',
      contactPerson: 'John Buyer',
      email: 'buyer' + Date.now() + '@test.com',
      phoneNumber: '+1234567890',
      country: 'USA',
      industry: 'Agriculture',
      products: ['Coffee', 'Rice'],
      requirements: 'High quality products',
      packageType: '3'
    });
    
    console.log('Created buyer with packageType:', buyerResponse.data.packageType);
    
    // Create a test seller with package type
    const sellerResponse = await axios.post('http://localhost:5000/api/sellers', {
      companyName: 'Test Seller Company',
      contactPerson: 'Jane Seller',
      email: 'seller' + Date.now() + '@test.com',
      phoneNumber: '+1234567891',
      country: 'Brazil',
      industry: 'Agriculture',
      products: ['Coffee', 'Sugar'],
      certifications: ['ISO 9001', 'Organic'],
      packageType: '5'
    });
    
    console.log('Created seller with packageType:', sellerResponse.data.packageType);
    
    // Get all buyers
    const buyersResponse = await axios.get('http://localhost:5000/api/buyers');
    console.log('Buyers count:', buyersResponse.data.length);
    
    // Get all sellers
    const sellersResponse = await axios.get('http://localhost:5000/api/sellers');
    console.log('Sellers count:', sellersResponse.data.length);
    
    // Get details for the newly created buyer
    const newBuyer = buyerResponse.data;
    console.log('New buyer details:', {
      companyName: newBuyer.companyName,
      contactPerson: newBuyer.contactPerson,
      email: newBuyer.email,
      country: newBuyer.country,
      industry: newBuyer.industry,
      packageType: newBuyer.packageType,
      products: newBuyer.products,
      requirements: newBuyer.requirements
    });
    
    // Get details for the newly created seller
    const newSeller = sellerResponse.data;
    console.log('New seller details:', {
      companyName: newSeller.companyName,
      contactPerson: newSeller.contactPerson,
      email: newSeller.email,
      country: newSeller.country,
      industry: newSeller.industry,
      packageType: newSeller.packageType,
      products: newSeller.products,
      certifications: newSeller.certifications
    });
    
    console.log('Customer detail view test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

testCustomerDetails();