const designService = require('../services/designService');
const { envelope } = require('../utils/apiContract');

class DesignController {
  async getAllDesigns(req, res) {
    try {
      const designs = await designService.getAllDesigns();
      res.json(envelope(designs));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDesign(req, res) {
    try {
      const design = await designService.getDesignByProject(req.params.name);
      res.json(envelope(design));
    } catch (error) {
      res.status(error.message === 'Design not found for this project' ? 404 : 500).json({ error: error.message });
    }
  }

  async saveDesign(req, res) {
    try {
      const projectName = req.params.name || req.body.projectName;
      if (!projectName) return res.status(400).json({ error: 'Project name is required' });

      const design = await designService.createOrUpdateDesign(projectName, req.body);
      res.json(envelope({ success: true, design }));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteDesign(req, res) {
    try {
      await designService.deleteDesign(req.params.name);
      res.json(envelope({ success: true, message: `Design for ${req.params.name} deleted` }));
    } catch (error) {
      res.status(error.message === 'Design not found' ? 404 : 500).json({ error: error.message });
    }
  }
}

module.exports = new DesignController();
