const LAYOUT_LIMITS = {
  canvasWidth: 1440,
  contentMaxWidth: 1200,
  minComponentWidth: 100,
  maxComponentWidth: 1440,
  minComponentHeight: 50,
  maxComponentHeight: 2000,
  /** Canvas / header strip heights (true block layout), not `button` / inline control size */
  minCanvasBlockHeight: 48,
  maxCanvasBlockHeight: 2000,
  maxHeaderCanvasHeight: 220,
  maxFontFamilies: 2,
  maxColorTokens: 5,
};

/**
 * `props.width` / `props.height` on these types are small UI dimensions (e.g. button h-9 = 36),
 * not full-width section layout — do not apply block-level min (50×100) rules to them.
 */
const TOP_LEVEL_SIZE_EXEMPT_TYPES = new Set(['button', 'text', 'pagination', 'link', 'icon']);

const { isFreeCanvasChildType } = require('../components/allowedComponentTypes');

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateComponentGovernance(component = {}) {
  const props = component.props || {};
  const type = String(component.componentType || '').toLowerCase();

  /** WixBuilder `free_*` rows store element height/width (e.g. text line 14px, divider 1px), not section layout. */
  const sizeExempt =
    TOP_LEVEL_SIZE_EXEMPT_TYPES.has(type) || isFreeCanvasChildType(type);

  if (!sizeExempt) {
    const width = props.width;
    const height = props.height;
    if (isFiniteNumber(width) && (width < LAYOUT_LIMITS.minComponentWidth || width > LAYOUT_LIMITS.maxComponentWidth)) {
      throw new Error(`Invalid component width (${width}); allowed range is ${LAYOUT_LIMITS.minComponentWidth}-${LAYOUT_LIMITS.maxComponentWidth}`);
    }
    if (isFiniteNumber(height) && (height < LAYOUT_LIMITS.minComponentHeight || height > LAYOUT_LIMITS.maxComponentHeight)) {
      throw new Error(`Invalid component height (${height}); allowed range is ${LAYOUT_LIMITS.minComponentHeight}-${LAYOUT_LIMITS.maxComponentHeight}`);
    }
  }

  const blockH = props.blockCanvasHeight;
  if (isFiniteNumber(blockH) && (blockH < LAYOUT_LIMITS.minCanvasBlockHeight || blockH > LAYOUT_LIMITS.maxCanvasBlockHeight)) {
    throw new Error(`Invalid blockCanvasHeight (${blockH}); allowed range is ${LAYOUT_LIMITS.minCanvasBlockHeight}-${LAYOUT_LIMITS.maxCanvasBlockHeight}`);
  }
  const headerH = props.headerCanvasHeight;
  if (isFiniteNumber(headerH) && (headerH < LAYOUT_LIMITS.minCanvasBlockHeight || headerH > LAYOUT_LIMITS.maxHeaderCanvasHeight)) {
    throw new Error(`Invalid headerCanvasHeight (${headerH}); allowed range is ${LAYOUT_LIMITS.minCanvasBlockHeight}-${LAYOUT_LIMITS.maxHeaderCanvasHeight}`);
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
