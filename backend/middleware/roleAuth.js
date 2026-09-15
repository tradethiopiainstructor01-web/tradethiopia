const normalizeRole = (r) => String(r || '').toLowerCase().replace(/[\s_-]/g, '');

const checkRoleMatch = (userRoleRaw, requiredRoleRaw) => {
  const u = normalizeRole(userRoleRaw);
  const r = normalizeRole(requiredRoleRaw);
  if (!u || !r) return false;
  if (u === r) return true;

  // Superadmin / Admin access
  if (u === 'superadmin' || (u === 'admin' && r !== 'superadmin')) return true;

  // COO variants (COO, COO2, 2 COO, Operations Director, Executive COO)
  const isCooUser = u.includes('coo') || u.includes('operationsdirector');
  const isCooReq = r.includes('coo') || r.includes('operationsdirector');
  if (isCooUser && isCooReq) return true;

  // CEO variants
  if (u.includes('ceo') && r.includes('ceo')) return true;

  // Sales manager variants
  if (u.includes('salesmanager') && r.includes('salesmanager')) return true;

  // Customer service variants
  if (u.includes('customerservice') && r.includes('customerservice')) return true;

  return false;
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authorized, no user" 
      });
    }

    const userRole = req.user.role || '';
    const hasAccess = roles.some(requiredRole => checkRoleMatch(userRole, requiredRole));
    
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