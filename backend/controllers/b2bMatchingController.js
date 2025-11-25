const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');

// Helper function to normalize product names
const normalizeProduct = (product) => {
  if (!product) return '';
  return product.toLowerCase().trim();
};

// Helper function to check if products are similar (fuzzy matching)
const areProductsSimilar = (product1, product2) => {
  const normalized1 = normalizeProduct(product1);
  const normalized2 = normalizeProduct(product2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  // Check for common variations
  const variations = [
    { pattern: /coffee.*/i, base: 'coffee' },
    { pattern: /tea.*/i, base: 'tea' },
    { pattern: /rice.*/i, base: 'rice' },
    { pattern: /wheat.*/i, base: 'wheat' },
    { pattern: /maize.*/i, base: 'maize' },
    { pattern: /corn.*/i, base: 'corn' },
    { pattern: /sugar.*/i, base: 'sugar' },
    { pattern: /salt.*/i, base: 'salt' },
    { pattern: /oil.*/i, base: 'oil' },
    { pattern: /flour.*/i, base: 'flour' },
    { pattern: /milk.*/i, base: 'milk' },
    { pattern: /meat.*/i, base: 'meat' },
    { pattern: /fish.*/i, base: 'fish' },
    { pattern: /vegetable.*/i, base: 'vegetable' },
    { pattern: /fruit.*/i, base: 'fruit' },
    { pattern: /grain.*/i, base: 'grain' },
    { pattern: /spice.*/i, base: 'spice' },
    { pattern: /herb.*/i, base: 'herb' },
    { pattern: /bean.*/i, base: 'bean' },
    { pattern: /nut.*/i, base: 'nut' }
  ];
  
  // Check if both products belong to the same category
  for (const variation of variations) {
    if (variation.pattern.test(normalized1) && variation.pattern.test(normalized2)) {
      return true;
    }
  }
  
  return false;
};

// Enhanced matching algorithm with intelligent deduplication
// Note: Packages are intentionally not used as a matching criterion
const matchBuyersAndSellers = async (req, res) => {
  try {
    const { buyerId, sellerId } = req.body;
    
    let buyers, sellers;
    
    // If specific IDs are provided, get those; otherwise get all
    if (buyerId) {
      const buyer = await Buyer.findById(buyerId);
      buyers = buyer ? [buyer] : [];
    } else {
      buyers = await Buyer.find();
    }
    
    if (sellerId) {
      const seller = await Seller.findById(sellerId);
      sellers = seller ? [seller] : [];
    } else {
      sellers = await Seller.find();
    }
    
    const matches = [];
    // Use a Map to track unique buyer-seller pairs and keep only the best match
    const uniqueMatches = new Map();
    
    // Match buyers with sellers based on industry and products
    for (const buyer of buyers) {
      for (const seller of sellers) {
        // Skip if buyer and seller are from the same company
        if (buyer.companyName === seller.companyName) {
          continue;
        }
        
        // Calculate match score
        let score = 0;
        let matchingCriteria = [];
        let matchReasons = [];
        
        // Industry match (high priority)
        if (buyer.industry.toLowerCase() === seller.industry.toLowerCase()) {
          score += 30;
          matchingCriteria.push('Industry');
          matchReasons.push(`Both are in the ${buyer.industry} industry`);
        }
        
        // Country match (medium priority)
        if (buyer.country.toLowerCase() === seller.country.toLowerCase()) {
          score += 20;
          matchingCriteria.push('Country');
          matchReasons.push(`Both are from ${buyer.country}`);
        }
        
        // Product match - what buyer wants to buy vs what seller wants to sell (highest priority)
        const matchingProducts = [];
        for (const buyerProduct of buyer.products) {
          for (const sellerProduct of seller.products) {
            if (areProductsSimilar(buyerProduct, sellerProduct)) {
              // Check if this product is already added to avoid duplicates
              if (!matchingProducts.includes(buyerProduct)) {
                matchingProducts.push(buyerProduct);
              }
            }
          }
        }
        
        if (matchingProducts.length > 0) {
          // Only consider this a match if there are product matches
          // Score based on percentage of matching products
          const productMatchPercentage = matchingProducts.length / Math.max(buyer.products.length, seller.products.length);
          score += Math.round(70 * productMatchPercentage); // Highest weight for product matching
          matchingCriteria.push('Products');
          
          // Add detailed reasons for product matches
          matchingProducts.forEach(product => {
            matchReasons.push(`Buyer wants to buy '${product}' which seller offers`);
          });
        } else {
          // No product match, so this shouldn't be considered a match
          continue;
        }
        
        // Only include matches with some relevance and must have product matches
        if (score > 0 && matchingProducts.length > 0) {
          const matchObject = {
            buyerId: buyer._id,
            buyerName: buyer.companyName,
            buyerContact: buyer.contactPerson,
            buyerEmail: buyer.email,
            sellerId: seller._id,
            sellerName: seller.companyName,
            sellerContact: seller.contactPerson,
            sellerEmail: seller.email,
            industryMatch: buyer.industry.toLowerCase() === seller.industry.toLowerCase(),
            countryMatch: buyer.country.toLowerCase() === seller.country.toLowerCase(),
            matchingProducts,
            matchingCriteria,
            matchReasons, // Detailed reasons for the match
            score: Math.min(score, 100) // Cap score at 100
          };
          
          // Create a unique key for this buyer-seller pair
          const pairKey = `${buyer._id}-${seller._id}`;
          
          // If we already have a match for this pair, keep the one with higher score
          // If scores are equal, keep the one with more matching products
          if (uniqueMatches.has(pairKey)) {
            const existingMatch = uniqueMatches.get(pairKey);
            if (matchObject.score > existingMatch.score || 
                (matchObject.score === existingMatch.score && 
                 matchObject.matchingProducts.length > existingMatch.matchingProducts.length)) {
              uniqueMatches.set(pairKey, matchObject);
            }
          } else {
            // First time seeing this pair, add it
            uniqueMatches.set(pairKey, matchObject);
          }
        }
      }
    }
    
    // Convert Map values to array
    const matchesArray = Array.from(uniqueMatches.values());
    
    // Sort matches by score (highest first), then by number of matching products (highest first)
    matchesArray.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.matchingProducts.length - a.matchingProducts.length;
    });
    
    // Limit to top 50 matches to avoid overwhelming the user
    const limitedMatches = matchesArray.slice(0, 50);
    
    console.log(`Generated ${limitedMatches.length} unique matches (reduced from ${matchesArray.length} total)`);
    
    res.status(200).json({ matches: limitedMatches });
  } catch (err) {
    console.error('Error in matchBuyersAndSellers:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get top matches for a specific buyer
// Note: Packages are intentionally not used as a matching criterion
const getTopMatchesForBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    
    const allSellers = await Seller.find();
    
    const matches = [];
    
    for (const seller of allSellers) {
      // Skip if buyer and seller are from the same company
      if (buyer.companyName === seller.companyName) {
        continue;
      }
      
      // Calculate match score
      let score = 0;
      let matchingCriteria = [];
      let matchReasons = [];
      
      // Industry match (high priority)
      if (buyer.industry.toLowerCase() === seller.industry.toLowerCase()) {
        score += 30;
        matchingCriteria.push('Industry');
        matchReasons.push(`Both are in the ${buyer.industry} industry`);
      }
      
      // Country match (medium priority)
      if (buyer.country.toLowerCase() === seller.country.toLowerCase()) {
        score += 20;
        matchingCriteria.push('Country');
        matchReasons.push(`Both are from ${buyer.country}`);
      }
      
      // Product match - what buyer wants to buy vs what seller wants to sell
      const matchingProducts = [];
      for (const buyerProduct of buyer.products) {
        for (const sellerProduct of seller.products) {
          if (areProductsSimilar(buyerProduct, sellerProduct)) {
            // Check if this product is already added to avoid duplicates
            if (!matchingProducts.includes(buyerProduct)) {
              matchingProducts.push(buyerProduct);
            }
          }
        }
      }
      
      if (matchingProducts.length > 0) {
        // Only consider this a match if there are product matches
        // Score based on percentage of matching products
        const productMatchPercentage = matchingProducts.length / Math.max(buyer.products.length, 1);
        score += Math.round(70 * productMatchPercentage); // Highest weight for product matching
        matchingCriteria.push('Products');
        
        // Add detailed reasons for product matches
        matchingProducts.forEach(product => {
          matchReasons.push(`Buyer wants to buy '${product}' which seller offers`);
        });
      } else {
        // No product match, so this shouldn't be considered a match
        continue;
      }
      
      // Only include matches with some relevance and must have product matches
      if (score > 0 && matchingProducts.length > 0) {
        matches.push({
          sellerId: seller._id,
          sellerName: seller.companyName,
          sellerContact: seller.contactPerson,
          sellerEmail: seller.email,
          sellerCountry: seller.country,
          sellerIndustry: seller.industry,
          sellerProducts: seller.products,
          matchingProducts,
          matchingCriteria,
          matchReasons, // Detailed reasons for the match
          score: Math.min(score, 100) // Cap score at 100
        });
      }
    }
    
    // Sort matches by score (highest first), then by number of matching products (highest first)
    matches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.matchingProducts.length - a.matchingProducts.length;
    });
    
    // Return top 10 matches
    res.status(200).json({ 
      buyer: {
        id: buyer._id,
        name: buyer.companyName,
        contact: buyer.contactPerson,
        email: buyer.email,
        industry: buyer.industry,
        products: buyer.products
      },
      matches: matches.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get top matches for a specific seller
// Note: Packages are intentionally not used as a matching criterion
const getTopMatchesForSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    const allBuyers = await Buyer.find();
    
    const matches = [];
    
    for (const buyer of allBuyers) {
      // Skip if buyer and seller are from the same company
      if (buyer.companyName === seller.companyName) {
        continue;
      }
      
      // Calculate match score
      let score = 0;
      let matchingCriteria = [];
      let matchReasons = [];
      
      // Industry match (high priority)
      if (buyer.industry.toLowerCase() === seller.industry.toLowerCase()) {
        score += 30;
        matchingCriteria.push('Industry');
        matchReasons.push(`Both are in the ${buyer.industry} industry`);
      }
      
      // Country match (medium priority)
      if (buyer.country.toLowerCase() === seller.country.toLowerCase()) {
        score += 20;
        matchingCriteria.push('Country');
        matchReasons.push(`Both are from ${buyer.country}`);
      }
      
      // Product match - what buyer wants to buy vs what seller wants to sell
      const matchingProducts = [];
      for (const buyerProduct of buyer.products) {
        for (const sellerProduct of seller.products) {
          if (areProductsSimilar(buyerProduct, sellerProduct)) {
            // Check if this product is already added to avoid duplicates
            if (!matchingProducts.includes(buyerProduct)) {
              matchingProducts.push(buyerProduct);
            }
          }
        }
      }
      
      if (matchingProducts.length > 0) {
        // Only consider this a match if there are product matches
        // Score based on percentage of matching products
        const productMatchPercentage = matchingProducts.length / Math.max(seller.products.length, 1);
        score += Math.round(70 * productMatchPercentage); // Highest weight for product matching
        matchingCriteria.push('Products');
        
        // Add detailed reasons for product matches
        matchingProducts.forEach(product => {
          matchReasons.push(`Buyer wants to buy '${product}' which seller offers`);
        });
      } else {
        // No product match, so this shouldn't be considered a match
        continue;
      }
      
      // Only include matches with some relevance and must have product matches
      if (score > 0 && matchingProducts.length > 0) {
        matches.push({
          buyerId: buyer._id,
          buyerName: buyer.companyName,
          buyerContact: buyer.contactPerson,
          buyerEmail: buyer.email,
          buyerCountry: buyer.country,
          buyerIndustry: buyer.industry,
          buyerProducts: buyer.products,
          matchingProducts,
          matchingCriteria,
          matchReasons, // Detailed reasons for the match
          score: Math.min(score, 100) // Cap score at 100
        });
      }
    }
    
    // Sort matches by score (highest first), then by number of matching products (highest first)
    matches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.matchingProducts.length - a.matchingProducts.length;
    });
    
    // Return top 10 matches
    res.status(200).json({ 
      seller: {
        id: seller._id,
        name: seller.companyName,
        contact: seller.contactPerson,
        email: seller.email,
        industry: seller.industry,
        products: seller.products
      },
      matches: matches.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  matchBuyersAndSellers,
  getTopMatchesForBuyer,
  getTopMatchesForSeller
};