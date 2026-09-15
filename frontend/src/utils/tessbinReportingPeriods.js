const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const iso = (date) => date.toISOString().slice(0, 10);
const labelDate = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function reportingPeriodStart(timeframe, date) {
  const start = new Date(`${date}T00:00:00Z`);
  if (timeframe === 'weekly') start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  else {
    start.setUTCDate(1);
    if (timeframe === 'quarterly') start.setUTCMonth(Math.floor(start.getUTCMonth() / 3) * 3);
  }
  return iso(start);
}

export function reportingPeriodOptions(timeframe, year, today) {
  const currentStart = reportingPeriodStart(timeframe, today);
  if (timeframe === 'weekly') {
    const first = `${year}-01-01`;
    const cursor = new Date(`${reportingPeriodStart('weekly', first)}T00:00:00Z`);
    const last = `${year}-12-31`;
    const options = [];
    while (iso(cursor) <= last) {
      const start = iso(cursor);
      const end = new Date(cursor);
      end.setUTCDate(end.getUTCDate() + 6);
      options.push({ value: start < first ? first : start, start,
        label: `${start === currentStart ? 'This week · ' : ''}${labelDate(cursor)} – ${labelDate(end)}` });
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
    return options;
  }
  const count = timeframe === 'monthly' ? 12 : 4;
  return Array.from({ length: count }, (_, index) => {
    const month = timeframe === 'monthly' ? index : index * 3;
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const label = timeframe === 'monthly' ? MONTHS[month] : `Q${index + 1} · ${MONTHS[month]} – ${MONTHS[month + 2]}`;
    return { value: start, start, label: `${label}${start === currentStart ? ` (This ${timeframe === 'monthly' ? 'month' : 'quarter'})` : ''}` };
  });
}
