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

const DESIGN_CONSTRAINTS = Object.freeze({
  canvasWidth: 1440,
  contentWidth: 1200,
  minComponentWidth: 100,
  maxComponentWidth: 1440,
  snap: 8,
  maxColors: 5,
  maxFontFamilies: 2
});

const TYPOGRAPHY_SCALE = Object.freeze({
  h1: 48,
  h2: 36,
  h3: 28,
  body: 16,
  small: 14
});

const SPACING_SCALE = Object.freeze([4, 8, 16, 24, 32, 48, 64, 80, 96]);

function isHexColor(v) {
  return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v.trim());
}

function validateThemeTokens(theme) {
  const errors = [];
  if (!theme || typeof theme !== 'object') return errors;
  const colors = [
    theme.primaryColor,
    theme.secondaryColor,
    theme.background,
    theme.text,
    theme.muted
  ].filter(Boolean);
  if (colors.length > DESIGN_CONSTRAINTS.maxColors) {
    errors.push(`theme color count exceeds ${DESIGN_CONSTRAINTS.maxColors}`);
  }
  colors.forEach((c, idx) => {
    if (!isHexColor(c)) errors.push(`theme color #${idx + 1} must be #RRGGBB`);
  });
  if (theme.typography && typeof theme.typography === 'object') {
    const allowedKeys = Object.keys(TYPOGRAPHY_SCALE);
    for (const key of Object.keys(theme.typography)) {
      if (!allowedKeys.includes(key)) errors.push(`unsupported typography token: ${key}`);
      const size = Number(theme.typography[key]);
      if (!Number.isFinite(size) || size < 10 || size > 96) {
        errors.push(`typography.${key} must be between 10 and 96`);
      }
    }
  }
  if (theme.spacingScale && Array.isArray(theme.spacingScale)) {
    const valid = theme.spacingScale.every((n) => SPACING_SCALE.includes(Number(n)));
    if (!valid) errors.push(`spacingScale values must be from [${SPACING_SCALE.join(', ')}]`);
  }
  return errors;
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
  validateComponentPayload,
  validateThemeTokens,
  DESIGN_CONSTRAINTS,
  TYPOGRAPHY_SCALE,
  SPACING_SCALE
};
