const express = require('express');
const { authRateLimit } = require('../../../shared/middleware/authRateLimit');
const { requireAuth } = require('../../../shared/middleware/requireAuth');
const cmsBuilderV1AuthService = require('./cmsBuilderV1AuthService');
const sitePageService = require('./sitePageService');

const router = express.Router();

const INVALID_CREDS_MSG = 'Буруу нэвтрэх нэр эсвэл нууц үг';
const SAVE_OK_MSG = 'Амжилттай хадгалагдлаа';

router.post('/auth/login', authRateLimit, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const token = await cmsBuilderV1AuthService.login(username, password);
    if (!token) {
      return res.status(401).json({ error: INVALID_CREDS_MSG });
    }
    return res.json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/site-pages/:pageId', requireAuth, async (req, res) => {
  const lang = sitePageService.normalizeLang(req.query.lang);
  if (!lang) {
    return res.status(400).json({ error: 'lang query parameter is required (mn or en)' });
  }
  const pageId = String(req.params.pageId || '').trim();
  if (!pageId || pageId.length > 120) {
    return res.status(400).json({ error: 'Invalid pageId' });
  }
  try {
    const sections = await sitePageService.getSections(pageId, lang);
    return res.json({ data: { sections } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/site-pages/:pageId', requireAuth, async (req, res) => {
  const lang = sitePageService.normalizeLang(req.query.lang);
  if (!lang) {
    return res.status(400).json({ error: 'lang query parameter is required (mn or en)' });
  }
  const pageId = String(req.params.pageId || '').trim();
  if (!pageId || pageId.length > 120) {
    return res.status(400).json({ error: 'Invalid pageId' });
  }
  const { sections } = req.body || {};
  if (typeof sections !== 'object' || sections === null || Array.isArray(sections)) {
    return res.status(400).json({ error: 'Request body must include a sections object' });
  }
  try {
    await sitePageService.saveSections(pageId, lang, sections);
    return res.json({ success: true, message: SAVE_OK_MSG });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
