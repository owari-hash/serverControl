const SitePage = require('../../../models/SitePage');

const ALLOWED_LANG = ['mn', 'en'];

function normalizeLang(lang) {
  const l = String(lang || '').toLowerCase();
  return ALLOWED_LANG.includes(l) ? l : null;
}

async function getSections(pageId, lang) {
  const doc = await SitePage.findOne({ pageId, lang }).lean();
  if (!doc || doc.sections == null) return {};
  return typeof doc.sections === 'object' && !Array.isArray(doc.sections) ? doc.sections : {};
}

async function saveSections(pageId, lang, sections) {
  const body =
    typeof sections === 'object' && sections !== null && !Array.isArray(sections) ? sections : {};
  await SitePage.findOneAndUpdate(
    { pageId, lang },
    { $set: { sections: body } },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );
}

module.exports = {
  ALLOWED_LANG,
  normalizeLang,
  getSections,
  saveSections,
};
