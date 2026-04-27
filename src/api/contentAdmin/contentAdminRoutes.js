/**
 * Content-admin HTTP handlers. Machine-readable contract: ./contentAdminContract.js
 */
const express = require("express");
const { ok, fail } = require("../../shared/http/response");
const { auditLog } = require("../../shared/logging/auditLog");
const componentService = require("../../core/components/componentService");
const contentAdminService = require("./contentAdminService");
const { listComponentTypes } = require("../../core/components/allowedComponentTypes");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../../public/uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "-"));
  },
});
const upload = multer({ storage });

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json(fail("No file uploaded"));
  const url = `http://202.179.6.77:4000/uploads/${req.file.filename}`;
  res.json(ok({ success: true, url }));
});

/**
 * GET /component-types
 * Types supported by the current @cms-builder/core registry (for forms / validation UX).
 */
router.get("/component-types", (req, res) => {
  res.json(ok({ success: true, components: listComponentTypes() }));
});

/**
 * GET /blocks?pageRoute=...
 * Authenticated list of component instances for editing (same data as public list; gated for editors).
 */
router.get("/blocks", async (req, res) => {
  try {
    const components = await componentService.list(
      req.context.projectId,
      req.query.pageRoute,
    );
    res.json(ok({ success: true, components }));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

/**
 * GET /blocks/tree?pageRoute=... (required)
 */
router.get("/blocks/tree", async (req, res) => {
  try {
    const { pageRoute } = req.query;
    if (!pageRoute || typeof pageRoute !== "string") {
      return res.status(400).json(fail("Query pageRoute is required"));
    }
    const components = await componentService.tree(
      req.context.projectId,
      pageRoute,
    );
    res.json(ok({ success: true, components }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

/**
 * POST /blocks/:instanceId/text
 * Body: { "fields": { "title": "...", "description": "..." } }
 * Only whitelisted string keys are merged into props.
 */
router.post("/blocks/:instanceId/text", async (req, res) => {
  try {
    const projectName = req.context.projectId;
    const { fields } = req.body || {};
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      return res.status(400).json(fail('Body must include object "fields"'));
    }
    const component = await contentAdminService.mergeTextProps(
      projectName,
      req.params.instanceId,
      fields,
    );
    auditLog(req, "content-admin.text", {
      instanceId: req.params.instanceId,
      keys: Object.keys(fields),
    });
    res.json(ok({ success: true, component }));
  } catch (error) {
    const status = error.message === "Component instance not found" ? 404 : 400;
    res.status(status).json(fail(error.message));
  }
});

/**
 * POST /blocks/:instanceId/images
 * Body: { "images": [{ "url": "https://...", "alt": "..." }], "mode": "replace" | "append" }
 */
router.post("/blocks/:instanceId/images", async (req, res) => {
  try {
    const projectName = req.context.projectId;
    const { images, mode } = req.body || {};
    if (!Array.isArray(images)) {
      return res.status(400).json(fail('Body must include array "images"'));
    }
    const m = mode === "append" ? "append" : "replace";
    const component = await contentAdminService.mergeImageProps(
      projectName,
      req.params.instanceId,
      images,
      m,
    );
    auditLog(req, "content-admin.images", {
      instanceId: req.params.instanceId,
      mode: m,
      count: images.length,
    });
    res.json(ok({ success: true, component }));
  } catch (error) {
    const status = error.message === "Component instance not found" ? 404 : 400;
    res.status(status).json(fail(error.message));
  }
});

/**
 * POST /blocks/:instanceId/media
 * Body: { "items": [{ "kind": "image", "url": "...", "alt": "..." }], "mode": "replace" | "append" }
 * No file upload — URLs only. Extensible for more kinds later.
 */
router.post("/blocks/:instanceId/media", async (req, res) => {
  try {
    const projectName = req.context.projectId;
    const { items, mode } = req.body || {};
    if (!Array.isArray(items)) {
      return res.status(400).json(fail('Body must include array "items"'));
    }
    const m = mode === "replace" ? "replace" : "append";
    const component = await contentAdminService.mergeMediaItems(
      projectName,
      req.params.instanceId,
      items,
      m,
    );
    auditLog(req, "content-admin.media", {
      instanceId: req.params.instanceId,
      mode: m,
      count: items.length,
    });
    res.json(ok({ success: true, component }));
  } catch (error) {
    const status = error.message === "Component instance not found" ? 404 : 400;
    res.status(status).json(fail(error.message));
  }
});

/**
 * POST /blocks/:instanceId/elements
 * Body: { "elements": [ { "id", "type", ... }, ... ] }
 * Replaces props._elements (freeform block children).
 */
router.post("/blocks/:instanceId/elements", async (req, res) => {
  try {
    const projectName = req.context.projectId;
    const { elements } = req.body || {};
    if (!Array.isArray(elements)) {
      return res.status(400).json(fail('Body must include array "elements"'));
    }
    const component = await contentAdminService.replaceElementsProps(
      projectName,
      req.params.instanceId,
      elements,
    );
    auditLog(req, "content-admin.elements", {
      instanceId: req.params.instanceId,
      count: elements.length,
    });
    res.json(ok({ success: true, component }));
  } catch (error) {
    const status = error.message === "Component instance not found" ? 404 : 400;
    res.status(status).json(fail(error.message));
  }
});

module.exports = router;
