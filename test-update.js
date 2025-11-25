const axios = require('axios');

async function testUpdate() {
  try {
    // Get all buyers
    const res = await axios.get('http://localhost:5000/api/buyers');
    const buyer = res.data[0];
    console.log('Updating buyer:', buyer.companyName);
    
    // Update the buyer with new products
    const updateData = {
      companyName: buyer.companyName,
      contactPerson: buyer.contactPerson,
      email: buyer.email,
      phoneNumber: '0987654321',
      country: buyer.country,
      industry: buyer.industry,
      products: ['Updated Product 1', 'Updated Product 2'],
      packageType: 'Premium'
    };
    
    const updateRes = await axios.put(`http://localhost:5000/api/buyers/${buyer._id}`, updateData);
    console.log('Updated buyer:', updateRes.data);
    console.log('Updated products:', updateRes.data.products);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testUpdate();