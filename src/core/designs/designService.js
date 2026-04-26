const WebsiteDesign = require('../../models/WebsiteDesign');
const { validateDesignGovernance } = require('../governance/validationRules');
const { validateThemeTokens, TYPOGRAPHY_SCALE, SPACING_SCALE } = require('../../utils/apiContract');

function normalizeDesignPayload(payload = {}) {
  const next = { ...(payload || {}) };
  const keys = Object.keys(next);
  const hasThemeDotPath = keys.some((key) => key.startsWith('theme.'));
  const hasTemplateDotPath = keys.some((key) => key.startsWith('template.'));

  if (!hasThemeDotPath && next.theme && typeof next.theme === 'object') {
    const theme = { ...next.theme };
    const canonicalTokens = theme.tokens || {};
    const legacyTokens = theme.customTokens || {};

    // Preserve both namespaces for backward compatibility across editors/runtimes.
    theme.tokens = { ...legacyTokens, ...canonicalTokens };
    theme.customTokens = { ...canonicalTokens, ...legacyTokens };
    next.theme = theme;
  }

  if (!hasTemplateDotPath && next.template && typeof next.template === 'object') {
    next.template = {
      version: '1.0.0',
      layoutMode: 'legacy',
      ...next.template
    };
  }
  if (next.theme && typeof next.theme === 'object') {
    next.theme.typography = {
      ...TYPOGRAPHY_SCALE,
      ...(next.theme.typography || {})
    };
    next.theme.spacingScale = Array.isArray(next.theme.spacingScale)
      ? next.theme.spacingScale
      : [...SPACING_SCALE];
    const tokenErrors = validateThemeTokens(next.theme);
    if (tokenErrors.length > 0) {
      throw new Error(`Invalid theme tokens: ${tokenErrors.join(', ')}`);
    }
  }
  return next;
}

async function getAllDesigns() {
  return WebsiteDesign.find({}).sort({ updatedAt: -1 });
}

async function getDesignByProject(projectName) {
  const design = await WebsiteDesign.findOne({ projectName });
  if (!design) throw new Error('Design not found for this project');
  return design;
}

async function createOrUpdateDesign(projectName, payload) {
  const normalizedPayload = normalizeDesignPayload(payload);
  validateDesignGovernance(normalizedPayload);
  const update = {
    ...normalizedPayload,
    projectName,
    updatedAt: new Date()
  };
  return WebsiteDesign.findOneAndUpdate(
    { projectName },
    update,
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
}

async function deleteDesign(projectName) {
  const result = await WebsiteDesign.deleteOne({ projectName });
  if (!result.deletedCount) throw new Error('Design not found for this project');
}

module.exports = {
  getAllDesigns,
  getDesignByProject,
  createOrUpdateDesign,
  deleteDesign
};
