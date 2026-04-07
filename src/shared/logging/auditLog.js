function auditLog(req, action, metadata = {}) {
  const entry = {
    at: new Date().toISOString(),
    action,
    actor: req.auth ? req.auth.email : 'anonymous',
    role: req.auth ? req.auth.role : 'none',
    projectId: req.context ? req.context.projectId : null,
    requestId: req.context ? req.context.requestId : null,
    ...metadata
  };
  // Structured log output for aggregation.
  console.log('[AUDIT]', JSON.stringify(entry));
}

module.exports = {
  auditLog
};
