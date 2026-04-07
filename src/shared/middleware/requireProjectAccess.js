const UserProjectBinding = require('../../models/UserProjectBinding');
const { fail } = require('../http/response');

function resolveProject(req) {
  return (
    (req.context && req.context.projectId) ||
    (req.body && req.body.projectName) ||
    req.params.projectName ||
    req.params.name ||
    null
  );
}

function requireProjectAccess(...requiredBindingRoles) {
  return async (req, res, next) => {
    try {
      const projectName = resolveProject(req);
      if (!projectName) return res.status(400).json(fail('Project context is required'));

      if (req.auth && req.auth.role === 'superadmin') return next();

      const binding = await UserProjectBinding.findOne({
        userEmail: req.auth && req.auth.email,
        projectName,
        status: 'ACTIVE'
      }).lean();

      if (!binding) return res.status(403).json(fail('No access to requested project'));
      if (requiredBindingRoles.length > 0) {
        const hasRole = binding.roles.some((r) => requiredBindingRoles.includes(r));
        if (!hasRole) return res.status(403).json(fail('Project role is insufficient'));
      }

      req.projectBinding = binding;
      return next();
    } catch (error) {
      return res.status(500).json(fail(error.message));
    }
  };
}

module.exports = {
  requireProjectAccess
};
