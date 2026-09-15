const { periodRange } = require('./departmentKpiAnalytics');
const DEFINITIONS = [
  ['b2bEmails', 'B2B', 'Emails sent', 120],
  ['b2bWhatsapp', 'B2B', 'WhatsApp responded', 90],
  ['b2bTestimonials', 'B2B', 'Testimonials collected', 2],
  ['b2bServices', 'B2B', 'Services delivered', 40],
  ['b2bCustomers', 'B2B', 'Customers served', 30],
  ['b2bContracts', 'B2B', 'Contracts signed', 2],
  ['b2bDeals', 'B2B', 'Deals closed', 5, 'Based on package (5)'],
  ['b2bBuyers', 'B2B', 'Buyers gained', 180],
  ['b2bSuppliers', 'B2B', 'Suppliers gained', 200],
  ['b2bMatchmaking', 'B2B', 'Successful matchmaking sessions', 10],
  ['b2bComplaintsReceived', 'B2B', 'Complaints received', 15],
  ['b2bComplaintsResolved', 'B2B', 'Complaints resolved', 15],
  ['trainingTrainees', 'Training', 'Trainees served', 60],
  ['trainingComplaintsReceived', 'Training', 'Complaints received', 15],
  ['trainingComplaintsResolved', 'Training', 'Complaints resolved', 15],
  ['trainingDeals', 'Training', 'Deals closed', 60],
  ['trainingCalls', 'Training', 'Phone calls made', 60],
  ['trainingTestimonials', 'Training', 'Testimonials collected', 60],
  ['trainingTelegram', 'Training', 'Telegram responded', 60],
  ['trainingData', 'Training', 'Customer data collected', 60],
];
const defaults = () => DEFINITIONS.map(([key, section, kpi, target, notes = '']) => ({ key, section, kpi, target, actual: null, notes }));
function validateReport(body) {
  const { periodType, periodKey } = body;
  periodRange(periodType, periodKey);
  if (!Array.isArray(body.metrics) || body.metrics.length !== DEFINITIONS.length) throw new Error('Complete all 20 KPI rows.');
  const metrics = defaults().map((definition) => {
    const matches = body.metrics.filter((row) => row?.key === definition.key);
    if (matches.length !== 1) throw new Error(`Missing or duplicate KPI: ${definition.kpi}`);
    const row = matches[0];
    for (const field of ['target', 'actual']) {
      if (typeof row[field] !== 'number' || !Number.isSafeInteger(row[field]) || row[field] < 0) throw new Error(`${definition.kpi}: enter a non-negative whole number for ${field}.`);
    }
    return { ...definition, target: row.target, actual: row.actual };
  });
  return { periodType, periodKey, metrics };
}
module.exports = { defaults, validateReport };
