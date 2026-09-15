const Notification = require('../models/Notification');
const User = require('../models/user.model');
const DEPARTMENTS = { sales: 'Sales', hr: 'HR', finance: 'Finance', customer_services: 'Customer Success', tessbin: 'Tessbin', social_media: 'Social Media', it: 'IT', tradex: 'Tradex TV', ensira: 'Ensira', supervisor: 'Supervisor' };

function periodKeyFor(type, date) {
  if (type === 'monthly') return date.slice(0, 7);
  if (type === 'quarterly') return `${date.slice(0, 4)}-Q${Math.ceil(Number(date.slice(5, 7)) / 3)}`;
  const day = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const year = day.getUTCFullYear();
  const week = Math.ceil(((day - new Date(Date.UTC(year, 0, 1))) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

async function notifyKpiSubmission(req, { departmentId, periodType, periodKey, reportId, notes = '' }) {
  const department = DEPARTMENTS[departmentId];
  if (!department) throw new Error('Unknown KPI department');
  const users = await User.find({ role: { $regex: /^(coo[\s_-]*2?|2[\s_-]*coo|ceo|admin|superadmin)$/i } }).select('_id');
  const submittedByName = req.user?.fullName || req.user?.name || req.user?.username || `${department} department`;
  const title = `${department} KPI Report Submitted (${periodKey})`;
  const link = `/coo2?dept=${departmentId}&periodType=${periodType}&periodKey=${encodeURIComponent(periodKey)}`;
  const docs = users.map((user) => ({ user: user._id, text: `${submittedByName} submitted the ${department} ${periodType} KPI report (${periodKey}).`,
    type: 'kpi_submission', category: 'kpi', link,
    metadata: { title, department, departmentId, periodType, periodKey, reportId, managerComment: notes, submittedByName, submittedAt: new Date(), actionLabel: 'View in COO2 Dashboard' },
  }));
  const saved = docs.length ? await Notification.insertMany(docs) : [];
  // Delivery to offline users is persisted above; socket failure must not undo a saved alert.
  try {
    const io = req.app?.get('io');
    const connected = req.app?.get('connectedUsers');
    for (const doc of saved) {
      const socketId = connected?.get(String(doc.user));
      if (io && socketId) io.to(socketId).emit('newNotification', doc.toObject ? doc.toObject() : doc);
    }
  } catch (error) { console.error('KPI notification socket delivery failed:', error.message); }
  return saved;
}
module.exports = { notifyKpiSubmission, periodKeyFor, DEPARTMENTS };
