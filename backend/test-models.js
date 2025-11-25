const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Test Buyer model
    const Buyer = require('./models/Buyer');
    console.log('Buyer model loaded successfully');
    
    // Test if Buyer has the find method
    console.log('Buyer.find:', typeof Buyer.find);
    
    // Test Seller model
    const Seller = require('./models/Seller');
    console.log('Seller model loaded successfully');
    
    // Test if Seller has the find method
    console.log('Seller.find:', typeof Seller.find);
    
    // Try to fetch buyers
    const buyers = await Buyer.find();
    console.log('Buyers count:', buyers.length);
    
    // Try to fetch sellers
    const sellers = await Seller.find();
    console.log('Sellers count:', sellers.length);
    
    console.log('All tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
});