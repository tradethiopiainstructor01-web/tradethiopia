const mongoose = require('mongoose');
const crypto = require('crypto');
const StudentRegistration = require('../models/StudentRegistration');
const TrainingFollowup = require('../models/TrainingFollowup');
const SalesCustomer = require('../models/SalesCustomer');

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const syncStudentToSalesFollowup = async (student, user) => {
  if (!student?._id) return null;
  try {
    const preferredSlot = student.preferredTimeSlot || 'Morning';
    const schedulePreference = normalizeSalesSchedulePreference(student.salesSchedulePreference || preferredSlot);
    const courseName = student.program || student.learningDepartment || '';
    const agentId = user?.id?.toString() || user?._id?.toString() || undefined;

    let createdBy = user?._id;
    if (!createdBy && user?.id && mongoose.Types.ObjectId.isValid(user.id)) {
      createdBy = new mongoose.Types.ObjectId(user.id);
    }
    if (!createdBy) {
      const User = require('../models/user.model');
      const fallbackUser = await User.findOne({}).select('_id').lean();
      createdBy = fallbackUser?._id || new mongoose.Types.ObjectId();
    }

    const updateSet = {
      customerName: student.fullName,
      contactTitle: courseName,
      phone: student.phone || '',
      email: student.email || '',
      productInterest: courseName,
      courseName,
      schedulePreference,
      packageScope: student.salesPackageScope || 'Local',
      date: student.salesFollowupDate || student.enrollmentDate || student.createdAt || new Date(),
      callStatus: student.salesCallStatus || 'Not Called',
      followupStatus: student.salesFollowupStatus || 'Pending',
      pipelineStatus: student.salesFollowupStatus === 'Completed' ? 'Closed' : 'Assigned',
      note: student.salesFollowupNote || student.notes || `Created from student registration ${student.studentId}`,
    };
    if (agentId) {
      updateSet.agentId = agentId;
    }

    return await SalesCustomer.findOneAndUpdate(
      { studentRegistrationId: student._id },
      {
        $set: updateSet,
        $setOnInsert: {
          studentRegistrationId: student._id,
          createdBy,
          source: 'Sales',
          assignedBy: createdBy,
          assignedAt: new Date(),
          coursePrice: 0,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error('Error syncing student registration to SalesCustomer:', err);
    return null;
  }
};

const syncStudentToTrainingFollowup = async (student) => {
  if (!student) return;
  try {
    const studentId = student.studentId ? String(student.studentId).trim() : '';
    const email = student.email ? String(student.email).trim() : '';
    const customerName = student.fullName ? String(student.fullName).trim() : '';

    const query = [];
    if (studentId) query.push({ idInfo: studentId });
    if (email && customerName) query.push({ email, customerName });
    if (customerName) query.push({ customerName, trainingType: student.learningDepartment });

    let followup = null;
    if (query.length > 0) {
      followup = await TrainingFollowup.findOne({ $or: query });
    }

    let realSalesAgent = student.salesPerson || student.salesAgent || '';
    if (!realSalesAgent) {
      try {
        const SalesCustomer = require('../models/SalesCustomer');
        const User = require('../models/user.model');
        const scQuery = [];
        if (email) scQuery.push({ email: new RegExp(`^${escapeRegExp(email)}$`, 'i') });
        if (customerName) scQuery.push({ customerName: new RegExp(`^${escapeRegExp(customerName)}$`, 'i') });
        if (student.phone) scQuery.push({ phone: new RegExp(`^${escapeRegExp(student.phone)}$`, 'i') });
        if (scQuery.length > 0) {
          const matchedSC = await SalesCustomer.findOne({ $or: scQuery }).lean();
          if (matchedSC?.agentId) {
            const user = await User.findById(matchedSC.agentId).select('name fullName username').lean();
            if (user) {
              realSalesAgent = user.fullName || user.name || user.username || '';
            }
          }
        }
      } catch (scErr) {
        console.warn('Could not lookup sales agent for student:', scErr.message);
      }
    }

    const payload = {
      customerName,
      email,
      phoneNumber: student.phone || '',
      trainingType: student.learningDepartment || student.program || 'General',
      scheduleShift: student.preferredTimeSlot || 'Morning',
      startDate: student.enrollmentDate || student.createdAt || new Date(),
      endDate: student.trainingEndDate || student.examDate || null,
      progress: 'Completed', // Marked as Completed so student appears in All TESBINN Users tab
      idInfo: studentId,
      agentName: student.registeredBy || 'Customer Success',
      salesAgent: realSalesAgent || (followup?.salesAgent && !/test-cs|customerservice|customer\s*success/i.test(followup.salesAgent) ? followup.salesAgent : ''),
      paymentAmount: student.paymentAmount || 0,
      totalAmount: student.totalAmount || 0,
      paymentOption: (student.paymentOption || '').toLowerCase().includes('half') ? 'partial' : 'full',
      materialStatus: 'Not Delivered',
      packageStatus: student.status || 'Active',
    };

    if (followup) {
      await TrainingFollowup.findByIdAndUpdate(followup._id, { $set: payload });
    } else {
      await TrainingFollowup.create(payload);
    }
  } catch (err) {
    console.error('Error syncing student registration to TrainingFollowup:', err);
  }
};

const syncAllFollowupStudentsToRegistrations = async () => {
  let createdCount = 0;
  let updatedCount = 0;
  let totalProcessed = 0;

  try {
    const SalesCustomer = require('../models/SalesCustomer');
    const CustomerFollowUp = require('../models/customerFollowUp');

    // 1. Sync from TrainingFollowup
    const followups = await TrainingFollowup.find({}).lean();
    for (const f of followups) {
      totalProcessed++;
      const customerName = (f.customerName || '').trim();
      if (!customerName) continue;
      const email = (f.email || '').trim().toLowerCase();
      const phone = (f.phoneNumber || '').trim();
      const idInfo = (f.idInfo || '').trim();

      const query = [];
      if (idInfo) query.push({ studentId: idInfo });
      if (email && email.includes('@')) query.push({ email });
      if (customerName && phone) query.push({ fullName: new RegExp(`^${escapeRegExp(customerName)}$`, 'i'), phone });
      if (customerName) query.push({ fullName: new RegExp(`^${escapeRegExp(customerName)}$`, 'i'), learningDepartment: f.trainingType || 'General' });

      let existing = null;
      if (query.length > 0) {
        existing = await StudentRegistration.findOne({ $or: query });
      }

      const learningDepartment = f.trainingType || 'General';
      const isCompleted = (f.progress || '').toLowerCase() === 'completed';
      const scheduleShift = normalizeTimeSlot(f.scheduleShift);
      const isHalf = (f.paymentOption || '').toLowerCase().includes('half') || f.paymentOption === 'partial';

      if (!existing) {
        const studentId = (idInfo && !await StudentRegistration.exists({ studentId: idInfo }))
          ? idInfo
          : await generateStudentId();

        await StudentRegistration.create({
          studentId,
          fullName: customerName,
          email: email || undefined,
          phone: phone || '',
          learningDepartment,
          program: f.trainingType || learningDepartment,
          enrollmentDate: parseDate(f.startDate) || f.createdAt || new Date(),
          trainingEndDate: parseDate(f.endDate) || null,
          preferredTimeSlot: scheduleShift,
          paymentOption: isHalf ? 'Half Payment' : 'Full Payment',
          paymentStatus: isCompleted || (f.paymentAmount && f.paymentAmount > 0) ? 'Paid' : 'Waiting',
          classCompleted: isCompleted,
          classCompletionStatus: isCompleted ? 'Completed' : 'Not Completed',
          cocPaymentStatus: isCoffeeCuppingRegistration({ learningDepartment }) ? 'Unpaid' : 'Unpaid',
          status: f.packageStatus || (isCompleted ? 'Completed' : 'Active'),
          notes: f.specialRequirements || f.previousTraining || '',
          registeredBy: f.agentName || 'Customer Success',
          paymentScreenshot: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="16">Followup Verified Receipt</text></svg>',
        });
        createdCount++;

        // Update TrainingFollowup idInfo if not already set
        if (!f.idInfo || f.idInfo !== studentId) {
          await TrainingFollowup.findByIdAndUpdate(f._id, { $set: { idInfo: studentId } });
        }
      } else {
        // Sync any missing or updated info
        const updateFields = {};
        if (!existing.phone && phone) updateFields.phone = phone;
        if (!existing.email && email) updateFields.email = email;
        if ((!existing.learningDepartment || existing.learningDepartment === 'General') && learningDepartment !== 'General') {
          updateFields.learningDepartment = learningDepartment;
          updateFields.program = learningDepartment;
        }
        if (isCompleted && !existing.classCompleted) {
          updateFields.classCompleted = true;
          updateFields.classCompletionStatus = 'Completed';
        }
        if (Object.keys(updateFields).length > 0) {
          await StudentRegistration.findByIdAndUpdate(existing._id, { $set: updateFields });
          updatedCount++;
        }
        if (!f.idInfo || f.idInfo !== existing.studentId) {
          await TrainingFollowup.findByIdAndUpdate(f._id, { $set: { idInfo: existing.studentId } });
        }
      }
    }

    // Use the same identity-safe matching as the sales completion endpoint.
    const salesCustomers = await SalesCustomer.find({ followupStatus: /^completed$/i });
    const { syncSalesCustomerToStudentRegistration } = require('./salesCustomerController');
    for (const sale of salesCustomers) {
      totalProcessed++;
      const hadRegistration = Boolean(sale.studentRegistrationId);
      const student = await syncSalesCustomerToStudentRegistration(sale);
      if (student) {
        if (hadRegistration) updatedCount++;
        else createdCount++;
      }
    }

    // 3. Sync from CustomerFollowUp collection
    const customerFollowups = await CustomerFollowUp.find({}).lean();
    for (const cf of customerFollowups) {
      totalProcessed++;
      const fullName = (cf.fullName || '').trim();
      if (!fullName) continue;
      const email = (cf.email || '').trim().toLowerCase();
      const phone = (cf.phoneNumber || '').trim();

      const query = [];
      if (email && email.includes('@')) query.push({ email });
      if (fullName && phone) query.push({ fullName: new RegExp(`^${escapeRegExp(fullName)}$`, 'i'), phone });
      if (fullName) query.push({ fullName: new RegExp(`^${escapeRegExp(fullName)}$`, 'i') });

      const existing = await StudentRegistration.findOne({ $or: query });
      if (!existing) {
        const studentId = await generateStudentId();
        const isPaid = (cf.status || '').toLowerCase() === 'completed';

        await StudentRegistration.create({
          studentId,
          fullName,
          email: email || undefined,
          phone: phone || '',
          learningDepartment: 'General',
          program: 'General',
          enrollmentDate: parseDate(cf.followUpDate) || cf.createdAt || new Date(),
          preferredTimeSlot: 'Morning',
          paymentOption: 'Full Payment',
          paymentStatus: isPaid ? 'Paid' : 'Waiting',
          classCompleted: isPaid,
          classCompletionStatus: isPaid ? 'Completed' : 'Not Completed',
          cocPaymentStatus: 'Unpaid',
          status: isPaid ? 'Completed' : 'Active',
          notes: cf.notes || '',
          registeredBy: 'Customer Service Followup',
          paymentScreenshot: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="16">CS Followup Receipt</text></svg>',
        });
        createdCount++;
      }
    }

    // 4. Also run existing students sync
    await syncExistingStudents();
  } catch (err) {
    console.error('Error syncing all followups to student registrations:', err);
  }

  return { totalProcessed, createdCount, updatedCount };
};

let hasSyncedExistingStudents = false;
const syncExistingStudents = async () => {
  if (hasSyncedExistingStudents) return;
  hasSyncedExistingStudents = true;
  try {
    const students = await StudentRegistration.find({}).lean();
    for (const student of students) {
      await syncStudentToTrainingFollowup(student);
    }
  } catch (err) {
    console.error('Error in syncExistingStudents:', err);
  }
};

const parseDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizePaymentStatus = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'unpaid') return 'Unpaid';
  return 'Waiting';
};

const normalizePaymentOption = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized.includes('half')) return 'Half Payment';
  return 'Full Payment';
};

