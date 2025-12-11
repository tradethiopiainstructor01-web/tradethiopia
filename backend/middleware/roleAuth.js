const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authorized, no user" 
      });
    }

    // Log for debugging
    console.log('User role:', req.user.role);
    console.log('Required roles:', roles);
    
    // Simple case-insensitive check
    const userRoleLower = (req.user.role || '').toLowerCase();
    const requiredRolesLower = roles.map(role => role.toLowerCase());
    
    const hasAccess = requiredRolesLower.includes(userRoleLower);
    
    console.log('User role (lowercase):', userRoleLower);
    console.log('Required roles (lowercase):', requiredRolesLower);
    console.log('Access granted:', hasAccess);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Requires one of these roles: ${roles.join(', ')}.` 
      });
    }

    next();
  };
};

module.exports = { authorize };