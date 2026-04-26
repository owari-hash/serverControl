/**
 * Known component types accepted by @cms-builder/core (ComponentRegistry).
 * Keep in sync with: cmsBuilder/src/engine/ComponentRegistry.ts
 *
 * The database still allows any string unless STRICT_COMPONENT_TYPES is enabled.
 */

const COMPONENT_TYPE_META = {
  header: "section",
  hero: "section",
  about: "section",
  footer: "section",
  services: "section",
  features: "section",
  promo: "section",
  clients: "section",
  pricing: "section",
  contact: "section",
  text: "section",
  news: "section",
  rental: "section",
  jobs: "section",
  "contact-form": "section",
  twocolumn: "layout",
  grid: "layout",
  card: "layout",
  container: "layout",
  section: "layout",
  pagination: "section",
  button: "primitive",
  modal: "primitive",
  chatbot: "primitive",
  livechat: "primitive",
};

const ALLOWED = Object.freeze(Object.keys(COMPONENT_TYPE_META));
const allowedSet = new Set(ALLOWED.map((t) => t.toLowerCase()));

/**
 * Superadmin WixBuilder persists canvas free elements as child instances with
 * `componentType: free_<kind>` (see cmsSuperAdmin WixBuilder pagesToComponents).
 * Keep suffixes aligned with builder free-element kinds.
 */
const FREE_CANVAS_KINDS = new Set([
  "text",
  "button",
  "input",
  "image",
  "card",
  "section",
  "divider",
  "badge",
  "menu",
]);

function normalizeType(type) {
  return typeof type === "string" ? type.trim().toLowerCase() : "";
}

/** `free_text`, `free_divider`, … — stored as component rows, not cmsBuilder section roots */
function isFreeCanvasChildType(componentType) {
  const t = normalizeType(componentType);
  if (!t.startsWith("free_")) return false;
  const kind = t.slice("free_".length);
  return FREE_CANVAS_KINDS.has(kind);
}

function isAllowedComponentType(componentType) {
  const t = normalizeType(componentType);
  if (isFreeCanvasChildType(t)) return true;
  return allowedSet.has(t);
}

function listComponentTypes() {
  return ALLOWED.map((type) => ({
    type,
    category: COMPONENT_TYPE_META[type],
  })).sort((a, b) => a.type.localeCompare(b.type));
}

module.exports = {
  ALLOWED_COMPONENT_TYPES: ALLOWED,
  COMPONENT_TYPE_META,
  FREE_CANVAS_KINDS,
  isFreeCanvasChildType,
  isAllowedComponentType,
  listComponentTypes,
};
