const componentService = require('../services/componentService');

class ComponentController {
  async getAllComponents(req, res) {
    try {
      const { category, projectName } = req.query;
      const components = await componentService.getAllComponents(category, projectName);
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getComponent(req, res) {
    try {
      const { type } = req.params;
      const { projectName } = req.query;
      const component = await componentService.getComponentByType(type, projectName);
      res.json(component);
    } catch (error) {
      res.status(error.message === 'Component not found' ? 404 : 500).json({ error: error.message });
    }
  }

  async saveComponent(req, res) {
    try {
      const { type } = req.body;
      if (!type) return res.status(400).json({ error: 'Type is required' });

      const component = await componentService.createOrUpdateComponent(type, req.body);
      res.json({ success: true, component });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteComponent(req, res) {
    try {
      const { type } = req.params;
      const { projectName } = req.body;
      await componentService.deleteComponent(type, projectName);
      res.json({ success: true, message: `Component ${type} deleted` });
    } catch (error) {
      res.status(error.message === 'Component not found' ? 404 : 500).json({ error: error.message });
    }
  }
}

module.exports = new ComponentController();
