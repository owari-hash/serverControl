const fs = require('fs');
const path = require('path');
const config = require('../../config');
const { createProject, buildAndRunProject, buildProject } = require('../utils/projectHelper');
const { createGitHubRepo } = require('../utils/gitHelper');
const Project = require('../models/Project');
const scaffolder = require('../utils/scaffolderHelper');

class ProjectService {
  constructor() {
    this.usedPorts = new Set();
    this.runningProjects = new Map();
    
    if (!fs.existsSync(config.PROJECTS_DIR)) {
      fs.mkdirSync(config.PROJECTS_DIR, { recursive: true });
    }
  }

  async init() {
    console.log('Initializing Project Service from database...');
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

  async getAllProjects() {
    return await Project.find({});
  }

  async getProjectByName(name) {
    const project = await Project.findOne({ name });
    if (!project) throw new Error('Project not found');
    return project;
  }

  async createNewProject(projectName) {
    const sanitizedName = projectName.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (this.runningProjects.has(sanitizedName)) {
      throw new Error('Project already exists');
    }

    const port = this.getAvailablePort();
    if (!port) throw new Error('No available ports');

    const projectPath = await createProject(sanitizedName);
    const githubRepo = await createGitHubRepo(sanitizedName, projectPath);

    const project = await Project.create({
      name: sanitizedName,
      port,
      path: projectPath,
      githubRepo,
      status: 'STOPPED'
    });

    this.usedPorts.add(port);
    this.runningProjects.set(sanitizedName, {
      port,
      path: projectPath,
      githubRepo,
      status: 'STOPPED',
      createdAt: project.createdAt
    });

    return project;
  }

  async updateProject(name, data) {
    const project = await Project.findOneAndUpdate({ name }, data, { new: true });
    if (!project) throw new Error('Project not found');
    
    // Update memory cache
    if (this.runningProjects.has(name)) {
      Object.assign(this.runningProjects.get(name), data);
    }
    
    return project;
  }

  async deleteProject(name) {
    const project = await Project.findOne({ name });
    if (!project) throw new Error('Project not found');

    await this.stopProject(name);
    
    await Project.deleteOne({ name });
    this.usedPorts.delete(project.port);
    this.runningProjects.delete(name);

    // Optional: Delete from disk? (Careful with this)
    // fs.rmSync(project.path, { recursive: true, force: true });

    return true;
  }

  async startProject(name) {
    const project = this.runningProjects.get(name);
    if (!project) throw new Error('Project not found');

    const pm2Id = await buildAndRunProject(name, project.path, project.port);
    project.status = 'RUNNING';
    project.pid = pm2Id;
    
    await Project.updateOne({ name }, { status: 'RUNNING', pid: pm2Id });
    return project;
  }

  async stopProject(name) {
    const project = this.runningProjects.get(name);
    if (!project) return; // Already stopped or not found

    const pm2Identifier = `proj-${name}`;
    try {
      const { execSync } = require('child_process');
      execSync(`pm2 delete ${pm2Identifier}`, { stdio: 'ignore' });
    } catch (err) {
      // Ignore if not found
    }

    project.pid = null;
    project.status = 'STOPPED';
    await Project.updateOne({ name }, { status: 'STOPPED', pid: null });
  }

  async syncAndBuild(name) {
    const project = await this.getProjectByName(name);
    await Project.updateOne({ name }, { status: 'BUILDING' });

    try {
      const buildOutput = await buildProject(name, project.path);
      let githubRepo = await createGitHubRepo(name, project.path);
      
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

  async createNewSite(projectName) {
    const WebsiteDesign = require('../models/WebsiteDesign');
    let design = await WebsiteDesign.findOne({ projectName });
    
    // Auto-create default design if not found
    if (!design) {
      console.log(`[${projectName}] No design found, creating default design...`);
      design = await WebsiteDesign.create({
        projectName,
        theme: {
          primaryColor: '#0070f3',
          secondaryColor: '#7928ca',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          darkMode: false
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter'
        },
        title: projectName,
        description: `Website for ${projectName}`
      });
    }

    const project = await this.createNewProject(projectName);
    
    // Scaffolding components MUST happen before PM2 boots up Next.js
    // Otherwise Tailwind compilation and Turbopack caching will break.
    await scaffolder.generateSiteCode(design, project.path);
    await createGitHubRepo(projectName, project.path);
    
    // Now start the project safely
    await this.startProject(project.name);

    return project;
  }
}

module.exports = new ProjectService();
