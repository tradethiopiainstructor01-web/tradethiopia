const axios = require('axios');

async function verifyB2BApi() {
  try {
    console.log('Verifying B2B API endpoints...\n');
    
    // Test the main matching endpoint
    console.log('1. Testing main matching endpoint...');
    const matchResponse = await axios.post('http://localhost:5000/api/b2b/match');
    console.log(`   Found ${matchResponse.data.matches.length} matches`);
    
    if (matchResponse.data.matches.length > 0) {
      const firstMatch = matchResponse.data.matches[0];
      console.log('   First match details:');
      console.log(`   - Buyer: ${firstMatch.buyerName}`);
      console.log(`   - Seller: ${firstMatch.sellerName}`);
      console.log(`   - Score: ${firstMatch.score}%`);
      console.log(`   - Matching Products: ${JSON.stringify(firstMatch.matchingProducts)}`);
      console.log(`   - Matching Criteria: ${JSON.stringify(firstMatch.matchingCriteria)}`);
      console.log(`   - Match Reasons: ${JSON.stringify(firstMatch.matchReasons)}`);
    }
    
    // Test getting all buyers
    console.log('\n2. Testing buyers endpoint...');
    const buyersResponse = await axios.get('http://localhost:5000/api/buyers');
    console.log(`   Found ${buyersResponse.data.length} buyers`);
    
    // Test getting all sellers
    console.log('\n3. Testing sellers endpoint...');
    const sellersResponse = await axios.get('http://localhost:5000/api/sellers');
    console.log(`   Found ${sellersResponse.data.length} sellers`);
    
    console.log('\nAPI verification completed successfully!');
    
  } catch (error) {
    console.error('API verification failed:', error.response ? error.response.data : error.message);
  }
}

verifyB2BApi();