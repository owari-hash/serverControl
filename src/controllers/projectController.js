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
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Project name is required' });

      const project = await projectService.createNewProject(name);
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

  async streamLogs(req, res) {
    const { name } = req.params;
    
    // 1. Setup SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Ensure proxies don't buffer
    res.setHeader('X-Accel-Buffering', 'no'); 

    // Send an initial handshake to establish connection
    res.write(`data: connected to log stream for project ${name}\\n\\n`);

    const pm2AppName = `proj-${name}`;
    const { spawn } = require('child_process');

    // 2. Spawn PM2 logs process (-f means follow, --lines 50 gives previous contexts)
    const logProcess = spawn('pm2', ['logs', pm2AppName, '--raw', '--lines', '50']);

    // Helper to send data over the open SSE connection
    const sendEvent = (data) => {
      // Chunk string by lines so SSE clients parse perfectly
      const lines = data.toString().split('\\n');
      lines.forEach(line => {
        if (line.trim().length > 0) {
          res.write(`data: ${line}\\n\\n`);
        }
      });
    };

    // 3. Listen to streams
    logProcess.stdout.on('data', sendEvent);
    logProcess.stderr.on('data', sendEvent);

    // If PM2 logs stops abruptly
    logProcess.on('close', (code) => {
      res.write(`data: [SYSTEM] log process closed with code ${code}\\n\\n`);
      res.end();
    });

    // 4. Client disconnect cleanup
    req.on('close', () => {
      console.log(`Client disconnected from logs of ${name}, killing log tailer`);
      logProcess.kill();
      res.end();
    });
  }
}

module.exports = new ProjectController();
