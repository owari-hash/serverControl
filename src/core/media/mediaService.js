const MediaAsset = require('../../models/MediaAsset');

async function listAssets({ folder, tag, projectName } = {}) {
  const query = {};
  if (folder) query.folder = folder;
  if (tag) query.tags = { $in: [tag] };
  if (projectName) query.projectName = projectName;
  return MediaAsset.find(query).sort({ createdAt: -1 });
}

async function createAsset(payload, actorEmail = '') {
  const name = String(payload?.name || '').trim();
  const url = String(payload?.url || '').trim();
  if (!name) throw new Error('name is required');
  if (!url) throw new Error('url is required');
  return MediaAsset.create({
    ...payload,
    name,
    url,
    uploadedBy: actorEmail,
  });
}

async function deleteAsset(id) {
  const result = await MediaAsset.findByIdAndDelete(id);
  if (!result) throw new Error('Media asset not found');
}

module.exports = {
  listAssets,
  createAsset,
  deleteAsset,
};
