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
    // Get models
    const Buyer = require('./models/Buyer');
    const Seller = require('./models/Seller');
    
    // Update all buyers that don't have packageType
    const buyersUpdated = await Buyer.updateMany(
      { packageType: { $exists: false } },
      { $set: { packageType: '' } }
    );
    console.log(`Updated ${buyersUpdated.modifiedCount} buyers with default packageType`);
    
    // Update all sellers that don't have packageType
    const sellersUpdated = await Seller.updateMany(
      { packageType: { $exists: false } },
      { $set: { packageType: '' } }
    );
    console.log(`Updated ${sellersUpdated.modifiedCount} sellers with default packageType`);
    
    // Verify the updates
    const buyersWithPackageType = await Buyer.countDocuments({ packageType: { $exists: true } });
    const totalBuyers = await Buyer.countDocuments();
    console.log(`Buyers with packageType: ${buyersWithPackageType}/${totalBuyers}`);
    
    const sellersWithPackageType = await Seller.countDocuments({ packageType: { $exists: true } });
    const totalSellers = await Seller.countDocuments();
    console.log(`Sellers with packageType: ${sellersWithPackageType}/${totalSellers}`);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
});