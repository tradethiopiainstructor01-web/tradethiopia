const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authorized, no user" 
      });
    }

    // Convert roles to lowercase for case-insensitive comparison
    const normalizedRoles = roles.map(role => role.toLowerCase());
    const userRole = (req.user.role || '').toLowerCase();
    
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Requires one of these roles: ${roles.join(', ')}.` 
      });
    }

    next();
  };
};

module.exports = { authorize };