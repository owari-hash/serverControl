const { spawn } = require('child_process');
const projectService = require('../../services/projectService');
const { ok, fail } = require('../../shared/http/response');
const UserProjectBinding = require('../../models/UserProjectBinding');
const { auditLog } = require('../../shared/logging/auditLog');

class ProjectController {
  async getAllProjects(req, res) {
    try {
      let projects = await projectService.getAllProjects();
      if (req.auth.role !== 'superadmin') {
        const bindings = await UserProjectBinding.find({
          userEmail: req.auth.email,
          status: 'ACTIVE'
        }).lean();
        const allowed = new Set(bindings.map((b) => b.projectName));
        projects = projects.filter((p) => allowed.has(p.name));
      }
      res.json(ok({ success: true, projects }));
    } catch (error) {
      res.status(500).json(fail(error.message));
    }
  }

  async getProject(req, res) {
    try {
      const project = await projectService.getProjectByName(req.params.name);
      res.json(ok({ success: true, project }));
    } catch (error) {
      const status = error.message === 'Project not found' ? 404 : 500;
      res.status(status).json(fail(error.message));
    }
  }

  async createProject(req, res) {
    try {
      const { name } = req.body || {};
      if (!name) {
        return res.status(400).json(fail('Project name is required'));
      }

      const project = await projectService.createNewProject(name);
      auditLog(req, 'project.create', { projectName: project.name });
      return res.status(201).json(ok({
        success: true,
        project,
        url: `http://202.179.6.77:${project.port}`
      }));
    } catch (error) {
      return res.status(500).json(fail(error.message));
    }
  }

  async updateProject(req, res) {
    try {
      const project = await projectService.updateProject(req.params.name, req.body || {});
      auditLog(req, 'project.update', { projectName: req.params.name });
      res.json(ok({ success: true, project }));
    } catch (error) {
      const status = error.message === 'Project not found' ? 404 : 500;
      res.status(status).json(fail(error.message));
    }
  }

  async deleteProject(req, res) {
    try {
      await projectService.deleteProject(req.params.name);
      auditLog(req, 'project.delete', { projectName: req.params.name });
      res.json(ok({ success: true, message: `Project ${req.params.name} deleted` }));
    } catch (error) {
      const status = error.message === 'Project not found' ? 404 : 500;
      res.status(status).json(fail(error.message));
    }
  }

  async stopProject(req, res) {
    try {
      await projectService.stopProject(req.params.name);
      auditLog(req, 'project.stop', { projectName: req.params.name });
      res.json(ok({ success: true, message: `Project ${req.params.name} stopped` }));
    } catch (error) {
      res.status(500).json(fail(error.message));
    }
  }

  async buildProject(req, res) {
    try {
      const result = await projectService.syncAndBuild(req.params.name);
      auditLog(req, 'project.build', { projectName: req.params.name });
      res.json(ok({ success: true, ...result }));
    } catch (error) {
      res.status(500).json(fail(error.message, { output: error.output }));
    }
  }

  async generateSite(req, res) {
    try {
      const { projectName } = req.body || {};
      if (!projectName) {
        return res.status(400).json(fail('Project name is required'));
      }

      const project = await projectService.createNewSite(projectName);
      auditLog(req, 'project.generate', { projectName: project.name });
      res.json(ok({
        success: true,
        project,
        url: `http://202.179.6.77:${project.port}`
      }));
    } catch (error) {
      res.status(500).json(fail(error.message));
    }
  }

  async streamLogs(req, res) {
    const { name } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.write(`data: connected to log stream for project ${name}\n\n`);

    const pm2AppName = `proj-${name}`;
    const logProcess = spawn('pm2', ['logs', pm2AppName, '--raw', '--lines', '50']);

    const sendEvent = (data) => {
      const lines = data.toString().split('\n');
      lines.forEach((line) => {
        if (line.trim()) res.write(`data: ${line}\n\n`);
      });
    };

    logProcess.stdout.on('data', sendEvent);
    logProcess.stderr.on('data', sendEvent);

    logProcess.on('close', (code) => {
      res.write(`data: [SYSTEM] log process closed with code ${code}\n\n`);
      res.end();
    });

    req.on('close', () => {
      logProcess.kill();
      res.end();
    });
  }
}

module.exports = new ProjectController();
