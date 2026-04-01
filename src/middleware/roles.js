// Role hierarchy: viewer < analyst < admin
const ROLE_LEVEL = { viewer: 1, analyst: 2, admin: 3 };

/**
 * allowRoles('admin')          → only admins
 * allowRoles('analyst','admin') → analyst or admin
 * minRole('analyst')           → analyst and above
 */
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(" or ")}`,
      });
    }
    next();
  };
}

function minRole(role) {
  return (req, res, next) => {
    if (ROLE_LEVEL[req.user.role] < ROLE_LEVEL[role]) {
      return res.status(403).json({
        error: `Access denied. Minimum required role: ${role}`,
      });
    }
    next();
  };
}

module.exports = { allowRoles, minRole };
