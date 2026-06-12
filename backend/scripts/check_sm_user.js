require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db.js');
const User = require('../models/user.model.js');

async function checkUser() {
  try {
    await connectDB();
    const users = await User.find({
      $or: [
        { email: /social/i },
        { role: /social/i }
      ]
    });
    console.log('--- FOUND SOCIAL MEDIA USERS ---');
    users.forEach(u => {
      console.log({
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        infoStatus: u.infoStatus,
        fullName: u.fullName
      });
    });
    await disconnectDB();
  } catch (err) {
    console.error(err);
    try { await disconnectDB(); } catch(e){}
  }
}

checkUser();