const normalizeGender = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized === 'female') return 'Female';
  if (normalized === 'male') return 'Male';
  return '';
};

const normalizeCocPaymentStatus = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  return normalized === 'paid' ? 'Paid' : 'Unpaid';
};

const isCoffeeCuppingRegistration = (registration = {}) => {
  const normalizeCourseName = (value) =>
    (value || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const acceptedCourses = ['coffeecupping', 'coffeeindustrycuppingandqualityassessment'];

  return [registration.learningDepartment, registration.program]
    .some((value) => acceptedCourses.includes(normalizeCourseName(value)));
};

const getSystemRegistrar = (user = {}) => ({
  name:
    user.fullName ||
    user.name ||
    user.username ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.email ||
    'Customer Service Member',
  email: (user.email || '').toString().trim().toLowerCase(),
});

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  const normalized = (value || '').toString().trim().toLowerCase();
  return ['true', 'yes', '1', 'completed', 'complete'].includes(normalized);
};

const normalizeClassCompletionStatus = (value, classCompleted) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized === 'stopped' || normalized === 'stop') return 'Stopped';
  if (normalized === 'completed' || normalized === 'complete') return 'Completed';
  if (normalized === 'not completed' || normalized === 'not complete' || normalized === 'incomplete') return 'Not Completed';
  return classCompleted ? 'Completed' : 'Not Completed';
};

