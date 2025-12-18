/**
 * Make one user the winner for a month by setting high MonthlyPerformance
 * Usage: node backend/scripts/makeWinner.js --userId=<id> --month=2025-12
 * If no userId provided, picks the first active user.
 */
const dotenv = require('dotenv');
dotenv.config();

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/user.model');
const MonthlyPerformance = require('../models/MonthlyPerformance');
const Award = require('../models/Award');
const awardEngine = require('../services/awardEngine');

const argv = require('minimist')(process.argv.slice(2));

async function makeWinner({ userId, month }) {
  await connectDB();
  try {
    let user;
    if (userId) {
      user = await User.findById(userId);
      if (!user) throw new Error('User not found: ' + userId);
    } else {
      user = await User.findOne({ status: 'active' }).sort({ _id: 1 });
      if (!user) throw new Error('No active user found to make winner');
    }

    console.log('Selected user:', user._id, user.fullName || user.username, user.role);

    // Build perf depending on role
    const role = (user.role || '').toString().toLowerCase();
    const base = { employeeId: user._id, month };

    let perfFields = {};
    if (/sales/.test(role)) {
      perfFields = { salesTarget: 100000, actualSales: 100000 };
    } else if (/it/.test(role)) {
      perfFields = { target: 40, actual: 40, taskTarget: 40, completedTasks: 40 };
    } else if (/social/.test(role)) {
      perfFields = { target: 20, actual: 20, contentTarget: 20, actualAchievements: 20 };
    } else if (/tradex|tetv|tradextv/.test(role)) {
      perfFields = { target: 10, actual: 10 };
    } else if (/customer|service|success/.test(role)) {
      perfFields = { targetServiceTime: 48, actualServiceTime: 24 };
    } else {
      // Generic high performer
      perfFields = { target: 100, actual: 100 };
    }

    // Upsert MonthlyPerformance
    const existing = await MonthlyPerformance.findOne({ employeeId: user._id, month });
    if (existing) {
      Object.assign(existing, perfFields);
      existing.department = existing.department || user.jobTitle || user.role || 'Unknown';
      await existing.save();
      console.log('Updated existing MonthlyPerformance for user');
    } else {
      const np = new MonthlyPerformance(Object.assign({}, base, { department: user.jobTitle || user.role || 'Unknown' }, perfFields));
      await np.save();
      console.log('Created MonthlyPerformance for user');
    }

    // Remove any existing awards for the month so we can recalculate
    await Award.deleteMany({ month });
    console.log('Cleared existing awards for', month);

    // Run calculation
    const results = await awardEngine.calculateForMonth(month);
    console.log('Calculation results:', results.map(r => ({ employeeId: r.employeeId, awardType: r.awardType, score: r.score })));
  } catch (err) {
    console.error('makeWinner failed:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

const month = argv.month || new Date().toISOString().slice(0,7);
const userId = argv.userId || argv.u;

makeWinner({ userId, month });
