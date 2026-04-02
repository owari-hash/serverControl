const fs = require('fs');
const path = require('path');
const config = require('../config');
const { createProject, buildAndRunProject, buildProject } = require('./project');
const { createGitHubRepo } = require('./git');
const { WebsiteDesign } = require('./db');
const scaffolder = require('./scaffolder');

class ProjectManager {
  constructor() {
    this.usedPorts = new Set();
    this.runningProjects = new Map();
    
    // Initialize projects directory
    if (!fs.existsSync(config.PROJECTS_DIR)) {
      fs.mkdirSync(config.PROJECTS_DIR, { recursive: true });
    }
  }

  getAvailablePort() {
    for (let i = 0; i < config.MAX_PROJECTS; i++) {
      const port = config.BASE_PORT + i;
      if (!this.usedPorts.has(port)) return port;
    }
    return null;
  }

  listProjects() {
    return Array.from(this.runningProjects.entries()).map(([name, info]) => ({
      name,
      port: info.port,
      url: `http://localhost:${info.port}`,
      createdAt: info.createdAt,
      githubRepo: info.githubRepo
    }));
  }

  async createNewProject(projectName) {
    // Sanitize project name: lowercase, only alphanumeric and hyphens
    projectName = projectName.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (this.runningProjects.has(projectName)) {
      throw new Error('Project already exists');
    }

    const port = this.getAvailablePort();
    if (!port) throw new Error('No available ports');

    this.usedPorts.add(port);
    const projectPath = await createProject(projectName);
    const githubRepo = await createGitHubRepo(projectName, projectPath);

    const projectInfo = {
      port,
      path: projectPath,
      createdAt: new Date(),
      githubRepo
    };

    this.runningProjects.set(projectName, projectInfo);
    return projectInfo;
  }

  async createNewSite(projectName) {
    // 1. Fetch design from DB
    const design = await WebsiteDesign.findOne({ projectName });
    if (!design) throw new Error(`Design for ${projectName} not found in database`);

    // 2. Create the project foundation
    const projectInfo = await this.createNewProject(projectName);
    const projectPath = projectInfo.path;

    // 3. Generate the production-ready code
    await scaffolder.generateSiteCode(design, projectPath);

    // 4. Sync the generated code to GitHub
    await createGitHubRepo(projectName, projectPath);

    return this.runningProjects.get(projectName);
  }

  stopProject(name) {
    const project = this.runningProjects.get(name);
    if (!project) throw new Error('Project not found');

    process.kill(project.pid, 'SIGTERM');
    this.usedPorts.delete(project.port);
    this.runningProjects.delete(name);
    return true;
  }

  async syncAndBuild(name) {
    const projectPath = path.join(config.PROJECTS_DIR, name);
    if (!fs.existsSync(projectPath)) throw new Error('Project directory not found');

    const buildOutput = await buildProject(name, projectPath);
    console.log(`[${name}] Starting GitHub synchronization...`);
    
    let githubRepo = null;
    try {
      githubRepo = await createGitHubRepo(name, projectPath);
    } catch (repoError) {
      console.warn(`[${name}] GitHub sync failed:`, repoError.message);
    }

    return { buildOutput, githubRepo };
  }
}

module.exports = new ProjectManager();
