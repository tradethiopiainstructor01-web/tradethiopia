const axios = require('axios');

// Test deduplication with detailed ID analysis
const testDeduplicationDetailed = async () => {
  try {
    console.log('Testing deduplication with detailed ID analysis...');
    
    // Run the matching algorithm
    const matchResponse = await axios.post('http://localhost:5000/api/b2b/match');
    
    // Look for exact duplicate buyer-seller ID pairs
    const idPairs = {};
    
    matchResponse.data.matches.forEach((match, index) => {
      const idPairKey = `${match.buyerId}-${match.sellerId}`;
      if (!idPairs[idPairKey]) {
        idPairs[idPairKey] = [];
      }
      idPairs[idPairKey].push({
        index: index + 1,
        buyerName: match.buyerName,
        sellerName: match.sellerName,
        buyerId: match.buyerId,
        sellerId: match.sellerId
      });
    });
    
    // Find duplicates
    const duplicates = Object.entries(idPairs).filter(([key, matches]) => matches.length > 1);
    
    console.log('Duplicate ID pairs found:', duplicates.length);
    
    if (duplicates.length > 0) {
      console.log('Duplicate ID pairs:');
      duplicates.forEach(([idPair, matches], index) => {
        console.log(`  ${index + 1}. ${matches[0].buyerId} <-> ${matches[0].sellerId}`);
        matches.forEach(match => {
          console.log(`    - ${match.buyerName} <-> ${match.sellerName}`);
        });
      });
    } else {
      console.log('✅ No duplicate ID pairs found! Deduplication is working correctly.');
    }
    
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

testDeduplicationDetailed();