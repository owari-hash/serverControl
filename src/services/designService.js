const WebsiteDesign = require('../models/WebsiteDesign');

class DesignService {
  normalizeProjectName(projectName = '') {
    return String(projectName)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async getAllDesigns() {
    return await WebsiteDesign.find({}, 'projectName updatedAt domain');
  }

  async getDesignByProject(projectName) {
    const normalizedName = this.normalizeProjectName(projectName);
    let design = await WebsiteDesign.findOne({ projectName });
    if (!design && normalizedName && normalizedName !== projectName) {
      design = await WebsiteDesign.findOne({ projectName: normalizedName });
    }
    if (!design) throw new Error('Design not found for this project');
    return design;
  }

  async createOrUpdateDesign(projectName, designData) {
    const normalizedName = this.normalizeProjectName(projectName);
    if (!normalizedName) {
      throw new Error('Project name is required');
    }

    const design = await WebsiteDesign.findOneAndUpdate(
      { projectName: normalizedName },
      { ...designData, projectName: normalizedName, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    return design;
  }

  async deleteDesign(projectName) {
    const normalizedName = this.normalizeProjectName(projectName);
    const result = await WebsiteDesign.deleteOne({
      projectName: normalizedName || projectName
    });
    if (result.deletedCount === 0) throw new Error('Design not found');
    return true;
  }
}

module.exports = new DesignService();
