const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://tradethiopia:1234@cluster0.epkpn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function syncNames() {
  await mongoose.connect(MONGODB_URI);
  const SC = require('../models/SalesCustomer');
  const SR = require('../models/StudentRegistration');
  
  const completed = await SC.find({ followupStatus: { $regex: /^completed$/i } }).lean();
  let count = 0;
  for (const sc of completed) {
    if (sc.studentRegistrationId) {
      await SR.findByIdAndUpdate(sc.studentRegistrationId, {
        $set: {
          fullName: sc.customerName,
          paymentStatus: 'Paid',
          paymentBank: sc.paymentBank || '',
          fsNumber: sc.fsNumber || '',
          salesFollowupStatus: 'Completed'
        }
      });
      count++;
    }
  }
  console.log(`Updated ${count} linked StudentRegistration records.`);
  
  const testRec = await SR.findOne({ fullName: /test sales22222/i }).lean();
  console.log('test sales22222 record in StudentRegistration:', testRec ? {
    id: testRec._id,
    studentId: testRec.studentId,
    fullName: testRec.fullName,
    paymentStatus: testRec.paymentStatus,
    paymentBank: testRec.paymentBank,
    fsNumber: testRec.fsNumber,
    hasPassportPhoto: Boolean(testRec.passportPhoto),
    hasFrontId: Boolean(testRec.nationalIdFrontImage || testRec.nationalIdImage),
    hasBackId: Boolean(testRec.nationalIdBackImage),
    hasSlip: Boolean(testRec.paymentScreenshot)
  } : 'Not found');

  process.exit(0);
}

syncNames();
