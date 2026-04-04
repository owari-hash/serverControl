const dataService = require('../services/dataService');

class DataController {
  async getProjectData(req, res) {
    try {
      const data = await dataService.getDataByProject(req.params.name);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async setProjectData(req, res) {
    try {
      const { name } = req.params;
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: 'Key is required' });

      const data = await dataService.setProjectData(name, key, value);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProjectData(req, res) {
    try {
      const { name, key } = req.params;
      await dataService.deleteProjectData(name, key);
      res.json({ success: true });
    } catch (error) {
      res.status(error.message === 'Data key not found' ? 404 : 500).json({ error: error.message });
    }
  }

  async getSpecificData(req, res) {
    try {
      const { name, key } = req.params;
      const data = await dataService.getSpecificData(name, key);
      res.json(data);
    } catch (error) {
      res.status(error.message === 'Data key not found' ? 404 : 500).json({ error: error.message });
    }
  }
}

module.exports = new DataController();
