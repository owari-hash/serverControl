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

function normalizeType(type) {
  return typeof type === "string" ? type.trim().toLowerCase() : "";
}

function isAllowedComponentType(componentType) {
  return allowedSet.has(normalizeType(componentType));
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
  isAllowedComponentType,
  listComponentTypes,
};
