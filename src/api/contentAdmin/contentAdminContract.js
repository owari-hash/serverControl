/**
 * Single source of truth for `/api/v2/content-admin` paths and text-field rules.
 * Handoff: CONTENT_ADMIN_HANDOFF.md — full HTTP: CONTENT_ADMIN_API.md
 */

/** Keys accepted by POST .../blocks/:instanceId/text (merged into component props). */
const CONTENT_ADMIN_TEXT_FIELD_KEYS = [
  "title",
  "subtitle",
  "description",
  "content",
  "copyright",
  "welcomeMessage",
  "placeholder",
  "sendButtonText",
  "launcherLabel",
  "openButtonText",
  "closeButtonText",
  "confirmButtonText",
  "submitButtonText",
  "cancelButtonText",
  "loadingText",
  "agentName",
  "offlineMessage",
  "textColor",
  "backgroundColor",
  "borderColor",
  "accentColor",
  "className",
  "variant",
  "theme",
  "align",
  "spacing",
  "fontSize",
];

/**
 * Paths relative to the v2 API root (e.g. cmsSuperAdmin `getApiBaseUrl()` which ends in `/api/v2`).
 */
const CONTENT_ADMIN_PATHS = {
  componentTypes: "/content-admin/component-types",
  blocks: "/content-admin/blocks",
  blocksTree: "/content-admin/blocks/tree",
  blockText: (instanceId) =>
    `/content-admin/blocks/${encodeURIComponent(instanceId)}/text`,
  blockImages: (instanceId) =>
    `/content-admin/blocks/${encodeURIComponent(instanceId)}/images`,
  blockMedia: (instanceId) =>
    `/content-admin/blocks/${encodeURIComponent(instanceId)}/media`,
  blockElements: (instanceId) =>
    `/content-admin/blocks/${encodeURIComponent(instanceId)}/elements`,
};

module.exports = {
  CONTENT_ADMIN_TEXT_FIELD_KEYS,
  CONTENT_ADMIN_PATHS,
};
