const METRICS = [
  { key: 'coc', title: 'COC exam students', unit: 'Students' },
  { key: 'online', title: 'Online final exam students', unit: 'Students' },
  { key: 'students', title: 'New registered students', unit: 'Students' },
  { key: 'evaluations', title: 'Evaluations submitted', unit: 'Evaluations' },
];

function periodFor(timeframe, date) {
  if (!['weekly', 'monthly', 'quarterly'].includes(timeframe)) throw new Error('Choose weekly, monthly or quarterly.');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose a valid reporting date.');
  const start = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== date) throw new Error('Choose a valid reporting date.');
  if (timeframe === 'weekly') start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  else {
    start.setUTCDate(1);
    if (timeframe === 'quarterly') start.setUTCMonth(Math.floor(start.getUTCMonth() / 3) * 3);
  }
  const end = new Date(start);
  if (timeframe === 'weekly') end.setUTCDate(end.getUTCDate() + 6);
  else {
    end.setUTCMonth(end.getUTCMonth() + (timeframe === 'monthly' ? 1 : 3));
    end.setUTCDate(end.getUTCDate() - 1);
  }
  return { timeframe, periodStart: start.toISOString().slice(0, 10), periodEnd: end.toISOString().slice(0, 10) };
}

function validateReport(body) {
  const period = periodFor(body.timeframe, body.date);
  if (!['draft', 'submitted'].includes(body.status)) throw new Error('Choose draft or submitted status.');
  if (!Number.isSafeInteger(body.revision) || body.revision < 0) throw new Error('Reload this report before saving.');
  if (!Array.isArray(body.metrics) || body.metrics.length !== METRICS.length) throw new Error('Provide all four KPI metrics.');
  const metrics = METRICS.map(({ key, title }) => {
    const rows = body.metrics.filter((row) => row?.key === key);
    if (rows.length !== 1) throw new Error(`Provide one result for ${title}.`);
    const { target, actual } = rows[0];
    for (const [field, value] of Object.entries({ target, actual })) {
      if (value === null && body.status === 'draft') continue;
      if (!Number.isSafeInteger(value) || value < 0 || (field === 'target' && value === 0)) {
        throw new Error(`${title}: ${field === 'target' ? 'target must be a positive whole number' : 'actual must be zero or a positive whole number'}.`);
      }
    }
    return { key, target, actual };
  });
  if (typeof body.notes !== 'string' || body.notes.length > 3000) throw new Error('Notes must be 3,000 characters or fewer.');
  const result = { ...period, status: body.status, metrics, notes: body.notes.trim() };
  return result;
}

function cooMetrics(report) {
  if (!report || report.status !== 'submitted') return [];
  return METRICS.map(({ key, title, unit }) => {
    const row = report.metrics?.find((item) => item.key === key);
    return { id: `tessbin-${key}`, department: 'Tessbin', name: title, unit,
      target: row?.target ?? null, actual: row?.actual ?? null,
      source: 'Submitted Tessbin KPI report', updatedAt: report.updatedAt, submittedAt: report.submittedAt };
  });
}

module.exports = { METRICS, periodFor, validateReport, cooMetrics };
