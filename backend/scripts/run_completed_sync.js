const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://tradethiopia:1234@cluster0.epkpn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const normalizeTimeSlot = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized.includes('afternoon')) return 'Afternoon';
  if (normalized.includes('night')) return 'Night';
  if (normalized.includes('weekend')) return 'Weekend';
  if (normalized.includes('vip')) return 'VIP';
  return 'Morning';
};

const normalizePaymentOption = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized.includes('half') || normalized === 'partial') return 'Half Payment';
  return 'Full Payment';
};

async function runSync() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const SalesCustomer = require('../models/SalesCustomer');
    const StudentRegistration = require('../models/StudentRegistration');
    const User = require('../models/user.model');

    const completedSales = await SalesCustomer.find({
      followupStatus: { $regex: /^completed$/i }
    }).lean();

    console.log(`Found ${completedSales.length} completed sales customers.`);

    let synced = 0;
    for (const sc of completedSales) {
      const customerName = (sc.customerName || '').trim();
      if (!customerName) continue;
      const email = (sc.email || '').trim().toLowerCase();
      const phone = (sc.phone || '').trim();
      const courseDept = sc.courseName || sc.productInterest || sc.contactTitle || 'General';

      const lookup = [];
      if (sc.studentRegistrationId && mongoose.Types.ObjectId.isValid(sc.studentRegistrationId)) {
        lookup.push({ _id: new mongoose.Types.ObjectId(sc.studentRegistrationId) });
      }
      if (email && email.includes('@')) lookup.push({ email });
      if (customerName && phone) lookup.push({ fullName: new RegExp(`^${customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), phone });
      if (customerName) lookup.push({ fullName: new RegExp(`^${customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

      let existing = null;
      if (lookup.length > 0) {
        existing = await StudentRegistration.findOne({ $or: lookup });
      }

      let agentName = 'Sales Followup Team';
      let agentEmail = '';
      const targetAgentId = sc.agentId || sc.assignedTo || sc.createdBy;
      if (targetAgentId && mongoose.Types.ObjectId.isValid(targetAgentId)) {
        const u = await User.findById(targetAgentId).select('fullName name username email').lean();
        if (u) {
          agentName = u.fullName || u.name || u.username || 'Sales Followup Team';
          agentEmail = u.email || '';
        }
      }

      if (!existing) {
        const prefix = 'CS-STU-';
        const latestStudent = await StudentRegistration.findOne({
          studentId: new RegExp(`^${prefix}\\d+$`)
        }).sort({ studentId: -1 }).select('studentId').lean();
        const latestNum = Number.parseInt((latestStudent?.studentId || '').replace(prefix, ''), 10) || 0;
        let nextNum = latestNum + 1;
        let nextId = `${prefix}${String(nextNum).padStart(4, '0')}`;
        while (await StudentRegistration.exists({ studentId: nextId })) {
          nextNum++;
          nextId = `${prefix}${String(nextNum).padStart(4, '0')}`;
        }

        const created = await StudentRegistration.create({
          studentId: nextId,
          fullName: customerName,
          email: email || undefined,
          phone: phone || '',
          learningDepartment: courseDept,
          program: sc.courseName || courseDept,
          enrollmentDate: sc.date || sc.createdAt || new Date(),
          preferredTimeSlot: normalizeTimeSlot(sc.schedulePreference),
          paymentOption: normalizePaymentOption(sc.paymentOption),
          paymentStatus: 'Paid',
          paymentBank: sc.paymentBank || '',
          fsNumber: sc.fsNumber || '',
          passportPhoto: sc.passportPhoto || '',
          nationalIdFrontImage: sc.nationalIdFrontImage || '',
          nationalIdImage: sc.nationalIdFrontImage || '',
          nationalIdBackImage: sc.nationalIdBackImage || '',
          paymentScreenshot: sc.paymentScreenshot || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="16">Sales Followup Receipt</text></svg>',
          salesCallStatus: sc.callStatus || 'Called',
          salesFollowupStatus: 'Completed',
          salesSchedulePreference: sc.schedulePreference || 'Regular',
          salesPackageScope: sc.packageScope || 'Local',
          salesFollowupDate: sc.date || new Date(),
          salesFollowupNote: sc.note || '',
          classCompleted: false,
          classCompletionStatus: 'Not Completed',
          cocPaymentStatus: 'Unpaid',
          status: 'Active',
          notes: sc.note || '',
          registeredBy: agentName,
          registeredByEmail: agentEmail,
          createdBy: targetAgentId && mongoose.Types.ObjectId.isValid(targetAgentId) ? new mongoose.Types.ObjectId(targetAgentId) : undefined,
          agentId: targetAgentId ? targetAgentId.toString() : undefined,
        });

        await SalesCustomer.findByIdAndUpdate(sc._id, { $set: { studentRegistrationId: created._id } });
        console.log(`Created new student ${nextId} for ${customerName}`);
        synced++;
      } else {
        const updateFields = {
          paymentStatus: 'Paid',
          salesFollowupStatus: 'Completed',
        };
        if (sc.passportPhoto) updateFields.passportPhoto = sc.passportPhoto;
        if (sc.nationalIdFrontImage) {
          updateFields.nationalIdFrontImage = sc.nationalIdFrontImage;
          updateFields.nationalIdImage = sc.nationalIdFrontImage;
        }
        if (sc.nationalIdBackImage) updateFields.nationalIdBackImage = sc.nationalIdBackImage;
        if (sc.paymentScreenshot) updateFields.paymentScreenshot = sc.paymentScreenshot;
        if (sc.paymentBank) updateFields.paymentBank = sc.paymentBank;
        if (sc.fsNumber) updateFields.fsNumber = sc.fsNumber;
        if (sc.paymentOption) updateFields.paymentOption = normalizePaymentOption(sc.paymentOption);
        if (sc.schedulePreference) updateFields.preferredTimeSlot = normalizeTimeSlot(sc.schedulePreference);
        if (sc.callStatus) updateFields.salesCallStatus = sc.callStatus;
        if (sc.note) updateFields.salesFollowupNote = sc.note;

        await StudentRegistration.findByIdAndUpdate(existing._id, { $set: updateFields });
        if (!sc.studentRegistrationId || sc.studentRegistrationId.toString() !== existing._id.toString()) {
          await SalesCustomer.findByIdAndUpdate(sc._id, { $set: { studentRegistrationId: existing._id } });
        }
        console.log(`Updated existing student ${existing.studentId} for ${customerName}`);
        synced++;
      }
    }

    console.log(`\nSuccessfully synced all ${synced} completed sales records to StudentRegistration!`);

    // Check specific user examples
    const testSales2 = await StudentRegistration.findOne({ fullName: new RegExp('test sales22222', 'i') })
      .select('+passportPhoto +nationalIdFrontImage +nationalIdBackImage +paymentScreenshot')
      .lean();
    console.log('\ntest sales22222 record in StudentRegistration:', {
      _id: testSales2?._id,
      studentId: testSales2?.studentId,
      fullName: testSales2?.fullName,
      paymentStatus: testSales2?.paymentStatus,
      paymentBank: testSales2?.paymentBank,
      fsNumber: testSales2?.fsNumber,
      hasPassportPhoto: Boolean(testSales2?.passportPhoto),
      hasFrontId: Boolean(testSales2?.nationalIdFrontImage),
      hasBackId: Boolean(testSales2?.nationalIdBackImage),
      hasPaymentScreenshot: Boolean(testSales2?.paymentScreenshot),
      registeredBy: testSales2?.registeredBy
    });

    const totalInDB = await StudentRegistration.countDocuments({});
    console.log(`Total StudentRegistration records in DB: ${totalInDB}`);

    process.exit(0);
  } catch (err) {
    console.error('Error during sync:', err);
    process.exit(1);
  }
}

runSync();
