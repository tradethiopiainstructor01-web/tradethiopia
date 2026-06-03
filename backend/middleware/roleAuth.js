const normalizeRole = (role = '') =>
  role.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authorized, no user" 
      });
    }

    const userRole = req.user.role || '';
    const normalizedUserRole = normalizeRole(userRole);
    const normalizedRoles = roles.map(normalizeRole);
    const hasAccess = normalizedRoles.includes(normalizedUserRole);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Requires one of these roles: ${roles.join(', ')}. User role: ${userRole}` 
      });
    }

    next();
  };
};

module.exports = { authorize };