const normalizeTimeSlot = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized === 'afternoon') return 'Afternoon';
  if (normalized === 'night') return 'Night';
  if (normalized === 'weekend') return 'Weekend';
  if (normalized === 'vip') return 'VIP';
  return 'Morning';
};

const normalizeSalesSchedulePreference = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized === 'morning') return 'Morning';
  if (normalized === 'afternoon') return 'Afternoon';
  if (normalized === 'night') return 'Night';
  if (normalized === 'weekend') return 'Weekend';
  if (normalized === 'online') return 'Online';
  if (normalized === 'vip') return 'VIP';
  return 'Regular';
};

const isValidRegistrationImage = (value) => {
  if (!value) return true; // Optional or empty is allowed
  if (typeof value !== 'string') return false;
  if (value.startsWith('http://') || value.startsWith('https://')) return true;
  if (!/^data:image\/(jpe?g|png|webp|gif);base64,/i.test(value)) return false;
  const base64 = value.split(',')[1] || '';
  const decodedBytes = Math.ceil((base64.length * 3) / 4);
  return decodedBytes > 0 && decodedBytes <= 5 * 1024 * 1024;
};

const generateStudentId = async () => {
  const prefix = 'CS-STU-';
  const latestStudent = await StudentRegistration.findOne({
    studentId: new RegExp(`^${escapeRegExp(prefix)}\\d+$`),
  })
    .sort({ studentId: -1 })
    .select('studentId')
    .lean();

  const latestNumber = Number.parseInt((latestStudent?.studentId || '').replace(prefix, ''), 10) || 0;
  let nextNumber = latestNumber + 1;
  let nextId = `${prefix}${String(nextNumber).padStart(4, '0')}`;

  while (await StudentRegistration.exists({ studentId: nextId })) {
    nextNumber += 1;
    nextId = `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  return nextId;
};

const isValidEducationFile = (body) => {
  if (body.educationFile === undefined) return true;
  if (body.educationFile === '') return !body.educationFileName;
  if (typeof body.educationFile !== 'string' || typeof body.educationFileName !== 'string') return false;
  if (body.educationFile.length > 7 * 1024 * 1024 || body.educationFileName.length > 255) return false;
  const extension = body.educationFileName.split('.').pop().toLowerCase();
  const types = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  if (!types[extension]) return false;
  const prefix = `data:${types[extension]};base64,`;
  if (!body.educationFile.startsWith(prefix)) return false;
  const encoded = body.educationFile.slice(prefix.length);
  if (encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) return false;
  const bytes = Buffer.from(encoded, 'base64');
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) return false;
  if (extension === 'pdf') return bytes.subarray(0, 5).toString() === '%PDF-';
  if (extension === 'doc') return bytes.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1';
  return bytes.subarray(0, 4).toString('hex') === '504b0304';
};

const buildPayload = (body = {}) => {
  const classCompleted = normalizeBoolean(body.classCompleted);
  const classCompletionStatus = normalizeClassCompletionStatus(body.classCompletionStatus || body.classStatus, classCompleted);
  const learningDepartment = body.learningDepartment || body.department || body.learningDept || '';
  const program = body.program || body.course || body.trainingProgram || '';
  const isCoffeeCupping = isCoffeeCuppingRegistration({ learningDepartment, program });
  const hasNationalIdFront = Object.prototype.hasOwnProperty.call(body, 'nationalIdFrontImage');
  const hasNationalIdBack = Object.prototype.hasOwnProperty.call(body, 'nationalIdBackImage');
  const nationalIdFrontImage = hasNationalIdFront ? body.nationalIdFrontImage : body.nationalIdImage;

  return {
    clientLocalId: body.clientLocalId || body.id || undefined,
    studentId: (body.studentId || body.studentID || body.registrationNo || '').toString().trim(),
    fullName: body.fullName || body.studentName || body.name || '',
    email: body.email || '',
    phone: body.phone || body.phoneNumber || '',
    gender: normalizeGender(body.gender),
    // Keep the legacy field as a front-image fallback for older clients/records.
    nationalIdImage: nationalIdFrontImage === undefined ? undefined : nationalIdFrontImage,
    nationalIdFrontImage: nationalIdFrontImage === undefined ? undefined : nationalIdFrontImage,
    nationalIdBackImage: hasNationalIdBack ? body.nationalIdBackImage : undefined,
    educationFile: body.educationFile,
    educationFileName: body.educationFile === '' ? '' : body.educationFileName,
    passportPhoto: body.passportPhoto || undefined,
    paymentScreenshot: body.paymentScreenshot || undefined,
    cocPaymentScreenshot: body.cocPaymentScreenshot || undefined,
    learningDepartment,
    program,
    enrollmentDate: parseDate(body.enrollmentDate || body.registrationDate),
    trainingEndDate: parseDate(body.trainingEndDate || body.endDate),
    examDate: parseDate(body.examDate || body.testDate),
    preferredTimeSlot: normalizeTimeSlot(body.preferredTimeSlot || body.timeSlot || body.section),
    readinessStatus: body.readinessStatus || body.readiness || 'Not assessed',
    paymentOption: normalizePaymentOption(body.paymentOption || body.paymentPlan),
    paymentStatus: normalizePaymentStatus(body.paymentStatus || body.payment),
    paymentBank: body.paymentBank || body.bankName || '',
    fsNumber: body.fsNumber || body.receiptFsNumber || body.receiptNumber || '',
    classCompleted: classCompletionStatus === 'Completed',
    classCompletionStatus,
    cocPaymentStatus: isCoffeeCupping
      ? normalizeCocPaymentStatus(body.cocPaymentStatus || body.cocPayment)
      : 'Unpaid',
    cocPaymentBank: body.cocPaymentBank || body.cocBank || '',
    status: body.status || 'Active',
    salesCallStatus: body.salesCallStatus || 'Not Called',
    salesFollowupStatus: body.salesFollowupStatus || 'Pending',
    salesSchedulePreference: normalizeSalesSchedulePreference(body.salesSchedulePreference || body.preferredTimeSlot),
    salesPackageScope: body.salesPackageScope || 'Local',
    salesFollowupDate: parseDate(body.salesFollowupDate) || new Date(),
    salesFollowupNote: body.salesFollowupNote || '',
    notes: body.notes || '',
    registeredBy: body.registeredBy || body.registeredByName || body.csMember || body.createdByName || body.createdBy || 'Unknown CS member',
    registeredByEmail: body.registeredByEmail || body.registrarEmail || body.createdByEmail || '',
    updatedBy: body.updatedBy || '',
    updatedByEmail: body.updatedByEmail || '',
  };
};

const normalizeStudent = (student, includeDocuments = false) => ({
  id: student._id,
  _id: student._id,
  clientLocalId: student.clientLocalId,
  studentId: student.studentId,
  fullName: student.fullName,
  email: student.email,
  phone: student.phone,
  gender: student.gender,
  hasNationalIdImage: Boolean(student.nationalIdFrontImage || student.nationalIdImage || student.hasNationalIdImage),
  hasNationalIdFrontImage: Boolean(student.nationalIdFrontImage || student.nationalIdImage || student.hasNationalIdFrontImage),
  hasNationalIdBackImage: Boolean(student.nationalIdBackImage || student.hasNationalIdBackImage),
  educationFileName: student.educationFileName || '',
  hasEducationFile: Boolean(student.educationFile || student.hasEducationFile),
  hasPassportPhoto: Boolean(student.passportPhoto || student.hasPassportPhoto),
  hasPaymentScreenshot: Boolean(student.paymentScreenshot || student.hasPaymentScreenshot),
  hasCocPaymentScreenshot: Boolean(student.cocPaymentScreenshot || student.hasCocPaymentScreenshot),
  ...(includeDocuments
    ? {
        nationalIdImage: student.nationalIdFrontImage || student.nationalIdImage || '',
        nationalIdFrontImage: student.nationalIdFrontImage || student.nationalIdImage || '',
        nationalIdBackImage: student.nationalIdBackImage || '',
        educationFile: student.educationFile || '',
        passportPhoto: student.passportPhoto || '',
        paymentScreenshot: student.paymentScreenshot || '',
        cocPaymentScreenshot: student.cocPaymentScreenshot || '',
      }
    : {
        nationalIdImage: '',
        nationalIdFrontImage: '',
        nationalIdBackImage: '',
        passportPhoto: '',
        paymentScreenshot: '',
        cocPaymentScreenshot: '',
      }),
  learningDepartment: student.learningDepartment,
  program: student.program,
  enrollmentDate: student.enrollmentDate,
  trainingEndDate: student.trainingEndDate,
  examDate: student.examDate,
  preferredTimeSlot: student.preferredTimeSlot || 'Morning',
  readinessStatus: student.readinessStatus,
  paymentOption: student.paymentOption || 'Full Payment',
  paymentStatus: student.paymentStatus || 'Waiting',
  paymentBank: student.paymentBank || '',
  fsNumber: student.fsNumber || '',
  classCompleted: Boolean(student.classCompleted),
  classCompletionStatus: student.classCompletionStatus || (student.classCompleted ? 'Completed' : 'Not Completed'),
  cocPaymentStatus: isCoffeeCuppingRegistration(student)
    ? (student.cocPaymentStatus || 'Unpaid')
    : 'Unpaid',
  cocPaymentBank: student.cocPaymentBank || '',
  status: student.status,
  salesCallStatus: student.salesCallStatus || 'Not Called',
  salesFollowupStatus: student.salesFollowupStatus || 'Pending',
  salesSchedulePreference: student.salesSchedulePreference || 'Regular',
  salesPackageScope: student.salesPackageScope || 'Local',
  salesFollowupDate: student.salesFollowupDate,
  salesFollowupNote: student.salesFollowupNote || '',
  notes: student.notes,
  registeredBy: student.registeredBy,
  registeredByEmail: student.registeredByEmail,
  updatedBy: student.updatedBy,
  updatedByEmail: student.updatedByEmail,
  createdBy: student.createdBy ? student.createdBy.toString() : '',
  agentId: student.agentId ? student.agentId.toString() : '',
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});

const normalizeRoleValue = (value) => (value || '').toString().trim().toLowerCase();
const isTessbinUser = (user) => ['tessbin', 'tessbinadmin'].includes(normalizeRoleValue(user?.role).replace(/[\s_-]/g, ''));

const PRIVILEGED_ROLES = new Set([
  'admin',
  'customerservice',
  'customer service',
  'customersuccessmanager',
  'customer success manager',
  'customer_success_manager',
  'coo',
  'coo2',
  'coo 2',
  'coo_2',
  '2coo',
  'ceo',
  'finance',
  'reception',
  'tessbinadmin',
  'tessbin admin',
  'tessbin',
  'trainer',
  'instructor',
  'teacher',
  'supervisor',
  'leader',
  'manager',
  'it',
]);

const canAccessStudentRecord = (student, user) => {
  if (!user) return false;
  if (isTessbinUser(user)) return true;
  const normalizedUserRole = normalizeRoleValue(user.role);
  if (PRIVILEGED_ROLES.has(normalizedUserRole)) return true;
  if (!student) return false;

  const userId = (user.id || user._id || '').toString().trim().toLowerCase();
  const userEmail = (user.email || '').toString().trim().toLowerCase();
  const rawNames = [
    user.fullName,
    user.name,
    user.username,
    [user.firstName, user.lastName].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .map((n) => n.toString().trim().toLowerCase().replace(/\s+/g, ' '))
    .filter((n) => n.length > 0);
  const userNames = Array.from(new Set(rawNames));

  const studentCreatedBy = (student.createdBy?._id || student.createdBy || '').toString().trim().toLowerCase();
  const studentAgentId = (student.agentId || '').toString().trim().toLowerCase();
  const studentEmail = (student.registeredByEmail || '').toString().trim().toLowerCase();
  const studentName = (student.registeredBy || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

  if (userId && (studentCreatedBy === userId || studentAgentId === userId)) return true;
  if (userEmail && studentEmail && studentEmail === userEmail) return true;
  if (studentName && userNames.some((name) => name && (studentName === name || studentName.includes(name) || name.includes(studentName)))) return true;
  return false;
};

const getStudentRegistrations = async (req, res) => {
  try {
    const { department, status, readiness, payment, paymentOption, timeSlot, classCompletionStatus, cocPaymentStatus, search, startDate, endDate, dateField, autoSync } = req.query;

    // Send existing records first. Repair stale sales links using an identifier-only
    // scan after the response, so missing registrations return on the next refresh.
    if (autoSync !== 'false') {
      res.once('finish', () => require('../services/completedSalesSync').scheduleCompletedSalesSync());
    }

    const query = {};
    const andConditions = [];

    // Date range calendar filtering
    if (startDate || endDate) {
      const targetDateField = ['enrollmentDate', 'examDate', 'trainingEndDate', 'salesFollowupDate', 'createdAt', 'updatedAt'].includes(dateField) ? dateField : 'enrollmentDate';
      const dateRange = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (!Number.isNaN(start.getTime())) {
          dateRange.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (!Number.isNaN(end.getTime())) {
          dateRange.$lte = end;
        }
      }
      if (Object.keys(dateRange).length > 0) {
        if (targetDateField === 'enrollmentDate') {
          andConditions.push({
            $or: [
              { enrollmentDate: dateRange },
              { enrollmentDate: { $in: [null, undefined] }, createdAt: dateRange }
            ]
          });
        } else {
          query[targetDateField] = dateRange;
        }
      }
    }

    // Sales dashboard ownership logic: In Sales workspace, users ONLY see students registered by themselves.
    // In Customer Service (or general view), all registered and completed students are displayed.
    const normalizedUserRole = normalizeRoleValue(req.user?.role);
    const isSalesWorkspace = (req.query.workspace || '').toString().toLowerCase() === 'sales';
    const isCustomerServiceOrAdmin = [
      'customerservice',
      'customersuccessmanager',
      'admin',
      'supervisor',
      'leader',
      'coo',
      'coo2',
      'ceo',
      'tessbinadmin',
      'tessbin',
      'instructor',
      'finance',
    ].includes(normalizedUserRole);

    if (isSalesWorkspace && !isCustomerServiceOrAdmin) {
      const currentUserId = req.user?._id || req.user?.id;
      const userEmail = (req.user?.email || '').toString().trim().toLowerCase();
      const userNames = [
        req.user?.fullName,
        req.user?.name,
        req.user?.username,
        [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .map((n) => n.toString().trim())
        .filter((n) => n.length > 0);

      const salesOwnerConditions = [];
      if (currentUserId) {
        if (mongoose.Types.ObjectId.isValid(currentUserId)) {
          salesOwnerConditions.push({ createdBy: new mongoose.Types.ObjectId(currentUserId) });
          salesOwnerConditions.push({ agentId: new mongoose.Types.ObjectId(currentUserId) });
        }
        salesOwnerConditions.push({ createdBy: currentUserId.toString() });
        salesOwnerConditions.push({ agentId: currentUserId.toString() });
      }
      if (userEmail) {
        salesOwnerConditions.push({ registeredByEmail: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') });
      }
      userNames.forEach((name) => {
        const cleanedName = escapeRegExp(name).replace(/\s+/g, '\\s+');
        salesOwnerConditions.push({ registeredBy: new RegExp(`^\\s*${cleanedName}\\s*$`, 'i') });
      });

      if (salesOwnerConditions.length > 0) {
        andConditions.push({ $or: salesOwnerConditions });
      } else {
        // No identity found — return zero results to prevent data leak
        andConditions.push({ _id: null });
      }
    }

    if (department && department !== 'All') query.learningDepartment = department;
    if (status && status !== 'All') query.status = status;
    if (readiness && readiness !== 'All') query.readinessStatus = readiness;
    if (payment && payment !== 'All') query.paymentStatus = payment;
    if (paymentOption && paymentOption !== 'All') query.paymentOption = paymentOption;
    if (timeSlot && timeSlot !== 'All') query.preferredTimeSlot = timeSlot;
    if (classCompletionStatus && classCompletionStatus !== 'All') query.classCompletionStatus = classCompletionStatus;
    if (cocPaymentStatus && cocPaymentStatus !== 'All') {
      query.cocPaymentStatus = cocPaymentStatus;
      if (cocPaymentStatus === 'Paid') {
        const coffeeConditions = [
          { learningDepartment: /^Coffee Cupping$/i },
          { learningDepartment: /^Coffee Industry Cupping & Quality Assessment$/i },
          { program: /^Coffee Cupping$/i },
          { program: /^Coffee Industry Cupping & Quality Assessment$/i },
        ];
        andConditions.push({ $or: coffeeConditions });
      }
    }
    if (search) {
      const searchConditions = [
        { fullName: new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { learningDepartment: new RegExp(search, 'i') },
        { program: new RegExp(search, 'i') },
        { preferredTimeSlot: new RegExp(search, 'i') },
        { paymentOption: new RegExp(search, 'i') },
        { paymentStatus: new RegExp(search, 'i') },
        { paymentBank: new RegExp(search, 'i') },
        { fsNumber: new RegExp(search, 'i') },
        { classCompletionStatus: new RegExp(search, 'i') },
        { cocPaymentStatus: new RegExp(search, 'i') },
        { registeredBy: new RegExp(search, 'i') },
      ];
      andConditions.push({ $or: searchConditions });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const sortOrder = req.query.sortOrder === 'asc' || req.query.sort === 'asc' ? 1 : -1;
    // Cursor batches use MongoDB's built-in _id index and limit work before
    // reading attachment indicators. Legacy callers still receive the full list.
    if (req.query.batchSize !== undefined) {
      const batchSize = Number(req.query.batchSize);
      const cursor = req.query.cursor;
      if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 200 ||
          (cursor && (typeof cursor !== 'string' || !/^[a-f0-9]{24}$/i.test(cursor)))) {
        return res.status(400).json({ success: false, message: 'Invalid registration batch size or cursor.' });
      }
      if (cursor) query.$and = [...(query.$and || []), { _id: { $lt: new mongoose.Types.ObjectId(cursor) } }];
      const batch = await StudentRegistration.aggregate([
        { $match: query },
        { $sort: { _id: -1 } },
        { $limit: batchSize + 1 },
        ...require('../utils/studentListProjection').studentListProjection,
      ]);
      const hasMore = batch.length > batchSize;
      const students = batch.slice(0, batchSize);
      return res.json({
        success: true,
        data: students.map((student) => normalizeStudent(student)),
        nextCursor: hasMore ? String(students[students.length - 1]._id) : null,
      });
    }
    const students = await StudentRegistration.aggregate([
      { $match: query },
      ...require('../utils/studentListProjection').studentListProjection,
      { $sort: { createdAt: sortOrder } },
    ]);

    res.json({ success: true, data: students.map((student) => normalizeStudent(student)) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student registrations', error: error.message });
  }
};

const getStudentRegistrationById = async (req, res) => {
  try {
    const student = await StudentRegistration.findById(req.params.id)
      .select('+nationalIdImage +nationalIdFrontImage +nationalIdBackImage +passportPhoto +paymentScreenshot +cocPaymentScreenshot +educationFile')
      .lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }
    if (!canAccessStudentRecord(student, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this student registration.' });
    }
    res.json({ success: true, data: normalizeStudent(student, true) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student registration', error: error.message });
  }
};

const createStudentRegistration = async (req, res) => {
  if (isTessbinUser(req.user)) return res.status(403).json({ success: false, message: 'Tessbin can update COC payment fields only.' });
  try {
    if (!isValidEducationFile(req.body)) {
      return res.status(400).json({ success: false, message: 'Education files must be one PDF or Word (.doc, .docx) file up to 5 MB.' });
    }
    const syncToSalesFollowup = req.body.syncToSalesFollowup === true;
    const payload = buildPayload(req.body);
    if (!payload.fullName || !payload.learningDepartment) {
      return res.status(400).json({ success: false, message: 'Student name and learning department are required.' });
    }
    if (payload.nationalIdImage && !isValidRegistrationImage(payload.nationalIdImage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid National ID image format. Please upload a valid JPEG, PNG, or WEBP under 5MB.',
      });
    }
    if (payload.nationalIdFrontImage && !isValidRegistrationImage(payload.nationalIdFrontImage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid National ID front image. Please upload a valid JPEG, PNG, or WEBP under 5MB.',
      });
    }
    if (payload.nationalIdBackImage && !isValidRegistrationImage(payload.nationalIdBackImage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid National ID back image. Please upload a valid JPEG, PNG, or WEBP under 5MB.',
      });
    }
    if (payload.passportPhoto && !isValidRegistrationImage(payload.passportPhoto)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 3×4 Passport Photo format. Please upload a valid JPEG, PNG, or WEBP under 5MB.',
      });
    }
    if (payload.paymentScreenshot && !isValidRegistrationImage(payload.paymentScreenshot)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Payment Receipt format. Please upload a valid JPEG, PNG, or WEBP under 5MB.',
      });
    }
    if (payload.cocPaymentScreenshot && !isValidRegistrationImage(payload.cocPaymentScreenshot)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid COC Payment Receipt format. Please upload a valid JPEG, PNG, or WEBP under 5MB.',
      });
    }
    if (!payload.paymentScreenshot) {
      payload.paymentScreenshot = '';
    }
    if (!payload.cocPaymentScreenshot) {
      payload.cocPaymentScreenshot = '';
    }

    const registrar = getSystemRegistrar(req.user);
    payload.registeredBy = registrar.name;
    payload.registeredByEmail = registrar.email;
    if (req.user) {
      payload.createdBy = req.user._id || req.user.id;
      payload.agentId = (req.user.id || req.user._id).toString();
    }

    if (payload.clientLocalId) {
      const existing = await StudentRegistration.findOne({ clientLocalId: payload.clientLocalId });
      if (existing) {
        await syncStudentToTrainingFollowup(existing);
        if (syncToSalesFollowup) await syncStudentToSalesFollowup(existing, req.user);
        return res.status(200).json({ success: true, data: normalizeStudent(existing), message: 'Student registration already exists.' });
      }
    }

    // Use requested student ID if provided; otherwise generate a new unique ID
    if (!payload.studentId || !payload.studentId.trim()) {
      payload.studentId = await generateStudentId();
    } else {
      payload.studentId = payload.studentId.trim();
    }

    const duplicateStudentId = await StudentRegistration.findOne({ studentId: payload.studentId });
    if (duplicateStudentId) {
      return res.status(409).json({
        success: false,
        message: `Student ID ${payload.studentId} is already assigned. Please use a different Student ID.`,
      });
    }

    const student = await StudentRegistration.create(payload);
    // Automatically add registered student to All TESBINN Users data
    await syncStudentToTrainingFollowup(student);
    if (syncToSalesFollowup) await syncStudentToSalesFollowup(student, req.user);

    res.status(201).json({ success: true, data: normalizeStudent(student, true) });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.studentId) {
      return res.status(409).json({
        success: false,
        message: 'This Student ID is already assigned. Please use a different Student ID.',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to create student registration', error: error.message });
  }
};

const updateStudentCocCompletion = async (req, res) => {
  try {
    if (Object.keys(req.body || {}).some((key) => key !== 'classCompleted')) {
      return res.status(403).json({ success: false, message: 'Only class completion can be updated here.' });
    }
    if (typeof req.body?.classCompleted !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Class completion must be true or false.' });
    }
    const existingStudent = await StudentRegistration.findById(req.params.id).lean();
    if (!existingStudent) return res.status(404).json({ success: false, message: 'Student registration not found.' });
    if (!canAccessStudentRecord(existingStudent, req.user)) return res.status(403).json({ success: false, message: 'You do not have permission to update this student registration.' });
    if (!isCoffeeCuppingRegistration(existingStudent)) return res.status(400).json({ success: false, message: 'This action applies to COC Coffee Cupping students.' });
    const registrar = getSystemRegistrar(req.user);
    const student = await StudentRegistration.findByIdAndUpdate(req.params.id, { $set: {
      classCompleted: req.body.classCompleted,
      classCompletionStatus: req.body.classCompleted ? 'Completed' : 'Not Completed',
      updatedBy: registrar.name,
      updatedByEmail: registrar.email,
    } }, { new: true, runValidators: true }).select('classCompleted classCompletionStatus updatedBy updatedByEmail');
    if (!student) return res.status(404).json({ success: false, message: 'Student registration not found.' });
    res.json({ success: true, data: {
      id: student._id,
      classCompleted: student.classCompleted,
      classCompletionStatus: student.classCompletionStatus,
      updatedBy: student.updatedBy,
      updatedByEmail: student.updatedByEmail,
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update class completion', error: error.message });
  }
};

const updateStudentCocPayment = async (req, res) => {
  try {
    const allowedFields = ['cocPaymentStatus', 'cocPaymentBank', 'cocPaymentScreenshot'];
    const keys = Object.keys(req.body || {});
    if (!keys.length || keys.some((key) => !allowedFields.includes(key))) {
      return res.status(403).json({ success: false, message: 'Only COC payment status, bank, and receipt can be updated here.' });
    }
    const payload = Object.fromEntries(keys.map((key) => [key, req.body[key]]));
    if ((keys.includes('cocPaymentStatus') && !['Paid', 'Unpaid'].includes(payload.cocPaymentStatus)) ||
        (keys.includes('cocPaymentBank') && (typeof payload.cocPaymentBank !== 'string' || payload.cocPaymentBank.length > 200)) ||
        (keys.includes('cocPaymentScreenshot') && (typeof payload.cocPaymentScreenshot !== 'string' ||
          (payload.cocPaymentScreenshot !== '' && !isValidRegistrationImage(payload.cocPaymentScreenshot))))) {
      return res.status(400).json({ success: false, message: 'Enter a valid COC payment status, bank, and JPEG, PNG or WEBP receipt up to 5 MB.' });
    }
    const existingStudent = await StudentRegistration.findById(req.params.id).lean();
    if (!existingStudent) return res.status(404).json({ success: false, message: 'Student registration not found.' });
    if (!canAccessStudentRecord(existingStudent, req.user)) return res.status(403).json({ success: false, message: 'You do not have permission to update this student registration.' });
    if (!isCoffeeCuppingRegistration(existingStudent)) return res.status(400).json({ success: false, message: 'COC payments apply to Coffee Cupping registrations.' });
    const registrar = getSystemRegistrar(req.user);
    payload.updatedBy = registrar.name;
    payload.updatedByEmail = registrar.email;
    const student = await StudentRegistration.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true, runValidators: true })
      .select('+nationalIdImage +nationalIdFrontImage +nationalIdBackImage +passportPhoto +paymentScreenshot +cocPaymentScreenshot +educationFile');
    if (!student) return res.status(404).json({ success: false, message: 'Student registration not found.' });
    res.json({ success: true, data: normalizeStudent(student, true) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update COC payment', error: error.message });
  }
};

const updateStudentRegistration = async (req, res) => {
  if (isTessbinUser(req.user)) return updateStudentCocPayment(req, res);
  try {
    if (!isValidEducationFile(req.body)) {
      return res.status(400).json({ success: false, message: 'Education files must be one PDF or Word (.doc, .docx) file up to 5 MB.' });
    }
    const syncToSalesFollowup = req.body.syncToSalesFollowup === true;
    const existingStudent = await StudentRegistration.findById(req.params.id)
      .select('+nationalIdImage +nationalIdFrontImage +nationalIdBackImage +passportPhoto +paymentScreenshot +cocPaymentScreenshot +educationFile')
      .lean();
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }
    if (!canAccessStudentRecord(existingStudent, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this student registration.' });
    }

    const mergedBody = {
      ...existingStudent,
      ...req.body,
    };
    const payload = buildPayload(mergedBody);
    delete payload.clientLocalId;
    // Student ID and registration ownership are immutable after creation.
    delete payload.studentId;
    delete payload.registeredBy;
    delete payload.registeredByEmail;
    delete payload.createdBy;
    delete payload.agentId;
    const registrar = getSystemRegistrar(req.user);
    payload.updatedBy = registrar.name;
    payload.updatedByEmail = registrar.email;

    // Retain existing image documents if not provided in the update
    if (!payload.paymentScreenshot) {
      payload.paymentScreenshot = existingStudent.paymentScreenshot;
    }
    if (!payload.cocPaymentScreenshot) {
      payload.cocPaymentScreenshot = existingStudent.cocPaymentScreenshot;
    }
    if (!payload.nationalIdFrontImage && !payload.nationalIdImage) {
      payload.nationalIdFrontImage = existingStudent.nationalIdFrontImage || existingStudent.nationalIdImage || '';
      payload.nationalIdImage = payload.nationalIdFrontImage;
    }
    if (!payload.nationalIdBackImage) {
      payload.nationalIdBackImage = existingStudent.nationalIdBackImage || '';
    }
    if (!payload.passportPhoto) {
      payload.passportPhoto = existingStudent.passportPhoto || '';
    }

    const invalidImageField = [
      ['National ID front', req.body.nationalIdFrontImage || req.body.nationalIdImage],
      ['National ID back', req.body.nationalIdBackImage],
      ['passport photo', req.body.passportPhoto],
      ['payment receipt', req.body.paymentScreenshot],
      ['COC payment receipt', req.body.cocPaymentScreenshot],
    ].find(([, value]) => value && !isValidRegistrationImage(value));
    if (invalidImageField) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${invalidImageField[0]} image. Please upload a valid JPEG, PNG, or WEBP under 5MB.`,
      });
    }

    const student = await StudentRegistration.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).select('+nationalIdImage +nationalIdFrontImage +nationalIdBackImage +passportPhoto +paymentScreenshot +cocPaymentScreenshot +educationFile');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }

    // Update synced record in All TESBINN Users data
    await syncStudentToTrainingFollowup(student);
    if (syncToSalesFollowup) await syncStudentToSalesFollowup(student, req.user);

    res.json({ success: true, data: normalizeStudent(student, true) });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.studentId) {
      return res.status(409).json({
        success: false,
        message: 'This Student ID is already assigned. Please use a different Student ID.',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to update student registration', error: error.message });
  }
};

const deleteStudentRegistration = async (req, res) => {
  if (isTessbinUser(req.user)) return res.status(403).json({ success: false, message: 'Tessbin can update COC payment fields only.' });
  try {
    const existingStudent = await StudentRegistration.findById(req.params.id).lean();
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }
    if (!canAccessStudentRecord(existingStudent, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this student registration.' });
    }
    const student = await StudentRegistration.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: normalizeStudent(student) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete student registration', error: error.message });
  }
};

const verifyStudentRegistration = async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({ success: false, verified: false, message: 'Verification ID or Student ID is required.' });
    }

    const conditions = [
      { studentId: rawId },
      { clientLocalId: rawId },
    ];
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      conditions.unshift({ _id: rawId });
    }

    const student = await StudentRegistration.findOne({ $or: conditions })
      .select('+passportPhoto +paymentScreenshot')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'No authenticated registration record found for this identifier.',
      });
    }

    const isCoffeeCupping = isCoffeeCuppingRegistration(student);
    const verificationCode = `TSB-VER-${student.studentId || (student._id ? String(student._id).slice(-6).toUpperCase() : 'REC')}`;
    const hashData = `${student._id}-${student.studentId}-${student.fullName}-${student.learningDepartment}-${student.enrollmentDate}`;
    const securityHash = crypto.createHash('sha256').update(hashData).digest('hex').slice(0, 24).toUpperCase();

    const result = {
      verified: true,
      id: student._id,
      _id: student._id,
      studentId: student.studentId || 'N/A',
      fullName: student.fullName,
      email: student.email ? `${student.email.slice(0, 3)}***@${student.email.split('@')[1] || 'tessbin.com'}` : '',
      phone: student.phone ? `${student.phone.slice(0, 4)}****${student.phone.slice(-3)}` : '',
      gender: student.gender || 'N/A',
      learningDepartment: student.learningDepartment || 'Coffee Cupping',
      program: student.program || student.learningDepartment || 'Coffee Cupping',
      preferredTimeSlot: student.preferredTimeSlot || 'Morning',
      enrollmentDate: student.enrollmentDate || student.createdAt,
      trainingEndDate: student.trainingEndDate || null,
      examDate: student.examDate || null,
      paymentStatus: student.paymentStatus || 'Verified',
      paymentOption: student.paymentOption || 'Full Payment',
      paymentBank: student.paymentBank || 'Commercial Bank of Ethiopia',
      fsNumber: student.fsNumber || '',
      classCompleted: Boolean(student.classCompleted),
      classCompletionStatus: student.classCompletionStatus || (student.classCompleted ? 'Completed' : 'In Progress'),
      cocPaymentStatus: isCoffeeCupping ? (student.cocPaymentStatus || 'Paid') : 'Not Applicable',
      isCoffeeCupping,
      registeredBy: student.registeredBy || 'TESBINN Registrar Admissions',
      passportPhoto: student.passportPhoto || '',
      verificationCode,
      securityHash,
      verificationTimestamp: new Date().toISOString(),
      institution: {
        name: 'TESBINN',
        fullName: 'Trade Ethiopia School of Business & Innovation',
        amharicName: 'ትሬድ ኢትዮጵያ የቢዝነስ እና ፈጠራ ት/ቤት',
        sealType: 'OFFICIAL SEAL - REGISTRAR VERIFIED',
        headquarters: 'Addis Ababa, Ethiopia',
        website: 'www.tradethiopia.com',
        verificationAuthority: 'Office of the Registrar & Academic Certifications',
      },
    };

    return res.json({
      success: true,
      verified: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      verified: false,
      message: 'Verification failed due to server error.',
      error: error.message,
    });
  }
};

const handleSyncAllFollowupStudents = async (req, res) => {
  if (isTessbinUser(req.user)) return res.status(403).json({ success: false, message: 'Tessbin can update COC payment fields only.' });
  try {
    const stats = await syncAllFollowupStudentsToRegistrations();
    const totalStudents = await StudentRegistration.countDocuments();
    res.json({
      success: true,
      message: 'Successfully synchronized customer follow-up data to Tessbin Student Registrations.',
      data: {
        ...stats,
        totalStudents,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to synchronize follow-up data.',
      error: error.message,
    });
  }
};

module.exports = {
  updateStudentCocCompletion,
  updateStudentCocPayment,
  getStudentRegistrations,
  getStudentRegistrationById,
  createStudentRegistration,
  updateStudentRegistration,
  deleteStudentRegistration,
  verifyStudentRegistration,
  handleSyncAllFollowupStudents,
  syncAllFollowupStudentsToRegistrations,
};
