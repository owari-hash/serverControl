const componentService = require('../services/componentService');

class ComponentController {
  async getAllComponents(req, res) {
    try {
      const { category, projectName } = req.query;
      console.log(`[ComponentController] Fetching components - Project: ${projectName || 'GLOBAL'}, Category: ${category || 'ALL'}`);
      const components = await componentService.getAllComponents(category, projectName);
      res.json(components);
    } catch (error) {
      console.error(`[ComponentController] Error fetching components:`, error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async getComponent(req, res) {
    try {
      const { type } = req.params;
      const { projectName } = req.query;
      console.log(`[ComponentController] Fetching specific component: ${type} (Project: ${projectName || 'GLOBAL'})`);
      const component = await componentService.getComponentByType(type, projectName);
      res.json(component);
    } catch (error) {
      console.error(`[ComponentController] Error fetching component ${req.params.type}:`, error.message);
      res.status(error.message === 'Component not found' ? 404 : 500).json({ error: error.message });
    }
  }

  async saveComponent(req, res) {
    try {
      const { type } = req.body;
      if (!type) return res.status(400).json({ error: 'Type is required' });

      console.log(`[ComponentController] Saving component: ${type} (Scope: ${req.body.projectName ? 'PROJECT (' + req.body.projectName + ')' : 'GLOBAL'})`);
      const component = await componentService.createOrUpdateComponent(type, req.body);
      res.json({ success: true, component });
    } catch (error) {
      console.error(`[ComponentController] Error saving component ${req.body?.type}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteComponent(req, res) {
    try {
      const { type } = req.params;
      const { projectName } = req.body;
      console.log(`[ComponentController] Deleting component: ${type} (Project: ${projectName || 'GLOBAL'})`);
      await componentService.deleteComponent(type, projectName);
      res.json({ success: true, message: `Component ${type} deleted` });
    } catch (error) {
      console.error(`[ComponentController] Error deleting component ${req.params.type}:`, error.message);
      res.status(error.message === 'Component not found' ? 404 : 500).json({ error: error.message });
    }
  }
}

module.exports = new ComponentController();
