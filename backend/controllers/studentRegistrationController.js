const mongoose = require('mongoose');
const crypto = require('crypto');
const StudentRegistration = require('../models/StudentRegistration');
const TrainingFollowup = require('../models/TrainingFollowup');

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    passportPhoto: body.passportPhoto || undefined,
    paymentScreenshot: body.paymentScreenshot || undefined,
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
    status: body.status || 'Active',
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
  hasPassportPhoto: Boolean(student.passportPhoto || student.hasPassportPhoto),
  hasPaymentScreenshot: Boolean(student.paymentScreenshot || student.hasPaymentScreenshot),
  ...(includeDocuments
    ? {
        nationalIdImage: student.nationalIdFrontImage || student.nationalIdImage || '',
        nationalIdFrontImage: student.nationalIdFrontImage || student.nationalIdImage || '',
        nationalIdBackImage: student.nationalIdBackImage || '',
        passportPhoto: student.passportPhoto || '',
        paymentScreenshot: student.paymentScreenshot || '',
      }
    : {
        nationalIdImage: '',
        nationalIdFrontImage: '',
        nationalIdBackImage: '',
        passportPhoto: '',
        paymentScreenshot: '',
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
  status: student.status,
  notes: student.notes,
  registeredBy: student.registeredBy,
  registeredByEmail: student.registeredByEmail,
  updatedBy: student.updatedBy,
  updatedByEmail: student.updatedByEmail,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});

const getStudentRegistrations = async (req, res) => {
  try {
    const { department, status, readiness, payment, paymentOption, timeSlot, classCompletionStatus, cocPaymentStatus, search } = req.query;
    const query = {};

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
        query.$and = [{
          $or: [
            { learningDepartment: /^Coffee Cupping$/i },
            { learningDepartment: /^Coffee Industry Cupping & Quality Assessment$/i },
            { program: /^Coffee Cupping$/i },
            { program: /^Coffee Industry Cupping & Quality Assessment$/i },
          ],
        }];
      }
    }
    if (search) {
      query.$or = [
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
    }

    const includeDocuments = req.query.includeDocuments === 'true';
    let studentQuery = StudentRegistration.find(query).sort({ createdAt: -1 });
    if (includeDocuments) {
      studentQuery = studentQuery.select('+nationalIdImage +nationalIdFrontImage +nationalIdBackImage +passportPhoto +paymentScreenshot');
    }
    const students = await studentQuery.lean();

    setImmediate(() => {
      syncExistingStudents().catch(() => {});
    });

    res.json({ success: true, data: students.map((student) => normalizeStudent(student, includeDocuments)) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student registrations', error: error.message });
  }
};

const getStudentRegistrationById = async (req, res) => {
  try {
    const student = await StudentRegistration.findById(req.params.id)
      .select('+nationalIdImage +nationalIdFrontImage +nationalIdBackImage +passportPhoto +paymentScreenshot')
      .lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }
    res.json({ success: true, data: normalizeStudent(student, true) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student registration', error: error.message });
  }
};

const createStudentRegistration = async (req, res) => {
  try {
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
    if (!payload.paymentScreenshot) {
      return res.status(400).json({ success: false, message: 'Payment receipt photo is required.' });
    }

    const registrar = getSystemRegistrar(req.user);
    payload.registeredBy = registrar.name;
    payload.registeredByEmail = registrar.email;

    if (payload.clientLocalId) {
      const existing = await StudentRegistration.findOne({ clientLocalId: payload.clientLocalId });
      if (existing) {
        await syncStudentToTrainingFollowup(existing);
        return res.status(200).json({ success: true, data: normalizeStudent(existing), message: 'Student registration already exists.' });
      }
    }

    // Student IDs are always generated by the system and cannot be supplied by clients.
    payload.studentId = await generateStudentId();

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

const updateStudentRegistration = async (req, res) => {
  try {
    const existingStudent = await StudentRegistration.findById(req.params.id)
      .select('+nationalIdImage +nationalIdFrontImage +nationalIdBackImage +passportPhoto +paymentScreenshot')
      .lean();
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }

    const payload = buildPayload(req.body);
    delete payload.clientLocalId;
    // Student ID and registration ownership are immutable after creation.
    delete payload.studentId;
    delete payload.registeredBy;
    delete payload.registeredByEmail;
    const registrar = getSystemRegistrar(req.user);
    payload.updatedBy = registrar.name;
    payload.updatedByEmail = registrar.email;

    // Retain existing image documents if not provided in the update
    if (!payload.paymentScreenshot) {
      payload.paymentScreenshot = existingStudent.paymentScreenshot;
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
    }).select('+nationalIdImage +nationalIdFrontImage +nationalIdBackImage +passportPhoto +paymentScreenshot');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }

    // Update synced record in All TESBINN Users data
    await syncStudentToTrainingFollowup(student);

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
  try {
    const student = await StudentRegistration.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }
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

module.exports = {
  getStudentRegistrations,
  getStudentRegistrationById,
  createStudentRegistration,
  updateStudentRegistration,
  deleteStudentRegistration,
  verifyStudentRegistration,
};
