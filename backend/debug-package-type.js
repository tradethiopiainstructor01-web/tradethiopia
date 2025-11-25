const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/portal', {
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Test Buyer model
    const Buyer = require('./models/Buyer');
    console.log('Buyer model loaded successfully');
    
    // Fetch all buyers and check their packageType
    const buyers = await Buyer.find();
    console.log('\n=== BUYERS ===');
    buyers.forEach((buyer, index) => {
      const hasPackageType = buyer.packageType && buyer.packageType !== '';
      console.log(`${index + 1}. ${buyer.companyName} - Package Type: ${hasPackageType ? buyer.packageType : 'NOT SET'}`);
    });
    
    // Show summary
    const buyersWithPackageType = buyers.filter(buyer => buyer.packageType && buyer.packageType !== '').length;
    console.log(`\nSummary: ${buyersWithPackageType}/${buyers.length} buyers have package types set`);
    
    // Test Seller model
    const Seller = require('./models/Seller');
    console.log('\n=== SELLERS ===');
    const sellers = await Seller.find();
    sellers.forEach((seller, index) => {
      const hasPackageType = seller.packageType && seller.packageType !== '';
      console.log(`${index + 1}. ${seller.companyName} - Package Type: ${hasPackageType ? seller.packageType : 'NOT SET'}`);
    });
    
    // Show summary
    const sellersWithPackageType = sellers.filter(seller => seller.packageType && seller.packageType !== '').length;
    console.log(`\nSummary: ${sellersWithPackageType}/${sellers.length} sellers have package types set`);
    
    process.exit(0);
  } catch (error) {
    console.error('Debug failed:', error);
    process.exit(1);
  }
});