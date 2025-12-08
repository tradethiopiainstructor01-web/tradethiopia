// middleware to authorize based on user roles
const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();

// Authorize if the user's normalized role matches any allowed role (case/space insensitive)
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  const user = req.user;
  if (!user || !user.role) return res.status(403).json({ message: 'Role required' });

  const normalizedAllowed = allowedRoles.map(normalizeRole);
  const userRole = normalizeRole(user.role);

  if (!normalizedAllowed.includes(userRole)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};

module.exports = { authorizeRoles };
