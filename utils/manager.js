const fs = require('fs');
const path = require('path');
const config = require('../config');
const { createProject, buildAndRunProject, buildProject } = require('./project');
const { createGitHubRepo } = require('./git');
const { WebsiteDesign, Project } = require('./db');
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

  async init() {
    console.log('Initializing Project Manager from database...');
    const projects = await Project.find({});
    for (const project of projects) {
      this.usedPorts.add(project.port);
      this.runningProjects.set(project.name, {
        port: project.port,
        path: project.path,
        createdAt: project.createdAt,
        githubRepo: project.githubRepo,
        pid: project.pid,
        status: project.status
      });
      console.log(`- Loaded project: ${project.name} on port ${project.port} [${project.status}]`);
    }
    console.log(`Loaded ${projects.length} projects.`);
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
      url: `http://202.179.6.77:${info.port}`,
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
      githubRepo,
      status: 'STOPPED',
      url: `http://202.179.6.77:${port}`
    };

    // Save to Database
    await Project.findOneAndUpdate(
      { name: projectName },
      { 
        name: projectName,
        port,
        path: projectPath,
        githubRepo,
        status: 'STOPPED'
      },
      { upsert: true, new: true }
    );

    this.runningProjects.set(projectName, projectInfo);
    
    // Auto-start the project via PM2
    try {
      const pm2Id = await buildAndRunProject(projectName, projectPath, port);
      projectInfo.status = 'RUNNING';
      projectInfo.pid = pm2Id;
      await Project.updateOne({ name: projectName }, { status: 'RUNNING', pid: pm2Id });
    } catch (startError) {
      console.error(`Failed to auto-start project ${projectName}:`, startError.message);
      await Project.updateOne({ name: projectName }, { status: 'ERROR' });
    }

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

    // The project is already started by createNewProject, 
    // but we return the latest state
    return this.runningProjects.get(projectName);
  }

  async stopProject(name) {
    const project = this.runningProjects.get(name);
    if (!project) throw new Error('Project not found');

    // Use PM2 to stop/delete the process
    const pm2Identifier = `proj-${name}`;
    try {
      const { execSync } = require('child_process');
      execSync(`pm2 delete ${pm2Identifier}`, { stdio: 'inherit' });
    } catch (err) {
      console.warn(`Could not delete PM2 process ${pm2Identifier}: ${err.message}`);
    }

    project.pid = null;
    project.status = 'STOPPED';
    
    await Project.updateOne({ name }, { status: 'STOPPED', pid: null });
    
    this.usedPorts.delete(project.port);
    this.runningProjects.delete(name);
    return true;
  }

  async syncAndBuild(name) {
    const projectPath = path.join(config.PROJECTS_DIR, name);
    if (!fs.existsSync(projectPath)) throw new Error('Project directory not found');

    await Project.updateOne({ name }, { status: 'BUILDING' });

    try {
      const buildOutput = await buildProject(name, projectPath);
      console.log(`[${name}] Starting GitHub synchronization...`);
      
      let githubRepo = null;
      try {
        githubRepo = await createGitHubRepo(name, projectPath);
      } catch (repoError) {
        console.warn(`[${name}] GitHub sync failed:`, repoError.message);
      }

      await Project.updateOne({ name }, { status: 'STOPPED', githubRepo });
      if (this.runningProjects.has(name)) {
        this.runningProjects.get(name).status = 'STOPPED';
        if (githubRepo) this.runningProjects.get(name).githubRepo = githubRepo;
      }

      return { buildOutput, githubRepo };
    } catch (error) {
      await Project.updateOne({ name }, { status: 'ERROR' });
      throw error;
    }
  }
}

module.exports = new ProjectManager();
