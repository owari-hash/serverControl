function envelope(data, version = '1.1.0') {
  return { version, data };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateComponentPayload(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }
  if (!isNonEmptyString(data.componentType)) {
    errors.push('componentType is required');
  }
  if (!isNonEmptyString(data.pageRoute)) {
    errors.push('pageRoute is required');
  }
  if (data.order !== undefined && (!Number.isInteger(data.order) || data.order < 0)) {
    errors.push('order must be a non-negative integer');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  envelope,
  validateComponentPayload
};
