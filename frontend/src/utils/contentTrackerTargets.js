const REQUIRED_COUNTS = {
  Video: 2,
  Graphics: 2,
  'Live Session': 1,
  Testimonial: 1,
};

const SHARE_TARGET = 250;
const BONUS_AMOUNT = 3000;

const ensureTwoDigit = (value) => String(value).padStart(2, '0');

export const buildMonthKey = (value) => {
  if (!value) {
    const now = new Date();
    return `${now.getFullYear()}-${ensureTwoDigit(now.getMonth() + 1)}`;
  }
  const normalized = value.toString();
  const parts = normalized.split('-');
  if (parts.length === 2) {
    return `${parts[0]}-${ensureTwoDigit(parts[1])}`;
  }
  return normalized;
};

export const getMonthRange = (monthKey) => {
  const normalized = buildMonthKey(monthKey);
  const [yearStr, monthStr] = normalized.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const formatMonthLabel = (value) => {
  const normalized = buildMonthKey(value);
  const [yearStr, monthStr] = normalized.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return normalized;
  }
  const date = new Date(year, month - 1);
  return `${date.toLocaleString('en-US', { month: 'long' })} ${year}`;
};

export const normalizeAgentKey = (agent) => {
  if (!agent) return null;
  if (typeof agent === 'string') {
    return agent.trim() || null;
  }
  const id = agent._id || agent.id || agent.userId;
  if (id) {
    return id.toString();
  }
  if (agent.username) {
    return agent.username.toLowerCase();
  }
  if (agent.fullName) {
    return agent.fullName.toLowerCase().replace(/\s+/g, '');
  }
  return null;
};

export const createEmptyCounts = () => {
  return Object.keys(REQUIRED_COUNTS).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
};

export const normalizeTrackerResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? [];
};

export const summarizeEntriesByAgent = (entries = [], monthKey) => {
  const range = getMonthRange(monthKey);
  if (!range) return [];
  const map = new Map();
  entries.forEach((entry) => {
    if (!entry || entry.approved !== true || !entry.date) return;
    const entryDate = new Date(entry.date);
    if (Number.isNaN(entryDate.getTime())) return;
    if (entryDate < range.start || entryDate > range.end) return;

    const agentKey = normalizeAgentKey(entry.createdBy);
    if (!agentKey) return;

    if (!map.has(agentKey)) {
      map.set(agentKey, {
        key: agentKey,
        agent: entry.createdBy,
        counts: createEmptyCounts(),
        shares: 0,
        totalPosts: 0,
      });
    }

    const summary = map.get(agentKey);
    if (entry.type && Object.prototype.hasOwnProperty.call(summary.counts, entry.type)) {
      summary.counts[entry.type] += 1;
    }
    summary.shares += Number(entry.shares) || 0;
    summary.totalPosts += 1;
  });

  return Array.from(map.values()).map((summary) => {
    const isComplete =
      Object.entries(REQUIRED_COUNTS).every(
        ([type, target]) => summary.counts[type] >= target,
      ) && summary.shares >= SHARE_TARGET;
    return {
      ...summary,
      isComplete,
      bonusAmount: isComplete ? BONUS_AMOUNT : 0,
    };
  });
};

export const mapSummariesByKey = (summaries = []) => {
  return summaries.reduce((acc, summary) => {
    if (summary?.key) {
      acc[summary.key] = summary;
    }
    return acc;
  }, {});
};

export {
  REQUIRED_COUNTS,
  SHARE_TARGET,
  BONUS_AMOUNT,
};
