const mongoose = require('mongoose');

const sitePageSchema = new mongoose.Schema(
  {
    pageId: { type: String, required: true, index: true },
    lang: { type: String, required: true, enum: ['mn', 'en'] },
    sections: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

sitePageSchema.index({ pageId: 1, lang: 1 }, { unique: true });

module.exports = mongoose.model('SitePage', sitePageSchema);
