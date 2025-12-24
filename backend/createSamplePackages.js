const mongoose = require('mongoose');
const Package = require('./models/Package');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('Connected to MongoDB');

  try {
    // Create sample packages
    const samplePackages = [
      {
        packageNumber: 1,
        services: ['Consulting', 'Training'],
        price: 5000,
        description: 'Basic business package',
        market: 'Local',
      },
      {
        packageNumber: 2,
        services: ['Consulting', 'Training', 'Support'],
        price: 10000,
        description: 'Premium business package',
        market: 'Local',
      },
      {
        packageNumber: 3,
        services: ['Market Analysis', 'Business Planning'],
        price: 7500,
        description: 'Startup package',
        market: 'Local',
      }
    ];

    // Insert packages
    for (const pkg of samplePackages) {
      const existing = await Package.findOne({ packageNumber: pkg.packageNumber, market: pkg.market || 'Local' });
      if (!existing) {
        const newPackage = new Package(pkg);
        await newPackage.save();
        console.log(`Created package #${pkg.packageNumber}`);
      } else {
        console.log(`Package #${pkg.packageNumber} already exists`);
      }
    }

    console.log('Sample packages created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample packages:', error);
    process.exit(1);
  }
});
