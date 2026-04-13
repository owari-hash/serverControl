const ComponentInstance = require("../../models/ComponentInstance");

/** Allowed string keys merged into `props` (content-only, no layout/theme). */
const TEXT_FIELD_WHITELIST = new Set([
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
]);

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

module.exports = {
  mergeTextProps,
  mergeImageProps,
  mergeMediaItems,
  TEXT_FIELD_WHITELIST,
};
