const projectService = require('../services/projectService');

class ProjectController {
  async getAllProjects(req, res) {
    try {
      const projects = await projectService.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProject(req, res) {
    try {
      const project = await projectService.getProjectByName(req.params.name);
      res.json(project);
    } catch (error) {
      res.status(error.message === 'Project not found' ? 404 : 500).json({ error: error.message });
    }
  }

  async createProject(req, res) {
    try {
      const { projectName } = req.body;
      if (!projectName) return res.status(400).json({ error: 'Project name is required' });

      const project = await projectService.createNewProject(projectName);
      res.status(201).json({
        success: true,
        project,
        url: `http://202.179.6.77:${project.port}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProject(req, res) {
    try {
      const project = await projectService.updateProject(req.params.name, req.body);
      res.json({ success: true, project });
    } catch (error) {
      res.status(error.message === 'Project not found' ? 404 : 500).json({ error: error.message });
    }
  }

  async deleteProject(req, res) {
    try {
      await projectService.deleteProject(req.params.name);
      res.json({ success: true, message: `Project ${req.params.name} deleted` });
    } catch (error) {
      res.status(error.message === 'Project not found' ? 404 : 500).json({ error: error.message });
    }
  }

  async stopProject(req, res) {
    try {
      await projectService.stopProject(req.params.name);
      res.json({ success: true, message: `Project ${req.params.name} stopped` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async buildProject(req, res) {
    try {
      const result = await projectService.syncAndBuild(req.params.name);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ error: error.message, output: error.output });
    }
  }

  async generateSite(req, res) {
    try {
      const { projectName } = req.body;
      if (!projectName) return res.status(400).json({ error: 'Project name is required' });

      const project = await projectService.createNewSite(projectName);
      res.json({
        success: true,
        project,
        url: `http://202.179.6.77:${project.port}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProjectController();
