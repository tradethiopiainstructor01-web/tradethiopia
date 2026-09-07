const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://tradethiopia:1234@cluster0.epkpn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  await mongoose.connect(MONGODB_URI);
  const StudentRegistration = require('../models/StudentRegistration');
  
  const sample = await StudentRegistration.find({
    $or: [
      { fullName: /test sales22222/i },
      { fullName: /testlast/i },
      { fullName: /esubalew/i },
      { fullName: /biniyam/i }
    ]
  }).select('+passportPhoto +nationalIdFrontImage +nationalIdBackImage +paymentScreenshot').lean();

  console.log('Sample registrations found:', sample.length);
  sample.forEach(s => {
    console.log({
      id: s._id,
      studentId: s.studentId,
      fullName: s.fullName,
      paymentStatus: s.paymentStatus,
      paymentBank: s.paymentBank,
      fsNumber: s.fsNumber,
      hasPassportPhoto: Boolean(s.passportPhoto),
      hasFrontId: Boolean(s.nationalIdFrontImage || s.nationalIdImage),
      hasBackId: Boolean(s.nationalIdBackImage),
      hasSlip: Boolean(s.paymentScreenshot),
      registeredBy: s.registeredBy
    });
  });

  process.exit(0);
}

check();
