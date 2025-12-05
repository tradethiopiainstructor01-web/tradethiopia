// middleware to authorize based on user roles
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  const user = req.user;
  if (!user || !user.role) return res.status(403).json({ message: 'Role required' });
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};

module.exports = { authorizeRoles };
