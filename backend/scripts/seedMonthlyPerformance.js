/**
 * Seed script to create sample MonthlyPerformance entries for active users.
 * Usage (from repo root):
 *   node backend/scripts/seedMonthlyPerformance.js 2025-12
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user.model');
const MonthlyPerformance = require('../models/MonthlyPerformance');
const { connectDB, disconnectDB } = require('../config/db');

dotenv.config();

async function seed(month) {
  if (!month) {
    console.error('Please provide a month in YYYY-MM format as an argument');
    process.exit(1);
  }

  await connectDB();

  try {
    const activeUsers = await User.find({ status: 'active' }).limit(50);
    if (!activeUsers.length) {
      console.log('No active users found to seed.');
      return;
    }

    const samples = [];
    for (const user of activeUsers) {
      const dept = user.jobTitle || user.role || 'Sales';
      // Create plausible random targets/actuals depending on department
      let target = 100;
      let actual = Math.round(Math.random() * 150);
      let taskTarget = 0;
      let completedTasks = 0;
      let contentTarget = 0;
      let actualAchievements = 0;
      let salesTarget = 50000;
      let actualSales = Math.round(Math.random() * 100000);
      let targetServiceTime = 48; // hours
      let actualServiceTime = Math.round(Math.random() * 72);

      switch ((user.role || '').toLowerCase()) {
        case 'tradextv':
        case 'tetv':
          target = 10; actual = Math.round(Math.random() * 15); break;
        case 'socialmediamanager':
        case 'socialmedia':
          target = 20;
          actual = Math.round(Math.random() * 30);
          contentTarget = target;
          actualAchievements = actual;
          break;
        case 'it':
          target = 40;
          actual = Math.round(Math.random() * 60);
          taskTarget = target;
          completedTasks = actual;
          break;
        case 'customerservice':
        case 'customersuccess':
          targetServiceTime = 48;
          actualServiceTime = Math.round(Math.random() * 72);
          break;
        case 'sales':
          salesTarget = 50000;
          actualSales = Math.round(Math.random() * 100000);
          break;
      }

      const doc = new MonthlyPerformance({
        employeeId: user._id,
        department: dept || user.role || 'Sales',
        month,
        target,
        actual,
        taskTarget,
        completedTasks,
        contentTarget,
        actualAchievements,
        salesTarget,
        actualSales,
        targetServiceTime,
        actualServiceTime,
      });

      samples.push(doc.save());
    }

    await Promise.all(samples);
    console.log(`Seeded ${samples.length} MonthlyPerformance documents for ${month}`);
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

const monthArg = process.argv[2] || new Date().toISOString().slice(0,7);
seed(monthArg);
