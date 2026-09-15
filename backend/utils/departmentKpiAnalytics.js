const DEPARTMENTS = ['Sales', 'IT', 'Tradex TV', 'Tessbin', 'HR', 'Customer Success', 'Finance', 'Supervisor', 'Social Media', 'Ensira'];
const finite = (value) => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function periodRange(type, key) {
  let start;
  let end;
  let match;
  if (type === 'monthly' && (match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(key))) {
    start = new Date(Date.UTC(+match[1], +match[2] - 1, 1));
    end = new Date(Date.UTC(+match[1], +match[2], 1));
  } else if (type === 'quarterly' && (match = /^(\d{4})-Q([1-4])$/.exec(key))) {
    start = new Date(Date.UTC(+match[1], (+match[2] - 1) * 3, 1));
    end = new Date(Date.UTC(+match[1], +match[2] * 3, 1));
  } else if (type === 'weekly' && (match = /^(\d{4})-W(0[1-9]|[1-4]\d|5[0-3])$/.exec(key))) {
    const jan4 = new Date(Date.UTC(+match[1], 0, 4));
    start = new Date(jan4);
    start.setUTCDate(4 - ((jan4.getUTCDay() + 6) % 7) + (+match[2] - 1) * 7);
    const thursday = new Date(start);
    thursday.setUTCDate(start.getUTCDate() + 3);
    if (thursday.getUTCFullYear() !== +match[1]) throw new Error('Invalid reporting period');
    end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);
  } else throw new Error('Invalid reporting period');
  return { start, end };
}

function analyzeMetrics(records, period) {
  const metrics = records.map((record) => {
    const actual = finite(record.actual);
    const target = finite(record.target);
    const comparable = actual !== null && actual >= 0 && target !== null && (target > 0 || (record.lowerIsBetter && target === 0));
    const met = comparable && (record.lowerIsBetter ? actual <= target : actual >= target);
    let achievement = comparable ? (record.lowerIsBetter ? (actual === 0 ? 100 : target / actual * 100) : actual / target * 100) : null;
    if (!Number.isFinite(achievement)) achievement = null;
    const gap = comparable ? Math.max(0, record.lowerIsBetter ? actual - target : target - actual) : null;
    const status = actual === null ? 'Not reported' : !comparable ? 'No measurable target' : met ? 'Target met' : 'Below target';
    const analysis = actual === null ? 'No actual result has been recorded.' : !comparable ? 'Actual result recorded; no measurable target is configured.' : met ? 'The recorded result meets the target.' : `${Number(gap.toFixed(2))} ${record.unit || 'units'} ${record.lowerIsBetter ? 'above the maximum target' : 'remaining to reach the target'}.`;
    return { ...record, actual, target, achievement, gap, status, analysis, period };
  });
  const departments = DEPARTMENTS.map((name) => {
    const rows = metrics.filter((metric) => metric.department === name);
    const scored = rows.filter((metric) => metric.achievement !== null);
    const met = scored.filter((metric) => metric.status === 'Target met').length;
    return { name, count: rows.length, scored: scored.length, met, achievement: scored.length ? scored.reduce((sum, metric) => sum + metric.achievement, 0) / scored.length : null,
      analysis: !rows.length ? 'No operational KPI records are available for this period.' : `${met} of ${scored.length} measurable KPIs met their targets. ${rows.length - scored.length} KPI(s) cannot be scored.` };
  });
  const distribution = [{ name: 'Target met', color: '#22c55e' }, { name: 'Below target', color: '#f59e0b' }, { name: 'No measurable target', color: '#94a3b8' }, { name: 'Not reported', color: '#cbd5e1' }]
    .map((item) => ({ ...item, value: metrics.filter((metric) => metric.status === item.name).length }));
  return { metrics, departments, distribution };
}
module.exports = { DEPARTMENTS, periodRange, analyzeMetrics, slug };
