require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db.js');
const User = require('../models/user.model.js');

async function seedCOO() {
  try {
    await connectDB();

    const email = process.env.COO_EMAIL || 'coo@example.com';
    const username = process.env.COO_USERNAME || 'coo';
    const password = process.env.COO_PASSWORD || 'ChangeMe123!';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`COO user already exists: ${email}`);
      await disconnectDB();
      return;
    }

    const coo = new User({
      username,
      email,
      password,
      role: 'COO',
      status: 'active',
      fullName: 'Chief Operating Officer'
    });

    await coo.save();
    console.log('COO account created:');
    console.log(`  email: ${email}`);
    console.log(`  username: ${username}`);
    console.log('  password:', password);
    console.log('IMPORTANT: Change the password after first login.');

    await disconnectDB();
  } catch (err) {
    console.error('Failed to seed COO:', err);
    try { await disconnectDB(); } catch(e){}
    process.exit(1);
  }
}

if (require.main === module) {
  seedCOO();
}
