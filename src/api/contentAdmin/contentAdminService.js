const ComponentInstance = require("../../models/ComponentInstance");
const { CONTENT_ADMIN_TEXT_FIELD_KEYS } = require("./contentAdminContract");

/** Allowed keys merged into `props` via POST .../text (strings + numeric fontSize). */
const TEXT_FIELD_WHITELIST = new Set(CONTENT_ADMIN_TEXT_FIELD_KEYS);

function normalizeImageEntry(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Each image must be an object with url");
  }
  if (typeof raw.url !== "string" || !raw.url.trim()) {
    throw new Error("Each image needs a non-empty url string");
  }
  const out = { url: raw.url.trim() };
  if (raw.alt !== undefined && raw.alt !== null) {
    if (typeof raw.alt !== "string") throw new Error("image.alt must be a string");
    out.alt = raw.alt;
  }
  return out;
}

async function getInstance(projectName, instanceId) {
  const doc = await ComponentInstance.findOne({ projectName, instanceId });
  if (!doc) throw new Error("Component instance not found");
  return doc;
}

/**
 * Merge whitelisted string fields into props (preserves other props keys).
 * @param {Record<string, string>} fields
 */
async function mergeTextProps(projectName, instanceId, fields) {
  const doc = await getInstance(projectName, instanceId);
  const props = { ...(doc.props && typeof doc.props === "object" ? doc.props : {}) };

  for (const [key, value] of Object.entries(fields || {})) {
    if (!TEXT_FIELD_WHITELIST.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (key === "fontSize") {
      const n = typeof value === "number" ? value : Number.parseFloat(String(value));
      if (!Number.isFinite(n)) {
        throw new Error(`Field "${key}" must be a finite number`);
      }
      props[key] = n;
      continue;
    }
    if (typeof value !== "string") {
      throw new Error(`Field "${key}" must be a string`);
    }
    props[key] = value;
  }

  doc.props = props;
  doc.updatedAt = new Date();
  await doc.save();
  return doc;
}

/**
 * @param {'replace'|'append'} mode
 */
async function mergeImageProps(projectName, instanceId, images, mode = "replace") {
  const doc = await getInstance(projectName, instanceId);
  const props = { ...(doc.props && typeof doc.props === "object" ? doc.props : {}) };
  const list = (images || []).map(normalizeImageEntry);

  if (mode === "append") {
    const existing = Array.isArray(props.images) ? props.images : [];
    props.images = [...existing, ...list];
  } else {
    props.images = list;
  }

  doc.props = props;
  doc.updatedAt = new Date();
  await doc.save();
  return doc;
}

/**
 * Media items: currently only kind "image" is supported (URL + alt). Appends or replaces props.images.
 */
async function mergeMediaItems(projectName, instanceId, items, mode = "append") {
  const images = (items || [])
    .filter((item) => item && item.kind === "image")
    .map((item) => ({ url: item.url, alt: item.alt }));

  return mergeImageProps(projectName, instanceId, images, mode === "replace" ? "replace" : "append");
}

const ALLOWED_FREE_ELEMENT_TYPES = new Set([
  "text",
  "button",
  "image",
  "section",
  "card",
  "input",
  "divider",
  "badge",
  "menu",
]);

function sanitizeNavLink(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    label: typeof raw.label === "string" ? raw.label : "",
    href: typeof raw.href === "string" && raw.href.trim() ? raw.href.trim() : "/",
    isExternal: !!raw.isExternal,
  };
}

/**
 * @param {unknown} raw
 * @param {number} index
 */
function sanitizeFreeElement(raw, index) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`elements[${index}] must be an object`);
  }
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) throw new Error(`elements[${index}].id is required`);
  const type = typeof raw.type === "string" ? raw.type.trim() : "";
  if (!ALLOWED_FREE_ELEMENT_TYPES.has(type)) {
    throw new Error(`elements[${index}].type is not an allowed free element type`);
  }
  /** @type {Record<string, unknown>} */
  const out = { id, type };
  const copyStr = (k) => {
    if (raw[k] == null) return;
    if (typeof raw[k] === "string") out[k] = raw[k];
  };
  const copyNum = (k) => {
    if (raw[k] == null) return;
    const n = typeof raw[k] === "number" ? raw[k] : Number.parseFloat(String(raw[k]));
    if (Number.isFinite(n)) out[k] = n;
  };
  copyStr("label");
  copyStr("value");
  copyStr("color");
  copyStr("bg");
  copyStr("placeholder");
  copyStr("align");
  copyStr("href");
  copyStr("src");
  if (raw.width != null) {
    if (typeof raw.width === "string") out.width = raw.width;
    else if (typeof raw.width === "number" && Number.isFinite(raw.width)) out.width = raw.width;
  }
  copyNum("radius");
  copyNum("size");
  copyNum("height");
  if (raw.isExternal != null) out.isExternal = !!raw.isExternal;
  if (type === "menu" && Array.isArray(raw.links)) {
    out.links = raw.links.map(sanitizeNavLink).filter(Boolean);
  }
  return out;
}

/**
 * Replace props._elements (freeform canvas elements from superadmin / client admin).
 * @param {unknown[]} elements
 */
async function replaceElementsProps(projectName, instanceId, elements) {
  const doc = await getInstance(projectName, instanceId);
  const props = { ...(doc.props && typeof doc.props === "object" ? doc.props : {}) };
  const list = Array.isArray(elements)
    ? elements.map((el, i) => sanitizeFreeElement(el, i))
    : [];
  props._elements = list;
  doc.props = props;
  doc.updatedAt = new Date();
  await doc.save();
  return doc;
}

module.exports = {
  mergeTextProps,
  mergeImageProps,
  mergeMediaItems,
  replaceElementsProps,
  TEXT_FIELD_WHITELIST,
};
