const TrainingFollowup = require("../models/TrainingFollowup");
const SalesCustomer = require("../models/SalesCustomer");
const User = require("../models/user.model");

const isCustomerServiceIdentifier = (val, csSet) => {
  if (!val) return true;
  const lower = String(val).trim().toLowerCase();
  if (csSet.has(lower)) return true;
  if (/test-cs|customerservice|customer\s*success|customer\s*service|reception|csm_manager/i.test(lower)) return true;
  return false;
};

// Create Training follow-up
const createTrainingFollowup = async (req, res) => {
  try {
    const doc = await TrainingFollowup.create(req.body);
    
    // Update the follow-up status in SalesCustomer collection
    // We'll look for a customer with matching email or customerName
    const { email, customerName } = req.body;
    
    if (email || customerName) {
      const filter = {};
      if (email) {
        filter.email = email;
      } else if (customerName) {
        filter.customerName = customerName;
      }
      
      // Update the followupStatus to "Imported" for matching customers
      await SalesCustomer.updateMany(filter, {
        followupStatus: "Imported"
      });
    }

    // Automatically sync into Tessbin StudentRegistration
    setImmediate(() => {
      try {
        const { syncAllFollowupStudentsToRegistrations } = require('./studentRegistrationController');
        syncAllFollowupStudentsToRegistrations().catch(() => {});
      } catch (e) {}
    });
    
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get Training follow-ups with basic filtering/sorting
const getTrainingFollowups = async (req, res) => {
  try {
    const { q, progress, sort = "asc", batch } = req.query;
    const filter = {};

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { customerName: regex },
        { agentName: regex },
        { email: regex },
        { batch: regex },
      ];
    }

    if (progress && progress !== "all") {
      filter.progress = progress;
    }

    if (batch) {
      filter.batch = new RegExp(batch, "i");
    }

    let sortOptions = { createdAt: -1, _id: -1 };
    if (sort === "asc" || sort === "oldest") {
      sortOptions = { createdAt: 1, _id: 1 };
    } else if (sort === "name_asc") {
      sortOptions = { customerName: 1 };
    } else if (sort === "name_desc") {
      sortOptions = { customerName: -1 };
    }

    const followups = await TrainingFollowup.find(filter)
      .sort(sortOptions)
      .lean();

    // Enrich followups with real sales agents from SalesCustomer
    try {
      const allUsers = await User.find({}).select('_id username name fullName role').lean();
      const userMap = {};
      const csSet = new Set(['test-cs', 'customerservice', 'cs', 'customer success', 'customer service']);

      allUsers.forEach((u) => {
        const id = u._id.toString();
        const displayName = u.fullName || u.name || u.username;
        userMap[id] = displayName;
        const role = (u.role || '').toLowerCase();
        if (role.includes('customer') || role.includes('cs') || role.includes('reception') || role.includes('csm')) {
          if (u.username) csSet.add(u.username.toLowerCase());
          if (u.fullName) csSet.add(u.fullName.toLowerCase());
          if (u.name) csSet.add(u.name.toLowerCase());
        }
      });

      // Find all followups needing sales agent lookup
      const lookupCriteria = [];
      followups.forEach((f) => {
        const curSales = (f.salesAgent || '').trim();
        if (isCustomerServiceIdentifier(curSales, csSet)) {
          if (f.email) lookupCriteria.push({ email: f.email.trim() });
          if (f.customerName) lookupCriteria.push({ customerName: f.customerName.trim() });
          if (f.phoneNumber) lookupCriteria.push({ phone: f.phoneNumber.trim() });
        }
      });

      let matchedSalesCustomers = [];
      if (lookupCriteria.length > 0) {
        matchedSalesCustomers = await SalesCustomer.find({ $or: lookupCriteria })
          .select('agentId customerName email phone')
          .lean();
      }

      const salesCustomerByEmail = new Map();
      const salesCustomerByName = new Map();
      const salesCustomerByPhone = new Map();

      matchedSalesCustomers.forEach((sc) => {
        if (sc.email) salesCustomerByEmail.set(sc.email.toLowerCase().trim(), sc);
        if (sc.customerName) salesCustomerByName.set(sc.customerName.toLowerCase().trim(), sc);
        if (sc.phone) salesCustomerByPhone.set(sc.phone.toLowerCase().trim(), sc);
      });

      // Also look up student registrations to populate preferredTimeSlot into scheduleShift
      let matchedStudents = [];
      try {
        const StudentRegistration = require('../models/StudentRegistration');
        const studentCriteria = [];
        followups.forEach((f) => {
          if (f.idInfo) studentCriteria.push({ studentId: f.idInfo.trim() });
          if (f.email) studentCriteria.push({ email: f.email.trim() });
          if (f.customerName) studentCriteria.push({ fullName: f.customerName.trim() });
          if (f.phoneNumber) studentCriteria.push({ phone: f.phoneNumber.trim() });
        });

        if (studentCriteria.length > 0) {
          matchedStudents = await StudentRegistration.find({ $or: studentCriteria })
            .select('studentId fullName email phone preferredTimeSlot')
            .lean();
        }
      } catch (stuErr) {
        console.warn('Could not lookup student registrations for followups:', stuErr.message);
      }

      const studentById = new Map();
      const studentByEmail = new Map();
      const studentByName = new Map();
      const studentByPhone = new Map();

      matchedStudents.forEach((stu) => {
        if (stu.studentId) studentById.set(stu.studentId.toLowerCase().trim(), stu);
        if (stu.email) studentByEmail.set(stu.email.toLowerCase().trim(), stu);
        if (stu.fullName) studentByName.set(stu.fullName.toLowerCase().trim(), stu);
        if (stu.phone) studentByPhone.set(stu.phone.toLowerCase().trim(), stu);
      });

      const enrichedFollowups = followups.map((f) => {
        let currentSales = (f.salesAgent || '').trim();
        const isCS = isCustomerServiceIdentifier(currentSales, csSet);

        const emailKey = (f.email || '').toLowerCase().trim();
        const nameKey = (f.customerName || '').toLowerCase().trim();
        const phoneKey = (f.phoneNumber || '').toLowerCase().trim();
        const idKey = (f.idInfo || '').toLowerCase().trim();

        if (isCS) {
          const sc = salesCustomerByEmail.get(emailKey) || salesCustomerByName.get(nameKey) || salesCustomerByPhone.get(phoneKey);
          if (sc && sc.agentId && userMap[sc.agentId.toString()]) {
            currentSales = userMap[sc.agentId.toString()];
          } else {
            currentSales = ''; // Don't show CS agent name under Sales Agent!
          }
        }

        const matchedStudent = (idKey ? studentById.get(idKey) : null) || studentByEmail.get(emailKey) || studentByName.get(nameKey) || studentByPhone.get(phoneKey);
        const scheduleShift = matchedStudent?.preferredTimeSlot || f.scheduleShift || 'Morning';
        const materialStatus = f.materialStatus || 'Not Delivered';

        return {
          ...f,
          salesAgent: currentSales,
          scheduleShift,
          materialStatus,
        };
      });

      return res.json(enrichedFollowups);
    } catch (enrichErr) {
      console.error('Error enriching sales agents:', enrichErr);
      return res.json(followups);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get count of training customers whose progress is not 'Completed'
const getIncompleteTrainingCount = async (req, res) => {
  try {
    const count = await TrainingFollowup.countDocuments({
      progress: { $ne: "Completed" }
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get training programs that are not completed properly (not equal to 'Completed')
const getWeeklyPopularTrainings = async (req, res) => {
  try {
    // Aggregate to get training program counts where progress is not 'Completed'
    const popularTrainings = await TrainingFollowup.aggregate([
      {
        $match: {
          progress: { $ne: "Completed" }  // Only include trainings that are not completed
        }
      },
      {
        $group: {
          _id: "$trainingType",  // Group by training program (trainingType)
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5 // Get top 5 most popular training programs
      },
      {
        $project: {
          _id: 0,
          trainingProgram: "$_id",  // Rename _id to trainingProgram for clarity
          count: 1
        }
      }
    ]);

    res.json(popularTrainings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Training follow-up
const updateTrainingFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await TrainingFollowup.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Training follow-up not found" });

    // Automatically sync into Tessbin StudentRegistration
    setImmediate(() => {
      try {
        const { syncAllFollowupStudentsToRegistrations } = require('./studentRegistrationController');
        syncAllFollowupStudentsToRegistrations().catch(() => {});
      } catch (e) {}
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Training follow-up
const deleteTrainingFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TrainingFollowup.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Training follow-up not found" });
    res.json({ message: "Training follow-up deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTrainingFollowup,
  getTrainingFollowups,
  getIncompleteTrainingCount,
  getWeeklyPopularTrainings,
  updateTrainingFollowup,
  deleteTrainingFollowup,
};
