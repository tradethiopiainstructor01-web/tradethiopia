const axios = require('axios');

// Test deduplication in matching with detailed analysis
const testDeduplication = async () => {
  try {
    console.log('Testing deduplication in matching...');
    
    // Run the matching algorithm
    const matchResponse = await axios.post('http://localhost:5000/api/b2b/match');
    console.log('Total matches found:', matchResponse.data.matches.length);
    
    // Check for duplicate buyer-seller pairs
    const pairCounts = {};
    const duplicates = [];
    
    matchResponse.data.matches.forEach((match, index) => {
      const pairKey = `${match.buyerId}-${match.sellerId}`;
      if (pairCounts[pairKey]) {
        pairCounts[pairKey]++;
        if (pairCounts[pairKey] === 2) {
          duplicates.push({
            buyerId: match.buyerId,
            buyerName: match.buyerName,
            sellerId: match.sellerId,
            sellerName: match.sellerName,
            count: pairCounts[pairKey]
          });
        }
      } else {
        pairCounts[pairKey] = 1;
      }
    });
    
    console.log('Duplicate pairs found:', duplicates.length);
    
    if (duplicates.length > 0) {
      console.log('Duplicates:');
      duplicates.forEach(dup => {
        console.log(`- ${dup.buyerName} <-> ${dup.sellerName} (appears ${dup.count} times)`);
      });
    } else {
      console.log('✅ No duplicates found! Deduplication is working correctly.');
    }
    
    // Show top 10 matches with detailed information
    console.log('\nTop 10 matches:');
    matchResponse.data.matches.slice(0, 10).forEach((match, index) => {
      console.log(`${index + 1}. ${match.buyerName} <-> ${match.sellerName}`);
      console.log(`   Score: ${match.score}%, Products: ${match.matchingProducts.length}, Criteria: ${match.matchingCriteria.join(', ')}`);
    });
    
    // Check for matches with identical scores and products
    const scoreProductMap = {};
    const identicalMatches = [];
    
    matchResponse.data.matches.forEach(match => {
      const signature = `${match.score}-${match.matchingProducts.length}-${match.matchingCriteria.sort().join(',')}`;
      if (scoreProductMap[signature]) {
        scoreProductMap[signature].push(match);
      } else {
        scoreProductMap[signature] = [match];
      }
    });
    
    // Find groups with more than one match having the same signature
    Object.values(scoreProductMap).forEach(group => {
      if (group.length > 1) {
        identicalMatches.push(group);
      }
    });
    
    console.log(`\nGroups of matches with identical characteristics: ${identicalMatches.length}`);
    if (identicalMatches.length > 0) {
      console.log('Identical match groups:');
      identicalMatches.slice(0, 3).forEach((group, groupIndex) => {
        console.log(`  Group ${groupIndex + 1}:`);
        group.forEach((match, matchIndex) => {
          console.log(`    ${matchIndex + 1}. ${match.buyerName} <-> ${match.sellerName} (Score: ${match.score}%)`);
        });
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

testDeduplication();