const { isAllowedComponentType } = require('../core/components/allowedComponentTypes');

function envelope(data, version = '1.1.0') {
  return { version, data };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function strictComponentTypesEnabled() {
  const v = process.env.STRICT_COMPONENT_TYPES;
  return v === '1' || v === 'true' || v === 'yes';
}

function validateComponentPayload(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }
  if (!isNonEmptyString(data.componentType)) {
    errors.push('componentType is required');
  } else if (strictComponentTypesEnabled() && !isAllowedComponentType(data.componentType)) {
    errors.push(
      `componentType "${String(data.componentType).trim()}" is not in the allowed list (set STRICT_COMPONENT_TYPES=0 to allow any type)`,
    );
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
