/**
 * Convenience script: find user by full name "Amanuel Andemo", upsert high MonthlyPerformance and calculate awards.
 * Usage: node backend/scripts/makeAmanuelWinner.js --month=2025-12
 */
const dotenv = require('dotenv');
dotenv.config();

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/user.model');
const MonthlyPerformance = require('../models/MonthlyPerformance');
const Award = require('../models/Award');
const awardEngine = require('../services/awardEngine');

const argv = require('minimist')(process.argv.slice(2));

async function run(month) {
  await connectDB();
  try {
    const name = 'Amanuel Andemo';
    const user = await User.findOne({ fullName: { $regex: new RegExp(name, 'i') } });
    if (!user) {
      console.error('User with fullName "Amanuel Andemo" not found. Create the user or run makeWinner with an existing userId.');
      process.exit(1);
    }

    console.log('Found user:', user._id, user.fullName || user.username, user.role);

    // set high performance based on role
    const role = (user.role || '').toString().toLowerCase();
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
      perfFields = { target: 100, actual: 100 };
    }

    const monthVal = month || new Date().toISOString().slice(0,7);

    const existing = await MonthlyPerformance.findOne({ employeeId: user._id, month: monthVal });
    if (existing) {
      Object.assign(existing, perfFields);
      existing.department = existing.department || user.jobTitle || user.role || 'Unknown';
      await existing.save();
      console.log('Updated MonthlyPerformance for', user.fullName);
    } else {
      const np = new MonthlyPerformance(Object.assign({}, { employeeId: user._id, month: monthVal, department: user.jobTitle || user.role || 'Unknown' }, perfFields));
      await np.save();
      console.log('Created MonthlyPerformance for', user.fullName);
    }

    // remove existing awards for month and recalc
    await Award.deleteMany({ month: monthVal });
    console.log('Cleared awards for', monthVal);

    const results = await awardEngine.calculateForMonth(monthVal);
    console.log('Awards published:', results.map(r => ({ employeeId: String(r.employeeId), awardType: r.awardType, score: r.score })));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

const month = argv.month || argv.m;
run(month);
