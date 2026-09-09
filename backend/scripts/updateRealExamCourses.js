require('dotenv').config();
const { connectDB } = require('../config/db');

async function main() {
  await connectDB();
  const Exam = require('../models/TessbinExamRecord');
  
  await Exam.updateOne({ studentId: 'TSB-2026-004' }, { $set: { courseName: 'Coffee Cupping', remarks: 'Coffee bean sensory grading evaluation' } });
  await Exam.updateOne({ studentId: 'TSB-2026-005' }, { $set: { courseName: 'Barista', remarks: 'Practical barista brewing & espresso assessment' } });
  await Exam.updateOne({ studentId: 'TSB-2026-006' }, { $set: { courseName: 'International Import and Export', remarks: 'Customs clearance & single window assessment' } });
  await Exam.updateOne({ studentId: 'TSB-2026-007' }, { $set: { courseName: 'Digital Marketing', remarks: 'Digital campaign strategy assessment' } });
  await Exam.updateOne({ studentId: 'TSB-2026-009' }, { $set: { courseName: 'Stock Marketing', remarks: 'Stock analysis & capital market evaluation' } });
  await Exam.updateOne({ studentId: 'TSB-2026-011' }, { $set: { courseName: 'Logistics', remarks: 'Freight logistics & transit documentation assessment' } });

  // Delete any other unrelated course exam records if any exist
  await Exam.deleteMany({ courseName: { $in: ['Cyber Security Essentials', 'Customer Service Excellence', 'Netpreneurship & Online Business', 'Data Science & Analytics', 'Public Speaking & Business Proposal Writing'] } });

  const records = await Exam.find({}, 'studentId studentName courseName examType status');
  console.log('CLEANED REAL EXAM RECORDS IN MONGODB:');
  console.table(records.map(r => ({ id: r.studentId, name: r.studentName, course: r.courseName, exam: r.examType, status: r.status })));
  process.exit(0);
}

main().catch(err => {
  console.error('Error updating exam courses:', err);
  process.exit(1);
});
