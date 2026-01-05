const asyncHandler = require('express-async-handler');
const Request = require('../models/Request');

const ROLE_DEPARTMENT_MAP = {
  admin: 'Admin',
  finance: 'Finance',
  hr: 'HR',
  sales: 'Sales',
  salesmanager: 'Sales',
  supervisor: 'Sales',
  customerservice: 'Customer Success',
  customersuccess: 'Customer Success',
  customersuccessmanager: 'Customer Success',
  socialmedia: 'Social Media',
  socialmediamanager: 'Social Media',
  it: 'IT',
  tetv: 'TradexTV',
  tradex: 'TradexTV',
  tradextv: 'TradexTV',
  coo: 'Operations',
  operations: 'Operations',
  eventmanager: 'Events',
};

const PRIVILEGED_ROLES = new Set([
  'admin',
  'coo',
  'finance',
  'hr',
  'supervisor',
  'operations',
]);

const escapeRegExp = (value = '') =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeRole = (role = '') => {
  if (role === null || role === undefined) return '';
  return role.toString().trim().toLowerCase();
};

const getDepartmentFromUser = (user) => {
  if (!user) return null;
  if (user.department) return user.department;
  return ROLE_DEPARTMENT_MAP[normalizeRole(user.role)] || null;
};

const mapStatusToActionStatus = (status) => {
  const normalized = (status || 'Pending').toString().trim().toLowerCase();
  if (normalized === 'approved') return 'in-progress';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'review') return 'review';
  if (normalized === 'pending') return 'open';
  return 'open';
};

const getPriorityBucket = (request, mappedStatus) => {
  const normalized = (request.priority || 'Medium').toString().trim().toLowerCase();
  const dueDate = request.dueDate ? new Date(request.dueDate) : null;
  const now = new Date();
  const dueSoon =
    dueDate &&
    !Number.isNaN(dueDate.getTime()) &&
    dueDate.getTime() >= now.getTime() &&
    dueDate.getTime() - now.getTime() <= 2 * 24 * 60 * 60 * 1000;

  if (normalized === 'high' && dueSoon && mappedStatus !== 'completed') {
    return 'critical';
  }
  if (normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  return 'low';
};

const toIsoString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const buildActionItemPayload = (request) => {
  const status = mapStatusToActionStatus(request.status);
  const priority = getPriorityBucket(request, status);

  return {
    id: request._id.toString(),
    title: request.title || 'Untitled request',
    description: request.details || request.description || '',
    department: request.department || 'Operations',
    priority,
    status,
    timestamp: toIsoString(request.createdAt) || new Date().toISOString(),
    dueDate: toIsoString(request.dueDate),
    assignee: request.requestedBy || 'Operations team',
  };
};

const getActionItems = asyncHandler(async (req, res) => {
  const role = normalizeRole(req.user?.role);
  const isPrivileged = PRIVILEGED_ROLES.has(role);
  const filter = {};

  if (!isPrivileged) {
    const department = getDepartmentFromUser(req.user);
    if (!department) {
      return res.status(403).json({ message: 'Unable to determine department for action items' });
    }
    filter.department = new RegExp(`^${escapeRegExp(department)}$`, 'i');
  }

  const requests = await Request.find(filter)
    .sort({ dueDate: 1, createdAt: -1 })
    .limit(60)
    .lean();

  const items = requests.map(buildActionItemPayload);

  const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
  items.sort((a, b) => {
    const priorityComparison =
      (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
    if (priorityComparison !== 0) return priorityComparison;
    const dateA = new Date(a.dueDate || a.timestamp).getTime() || 0;
    const dateB = new Date(b.dueDate || b.timestamp).getTime() || 0;
    return dateA - dateB;
  });

  res.json({ data: items });
});

module.exports = {
  getActionItems,
};
