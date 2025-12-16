const TEAM_REQUESTS_LAST_SEEN_KEY = 'financeTeamRequestsLastSeen';

const isBrowser = typeof window !== 'undefined';
const getStorage = () => (isBrowser ? window.localStorage : null);

const normalizeDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getTeamRequestsLastSeenAt = () => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(TEAM_REQUESTS_LAST_SEEN_KEY);
  const date = normalizeDate(raw);
  return date || null;
};

export const setTeamRequestsLastSeenAt = (value) => {
  if (!isBrowser) return;
  const normalized = normalizeDate(value) || new Date();
  window.localStorage.setItem(TEAM_REQUESTS_LAST_SEEN_KEY, normalized.toISOString());
};

export const markTeamRequestsAsRead = (referenceDate) => {
  const normalized = normalizeDate(referenceDate) || new Date();
  const previous = getTeamRequestsLastSeenAt();
  if (previous && normalized <= previous) return;
  setTeamRequestsLastSeenAt(normalized);
};

export const getRequestCreatedAt = (request) => {
  if (!request) return null;
  if (request.createdAt) {
    const candidate = normalizeDate(request.createdAt);
    if (candidate) return candidate;
  }
  if (request.date) {
    const candidate = normalizeDate(request.date);
    if (candidate) return candidate;
  }
  return null;
};

export const getLatestRequestTimestamp = (requests = []) => {
  if (!Array.isArray(requests) || requests.length === 0) return null;
  return requests.reduce((latest, request) => {
    const candidate = getRequestCreatedAt(request);
    if (!candidate) return latest;
    if (!latest || candidate > latest) {
      return candidate;
    }
    return latest;
  }, null);
};