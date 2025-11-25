const axios = require('axios');

async function debugMatching() {
  try {
    // Get a specific buyer and seller to test
    const buyersResponse = await axios.get('http://localhost:5000/api/buyers');
    const sellersResponse = await axios.get('http://localhost:5000/api/sellers');
    
    console.log('Buyers:', buyersResponse.data.map(b => ({ 
      name: b.companyName, 
      products: b.products,
      industry: b.industry,
      country: b.country
    })));
    
    console.log('Sellers:', sellersResponse.data.map(s => ({ 
      name: s.companyName, 
      products: s.products,
      industry: s.industry,
      country: s.country
    })));
    
    // Run matching for specific buyer and seller
    if (buyersResponse.data.length > 0 && sellersResponse.data.length > 0) {
      const buyer = buyersResponse.data[0];
      const seller = sellersResponse.data[0];
      
      console.log('\nTesting match between:');
      console.log(`Buyer: ${buyer.companyName} - Products: ${buyer.products.join(', ')}`);
      console.log(`Seller: ${seller.companyName} - Products: ${seller.products.join(', ')}`);
      
      // Run specific matching
      const matchResponse = await axios.post('http://localhost:5000/api/b2b/match', {
        buyerId: buyer._id,
        sellerId: seller._id
      });
      
      console.log('\nMatch result:');
      console.log(JSON.stringify(matchResponse.data, null, 2));
    }
  } catch (error) {
    console.error('Debug failed:', error.response ? error.response.data : error.message);
  }
}

debugMatching();