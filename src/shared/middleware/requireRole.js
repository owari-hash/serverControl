const { fail } = require('../http/response');

function requireRole(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  return (req, res, next) => {
    const role = req.auth && req.auth.role;
    if (!role || !allowed.has(role)) {
      return res.status(403).json(fail('Insufficient role permissions'));
    }
    return next();
  };
}

module.exports = {
  requireRole
};
