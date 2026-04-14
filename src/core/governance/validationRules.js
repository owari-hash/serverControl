const LAYOUT_LIMITS = {
  canvasWidth: 1440,
  contentMaxWidth: 1200,
  minComponentWidth: 100,
  maxComponentWidth: 1440,
  minComponentHeight: 50,
  maxComponentHeight: 2000,
  maxFontFamilies: 2,
  maxColorTokens: 5,
};

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateComponentGovernance(component = {}) {
  const props = component.props || {};
  const width = props.width;
  const height = props.height;
  if (isFiniteNumber(width) && (width < LAYOUT_LIMITS.minComponentWidth || width > LAYOUT_LIMITS.maxComponentWidth)) {
    throw new Error(`Invalid component width (${width}); allowed range is ${LAYOUT_LIMITS.minComponentWidth}-${LAYOUT_LIMITS.maxComponentWidth}`);
  }
  if (isFiniteNumber(height) && (height < LAYOUT_LIMITS.minComponentHeight || height > LAYOUT_LIMITS.maxComponentHeight)) {
    throw new Error(`Invalid component height (${height}); allowed range is ${LAYOUT_LIMITS.minComponentHeight}-${LAYOUT_LIMITS.maxComponentHeight}`);
  }
}

function validateDesignGovernance(payload = {}) {
  const tokens = payload?.theme?.tokens || payload?.theme?.customTokens || {};
  const colorTokenKeys = Object.keys(tokens).filter((key) => key.includes('color') || key.includes('surface') || key.includes('text'));
  if (colorTokenKeys.length > LAYOUT_LIMITS.maxColorTokens) {
    throw new Error(`Too many color-related tokens (${colorTokenKeys.length}); max is ${LAYOUT_LIMITS.maxColorTokens}`);
  }
  const typography = payload?.theme?.typography || {};
  const familyCount = Object.keys(typography.fontFamily || {}).length;
  if (familyCount > LAYOUT_LIMITS.maxFontFamilies) {
    throw new Error(`Too many font families (${familyCount}); max is ${LAYOUT_LIMITS.maxFontFamilies}`);
  }
}

module.exports = {
  LAYOUT_LIMITS,
  validateComponentGovernance,
  validateDesignGovernance,
};
