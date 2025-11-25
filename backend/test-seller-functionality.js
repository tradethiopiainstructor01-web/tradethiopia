const axios = require('axios');

async function testSellerFunctionality() {
  try {
    // Test creating a seller
    const newSeller = {
      companyName: 'Ethiopian Coffee Exporters',
      contactPerson: 'Abebe Kebede',
      email: 'abebe@coffeeexport.com',
      phoneNumber: '+251911123456',
      country: 'Ethiopia',
      industry: 'Agriculture',
      products: ['Coffee Beans', 'Coffee Products', 'Green Coffee'],
      certifications: ['ISO 9001', 'Organic Certification']
    };

    console.log('Creating a new seller...');
    const createResponse = await axios.post('http://localhost:5000/api/sellers', newSeller);
    console.log('Seller created:', createResponse.data);

    // Test creating a buyer
    const newBuyer = {
      companyName: 'International Coffee Importers',
      contactPerson: 'John Smith',
      email: 'john@coffeeimport.com',
      phoneNumber: '+1234567890',
      country: 'United States',
      industry: 'Agriculture',
      products: ['Coffee', 'Green Coffee Beans', 'Roasted Coffee'],
      requirements: 'Looking for high-quality organic coffee beans'
    };

    console.log('\nCreating a new buyer...');
    const createBuyerResponse = await axios.post('http://localhost:5000/api/buyers', newBuyer);
    console.log('Buyer created:', createBuyerResponse.data);

    // Test getting all sellers
    console.log('\nFetching all sellers...');
    const getAllSellersResponse = await axios.get('http://localhost:5000/api/sellers');
    console.log(`Found ${getAllSellersResponse.data.length} sellers`);

    // Test getting all buyers
    console.log('\nFetching all buyers...');
    const getAllBuyersResponse = await axios.get('http://localhost:5000/api/buyers');
    console.log(`Found ${getAllBuyersResponse.data.length} buyers`);

    // Test running the matching algorithm
    console.log('\nRunning B2B matching algorithm...');
    const matchResponse = await axios.post('http://localhost:5000/api/b2b/match');
    console.log(`Found ${matchResponse.data.matches.length} matches`);
    
    if (matchResponse.data.matches.length > 0) {
      console.log('Top match details:');
      console.log('- Buyer:', matchResponse.data.matches[0].buyerName);
      console.log('- Seller:', matchResponse.data.matches[0].sellerName);
      console.log('- Match Score:', matchResponse.data.matches[0].score + '%');
      console.log('- Matching Products:', matchResponse.data.matches[0].matchingProducts);
      console.log('- Match Reasons:', matchResponse.data.matches[0].matchReasons);
    }

    // Test deleting the test data
    console.log('\nCleaning up test data...');
    await axios.delete(`http://localhost:5000/api/sellers/${createResponse.data._id}`);
    await axios.delete(`http://localhost:5000/api/buyers/${createBuyerResponse.data._id}`);
    console.log('Test data cleaned up successfully');

    console.log('\nAll tests passed! The B2B functionality is working correctly.');
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
}

testSellerFunctionality();