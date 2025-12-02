require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db.js');
const User = require('../models/user.model.js');

async function seedTradexTV() {
  try {
    await connectDB();

    const email = process.env.TRADEXTV_EMAIL || 'tradextv@example.com';
    const username = process.env.TRADEXTV_USERNAME || 'tradextv';
    const password = process.env.TRADEXTV_PASSWORD || 'TestTradex123!';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`TradeXTV user already exists: ${email}`);
      await disconnectDB();
      return;
    }

    const user = new User({
      username,
      email,
      password,
      role: 'TradeXTV',
      status: 'active',
      fullName: 'TradeXTV Test User'
    });

    await user.save();
    console.log('TradeXTV test account created:');
    console.log(`  email: ${email}`);
    console.log(`  username: ${username}`);
    console.log('  password:', password);
    console.log('IMPORTANT: Change the password after first login.');

    await disconnectDB();
  } catch (err) {
    console.error('Failed to seed TradeXTV:', err);
    try { await disconnectDB(); } catch(e){}
    process.exit(1);
  }
}

if (require.main === module) {
  seedTradexTV();
}
