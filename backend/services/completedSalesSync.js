const SalesCustomer = require('../models/SalesCustomer');
const StudentRegistration = require('../models/StudentRegistration');
const TrainingFollowup = require('../models/TrainingFollowup');

let pendingSync = null;
let scheduled = false;
let nextBackgroundSyncAt = 0;

// Repair older completed sales independently of destination list requests.
// Share concurrent requests and leave existing training details untouched.
const ensureCompletedSalesSynced = () => {
  if (pendingSync) return pendingSync;
  pendingSync = (async () => {
    // Scan identifiers only; receipts and ID photos can be megabytes per sale.
    const sales = await SalesCustomer.find({ followupStatus: /^completed$/i })
      .select('_id studentRegistrationId').lean();
    if (!sales.length) return;
    const students = await StudentRegistration.find({
      _id: { $in: sales.map((sale) => sale.studentRegistrationId).filter(Boolean) },
    }).select('_id studentId').lean();
    const studentsById = new Map(students.map((student) => [String(student._id), student]));
    const followups = await TrainingFollowup.find({
      idInfo: { $in: students.map((student) => student.studentId) },
    }).select('idInfo').lean();
    const syncedIds = new Set(followups.map((followup) => followup.idInfo));
    const linkCounts = new Map();
    sales.forEach((sale) => {
      const id = String(sale.studentRegistrationId);
      linkCounts.set(id, (linkCounts.get(id) || 0) + 1);
    });
    const { syncSalesCustomerToStudentRegistration } = require('../controllers/salesCustomerController');
    for (const sale of sales) {
      const student = studentsById.get(String(sale.studentRegistrationId));
      if (!student || !syncedIds.has(student.studentId) || linkCounts.get(String(sale.studentRegistrationId)) > 1) {
        const fullSale = await SalesCustomer.findById(sale._id);
        if (fullSale && /^completed$/i.test(fullSale.followupStatus || '')) {
          await syncSalesCustomerToStudentRegistration(fullSale);
        }
      }
    }
  })().finally(() => { pendingSync = null; });
  return pendingSync;
};

const scheduleCompletedSalesSync = () => {
  if (scheduled || pendingSync || Date.now() < nextBackgroundSyncAt) return;
  scheduled = true;
  setImmediate(() => {
    ensureCompletedSalesSynced()
      .catch((error) => console.warn('Background completed sales sync failed:', error.message))
      .finally(() => {
        scheduled = false;
        nextBackgroundSyncAt = Date.now() + 60000;
      });
  });
};

module.exports = { ensureCompletedSalesSynced, scheduleCompletedSalesSync };
