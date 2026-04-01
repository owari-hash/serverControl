const express = require('express');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PROJECTS_DIR = '/home/projects';
const BASE_PORT = 5000;
const MAX_PROJECTS = 50;

// Track used ports
const usedPorts = new Set();
const runningProjects = new Map();

// Initialize projects directory
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// Find available port
function getAvailablePort() {
  for (let i = 0; i < MAX_PROJECTS; i++) {
    const port = BASE_PORT + i;
    if (!usedPorts.has(port)) {
      return port;
    }
  }
  return null;
}

// Create Next.js project
async function createProject(projectName) {
  const projectPath = path.join(PROJECTS_DIR, projectName);
  
  try {
    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });
    
    // Create Next.js project
    console.log(`Creating Next.js project: ${projectName}`);
    execSync(`npx create-next-app@latest ${projectPath} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`, {
      stdio: 'inherit',
      cwd: PROJECTS_DIR
    });
    
    // Install dependencies
    console.log(`Installing dependencies for ${projectName}`);
    execSync('npm install', {
      stdio: 'inherit',
      cwd: projectPath
    });
    
    return projectPath;
  } catch (error) {
    console.error(`Error creating project ${projectName}:`, error);
    throw error;
  }
}

// Build and run project
async function buildAndRunProject(projectName, projectPath, port) {
  try {
    // Build project
    console.log(`Building ${projectName} on port ${port}`);
    try {
      const buildOutput = execSync('npm run build', {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log(`Build output for ${projectName}:`, buildOutput);
    } catch (buildError) {
      console.error(`Build failed for ${projectName}:`, buildError.stdout);
      console.error(`Build stderr for ${projectName}:`, buildError.stderr);
      throw buildError;
    }
    
    // Start project
    console.log(`Starting ${projectName} on port ${port}`);
    const child = spawn('npm', ['run', 'start', '--', '-p', port], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    });
    
    // Handle output
    child.stdout.on('data', (data) => {
      console.log(`[${projectName}] ${data.toString()}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`[${projectName}] ${data.toString()}`);
    });
    
    child.on('error', (error) => {
      console.error(`Error starting ${projectName}:`, error);
      usedPorts.delete(port);
      runningProjects.delete(projectName);
    });
    
    child.on('close', (code) => {
      console.log(`${projectName} stopped with code ${code}`);
      usedPorts.delete(port);
      runningProjects.delete(projectName);
    });
    
    // Unref to allow parent to exit
    child.unref();
    
    return { port, pid: child.pid };
  } catch (error) {
    console.error(`Error building/running ${projectName}:`, error);
    usedPorts.delete(port);
    throw error;
  }
}

// API endpoint to create new project
app.post('/api/create-project', async (req, res) => {
  try {
    const { projectName } = req.body;
    
    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    if (runningProjects.has(projectName)) {
      return res.status(400).json({ error: 'Project already exists' });
    }
    
    const port = getAvailablePort();
    if (!port) {
      return res.status(500).json({ error: 'No available ports' });
    }
    
    usedPorts.add(port);
    
    // Create and setup project
    const projectPath = await createProject(projectName);
    
    // Build and run project
    const projectInfo = await buildAndRunProject(projectName, projectPath, port);
    
    runningProjects.set(projectName, {
      ...projectInfo,
      path: projectPath,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      projectName,
      port,
      url: `http://localhost:${port}`,
      message: `Project ${projectName} created and running on port ${port}`
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create project',
      details: error.message 
    });
  }
});

// List all running projects
app.get('/api/projects', (req, res) => {
  const projects = Array.from(runningProjects.entries()).map(([name, info]) => ({
    name,
    port: info.port,
    url: `http://localhost:${info.port}`,
    createdAt: info.createdAt
  }));
  
  res.json(projects);
});

// Stop a project
app.delete('/api/projects/:name', (req, res) => {
  const { name } = req.params;
  const project = runningProjects.get(name);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  try {
    // Kill the process
    process.kill(project.pid, 'SIGTERM');
    usedPorts.delete(project.port);
    runningProjects.delete(name);
    
    res.json({ success: true, message: `Project ${name} stopped` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop project' });
  }
});

const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Project Manager API running on port ${PORT}`);
  console.log(`POST /api/create-project - Create new Next.js project`);
  console.log(`GET /api/projects - List all projects`);
  console.log(`DELETE /api/projects/:name - Stop a project`);
});
