const WebsiteDesign = require('../../models/WebsiteDesign');

async function getAllDesigns() {
  return WebsiteDesign.find({}).sort({ updatedAt: -1 });
}

async function getDesignByProject(projectName) {
  const design = await WebsiteDesign.findOne({ projectName });
  if (!design) throw new Error('Design not found for this project');
  return design;
}

async function createOrUpdateDesign(projectName, payload) {
  const update = {
    ...payload,
    projectName,
    updatedAt: new Date()
  };
  return WebsiteDesign.findOneAndUpdate(
    { projectName },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function deleteDesign(projectName) {
  const result = await WebsiteDesign.deleteOne({ projectName });
  if (!result.deletedCount) throw new Error('Design not found for this project');
}

module.exports = {
  getAllDesigns,
  getDesignByProject,
  createOrUpdateDesign,
  deleteDesign
};
