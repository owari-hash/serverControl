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

  async updatePage(projectName, route, pageData) {
    const design = await WebsiteDesign.findOne({ projectName });
    if (!design) throw new Error('Design not found');

    const pageIndex = design.pages.findIndex(p => p.route === route);
    if (pageIndex > -1) {
      design.pages[pageIndex] = { ...design.pages[pageIndex], ...pageData };
    } else {
      design.pages.push({ ...pageData, route });
    }

    await design.save();
    return design;
  }

  async deletePage(projectName, route) {
    const design = await WebsiteDesign.findOne({ projectName });
    if (!design) throw new Error('Design not found');

    design.pages = design.pages.filter(p => p.route !== route);
    await design.save();
    return design;
  }
}

module.exports = new DesignService();
