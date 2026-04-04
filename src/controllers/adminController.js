const Project = require('../models/Project');
const ComponentLibrary = require('../models/ComponentLibrary');
const { execSync } = require('child_process');

class AdminController {
  async getDashboardStats(req, res) {
    try {
      const totalProjects = await Project.countDocuments();
      const totalComponents = await ComponentLibrary.countDocuments();
      const globalComponents = await ComponentLibrary.countDocuments({ scope: 'GLOBAL' });
      
      let pm2Status = [];
      try {
        const pm2List = JSON.parse(execSync('pm2 jlist', { encoding: 'utf8' }));
        pm2Status = pm2List.map(app => ({
          name: app.name,
          status: app.pm2_env.status,
          cpu: app.monit.cpu,
          memory: app.monit.memory,
          uptime: Math.floor((Date.now() - app.pm2_env.pm_uptime) / 1000)
        }));
      } catch (pm2Err) {
        console.warn('[AdminController] Could not fetch PM2 status:', pm2Err.message);
      }

      const recentProjects = await Project.find().sort({ createdAt: -1 }).limit(5);

      res.json({
        stats: {
          totalProjects,
          totalComponents,
          globalComponents,
          systemStatus: pm2Status.length > 0 ? 'HEALTHY' : 'PENDING'
        },
        projects: pm2Status,
        recentProjects
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async bulkImportComponents(req, res) {
    try {
      const { components } = req.body;
      if (!Array.isArray(components)) return res.status(400).json({ error: 'Components array is required' });

      const results = [];
      for (const comp of components) {
        const sanitizedType = comp.type.toLowerCase().replace(/-/g, '');
        const updated = await ComponentLibrary.findOneAndUpdate(
          { type: sanitizedType, scope: 'GLOBAL' },
          { ...comp, type: sanitizedType, scope: 'GLOBAL' },
          { upsert: true, new: true }
        );
        results.push(updated.type);
      }

      res.json({ success: true, imported: results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AdminController();
