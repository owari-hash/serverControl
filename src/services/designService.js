const WebsiteDesign = require('../models/WebsiteDesign');

class DesignService {
  async getAllDesigns() {
    return await WebsiteDesign.find({}, 'projectName updatedAt domain');
  }

  async getDesignByProject(projectName) {
    const design = await WebsiteDesign.findOne({ projectName });
    if (!design) throw new Error('Design not found for this project');
    return design;
  }

  async createOrUpdateDesign(projectName, designData) {
    const design = await WebsiteDesign.findOneAndUpdate(
      { projectName },
      { ...designData, projectName, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    return design;
  }

  async deleteDesign(projectName) {
    const result = await WebsiteDesign.deleteOne({ projectName });
    if (result.deletedCount === 0) throw new Error('Design not found');
    return true;
  }
}

module.exports = new DesignService();
