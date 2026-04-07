const crypto = require('crypto');

const MODULE_HEADER = 'x-module';
const PROJECT_HEADER = 'x-project-id';
const allowedModules = new Set([
  'ecommerce',
  'landing',
  'inventory',
  'infrastructure'
]);

function resolveProjectId(req) {
  return (
    req.headers[PROJECT_HEADER] ||
    req.query.projectId ||
    (req.body && req.body.projectId) ||
    null
  );
}

function resolveModule(req) {
  const headerModule = req.headers[MODULE_HEADER];
  if (headerModule) return String(headerModule).toLowerCase();
  if (req.params && req.params.module) return String(req.params.module).toLowerCase();
  return null;
}

function requestContext(req, res, next) {
  const requestId = crypto.randomUUID();
  const projectId = resolveProjectId(req);
  const moduleName = resolveModule(req);

  req.context = {
    requestId,
    projectId,
    module: moduleName
  };

  res.setHeader('x-request-id', requestId);
  return next();
}

function requireProjectContext(req, res, next) {
  if (!req.context || !req.context.projectId) {
    return res.status(400).json({
      success: false,
      error: 'projectId is required (header x-project-id, query, or body)'
    });
  }
  return next();
}

function requireModuleContext(req, res, next) {
  const moduleName = req.context && req.context.module;
  if (!moduleName) {
    return res.status(400).json({
      success: false,
      error: 'module context is required (header x-module or route param)'
    });
  }
  if (!allowedModules.has(moduleName)) {
    return res.status(400).json({
      success: false,
      error: `unsupported module '${moduleName}'`
    });
  }
  return next();
}

module.exports = {
  requestContext,
  requireProjectContext,
  requireModuleContext
};
