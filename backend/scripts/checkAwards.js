/**
 * Quick debug script to inspect Awards and MonthlyPerformance for a month.
 * Usage: node backend/scripts/checkAwards.js 2025-12
 */
const dotenv = require('dotenv');
dotenv.config();

const { connectDB, disconnectDB } = require('../config/db');
const Award = require('../models/Award');
const MonthlyPerformance = require('../models/MonthlyPerformance');

async function check(month) {
  if (!month) {
    console.error('Please provide month as YYYY-MM');
    process.exit(1);
  }

  await connectDB();
  try {
    const awards = await Award.find({ month }).populate('employeeId').lean();
    const perfs = await MonthlyPerformance.find({ month }).populate('employeeId').lean();

    console.log(`Found ${awards.length} award(s) for ${month}`);
    if (awards.length) console.log('Sample award:', awards[0]);

    console.log(`Found ${perfs.length} MonthlyPerformance entry(ies) for ${month}`);
    if (perfs.length) console.log('Sample perf:', perfs[0]);

    // Show counts per department
    const byDept = {};
    perfs.forEach(p => {
      const d = p.department || (p.employeeId && p.employeeId.role) || 'Unknown';
      byDept[d] = (byDept[d] || 0) + 1;
    });
    console.log('Performances by department:', byDept);
  } catch (err) {
    console.error('Error checking awards:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

const month = process.argv[2] || new Date().toISOString().slice(0,7);
check(month);
