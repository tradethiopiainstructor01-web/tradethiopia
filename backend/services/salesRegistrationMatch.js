const SalesCustomer = require('../models/SalesCustomer');
const StudentRegistration = require('../models/StudentRegistration');

const exact = (value) => new RegExp(`^${String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

const findSalesRegistration = async (sale) => {
  const isClaimed = (id) => SalesCustomer.exists({
    _id: { $ne: sale._id }, studentRegistrationId: id,
  });
  if (sale.studentRegistrationId && !await isClaimed(sale.studentRegistrationId)) {
    const linked = await StudentRegistration.findById(sale.studentRegistrationId);
    if (linked) return linked;
  }

  // Contact details alone are not identity: different students may share them.
  const candidate = await StudentRegistration.findOne({
    fullName: exact(sale.customerName || ''),
    learningDepartment: exact(sale.courseName || sale.productInterest || sale.contactTitle || 'General'),
    ...(sale.email ? { email: exact(sale.email) } : sale.phone ? { phone: sale.phone.trim() } : {}),
  });
  return candidate && !await isClaimed(candidate._id) ? candidate : null;
};

module.exports = { findSalesRegistration };
