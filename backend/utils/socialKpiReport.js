const groups = {
  'Content publication': [['totalPosts', 'Total posts'], ['totalFollowers', 'Total followers growth'], ['views', 'Total views'], ['leads', 'Leads generated'], ['campaigns', 'Campaigns run'], ['images', 'Images produced'], ['videos', 'Videos produced']],
  'Platform posts': ['Facebook', 'LinkedIn', 'Twitter', 'Instagram', 'Telegram', 'YouTube', 'Google'].map(name => [`posts${name}`, `${name} posts`]),
  'Followers growth': ['Facebook', 'LinkedIn', 'Twitter', 'Instagram', 'Telegram Tesbinn', 'Telegram Local B2B', 'TikTok', 'YouTube'].map(name => [`followers${name.replaceAll(' ', '')}`, name]),
};
const defaults = () => Object.entries(groups).flatMap(([section, rows]) => rows.map(([id, label]) => ({ id, label, section, target: null, actual: null })));
function resolvePeriod(periodType, periodKey) {
  const patterns = { weekly: /^(\d{4})-W(\d{2})$/, monthly: /^(\d{4})-(\d{2})$/, quarterly: /^(\d{4})-Q([1-4])$/, yearly: /^(\d{4})$/ };
  const match = typeof periodKey === 'string' && patterns[periodType]?.exec(periodKey);
  if (!match || Number(match[1]) < 1900 || Number(match[1]) > 9998) throw new Error('Choose a valid weekly, monthly, quarterly or yearly period.');
  const year = Number(match[1]);
  const value = Number(match[2]);
  let start;
  let end;
  if (periodType === 'weekly') {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    start = new Date(Date.UTC(year, 0, 4 - ((jan4.getUTCDay() || 7) - 1) + (value - 1) * 7));
    const thursday = new Date(start.getTime() + 3 * 86400000);
    if (value < 1 || value > 53 || thursday.getUTCFullYear() !== year) throw new Error('Choose a valid ISO week.');
    end = new Date(start.getTime() + 6 * 86400000);
  } else if (periodType === 'yearly') {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year, 11, 31));
  } else {
    if (value < 1 || value > (periodType === 'monthly' ? 12 : 4)) throw new Error('Choose a valid reporting period.');
    const month = periodType === 'monthly' ? value - 1 : (value - 1) * 3;
    start = new Date(Date.UTC(year, month, 1));
    end = new Date(Date.UTC(year, month + (periodType === 'monthly' ? 1 : 3), 0));
  }
  return { periodType, periodKey, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}
function validateReport(body) {
  const period = resolvePeriod(body.periodType, body.periodKey);
  const expected = defaults();
  if (!Array.isArray(body.metrics) || body.metrics.length !== expected.length || new Set(body.metrics.map(row => row?.id)).size !== expected.length) throw new Error('Complete all KPI rows.');
  const metrics = expected.map(row => {
    const input = body.metrics.find(item => item?.id === row.id);
    if (!input || ![input.target, input.actual].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error(`Enter non-negative whole numbers for ${row.label}.`);
    return { ...row, target: input.target, actual: input.actual, achievement: input.target > 0 ? Math.round(input.actual / input.target * 10000) / 100 : null };
  });
  const result = { ...period, metrics };
  for (const key of ['seoTarget', 'seoActual', 'summaryNotes']) {
    if (body[key] != null && (typeof body[key] !== 'string' || body[key].length > 5000)) throw new Error('Notes must be text of at most 5,000 characters.');
    result[key] = (body[key] || '').trim();
  }
  if (body.evidencePhotos != null) {
    if (!Array.isArray(body.evidencePhotos)) throw new Error('Evidence photos must be an array.');
    if (body.evidencePhotos.length > 3) throw new Error('You can attach at most 3 evidence photos.');
    result.evidencePhotos = body.evidencePhotos.filter((p) => typeof p === 'string' && p.trim().length > 0).slice(0, 3);
  } else {
    result.evidencePhotos = [];
  }
  return result;
}
module.exports = { defaults, validateReport, resolvePeriod };
