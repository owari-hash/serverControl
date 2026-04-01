const express = require('express');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PROJECTS_DIR = process.env.PROJECTS_DIR || '/home/projects';
const BASE_PORT = parseInt(process.env.BASE_PORT || '5001');
const MAX_PROJECTS = parseInt(process.env.MAX_PROJECTS || '50');
const PM_PORT = parseInt(process.env.PORT || '4000');

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || '';

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

// Create GitHub repository and connect to project
async function createGitHubRepo(projectName, projectPath) {
  if (!GITHUB_TOKEN || !GITHUB_USERNAME) {
    console.log('GitHub credentials not configured, skipping repo creation');
    return null;
  }

  try {
    let repoUrl = '';
    let webUrl = '';

    // Check if the repository already exists
    try {
      console.log(`Checking if GitHub repository ${projectName} already exists...`);
      const checkResponse = await axios.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${projectName}`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      console.log(`GitHub repository already exists: ${checkResponse.data.clone_url}`);
      repoUrl = checkResponse.data.clone_url;
      webUrl = checkResponse.data.html_url;
    } catch (checkError) {
      // If 404, repository doesn't exist, so create it
      if (checkError.response && checkError.response.status === 404) {
        console.log(`Creating new GitHub repository: ${projectName}`);
        const createResponse = await axios.post(`https://api.github.com/user/repos`, {
          name: projectName,
          description: `Next.js project: ${projectName}`,
          private: false,
          auto_init: false
        }, {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        repoUrl = createResponse.data.clone_url;
        webUrl = createResponse.data.html_url;
        console.log(`GitHub repository created: ${repoUrl}`);
      } else {
        throw checkError;
      }
    }

    // Initialize git in project directory
    console.log(`Initializing git repository in ${projectPath}`);
    execSync('git init', { cwd: projectPath, stdio: 'inherit' });
    
    // Configure git user if not set
    try {
      execSync(`git config user.email "${GITHUB_USERNAME}@users.noreply.github.com"`, { cwd: projectPath });
      execSync(`git config user.name "${GITHUB_USERNAME}"`, { cwd: projectPath });
    } catch (e) {
      console.log('Warn: Failed to set local git config');
    }

    execSync('git add .', { cwd: projectPath, stdio: 'inherit' });
    execSync('git commit -m "Initial commit - Next.js project created"', { cwd: projectPath, stdio: 'inherit' });

    // Set branch to main
    execSync('git branch -M main', { cwd: projectPath, stdio: 'inherit' });

    // Add remote and push
    execSync(`git remote add origin ${repoUrl}`, { cwd: projectPath, stdio: 'inherit' });
    execSync('git push -u origin main', { cwd: projectPath, stdio: 'inherit' });

    console.log(`Project pushed to GitHub: ${repoUrl}`);
    return {
      url: repoUrl,
      webUrl: webUrl
    };

  } catch (error) {
    console.error(`Failed to create GitHub repository: ${error.message}`);
    return null;
  }
}

// Create Next.js project
async function createProject(projectName) {
  const projectPath = path.join(PROJECTS_DIR, projectName);
  
  try {
    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });
    
    // Create Next.js project
    console.log(`Creating Next.js project: ${projectName}`);
    execSync(`npx create-next-app@latest ${projectPath} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-install`, {
      stdio: 'inherit',
      cwd: PROJECTS_DIR
    });
    
    // Install dependencies with legacy peer deps
    console.log(`Installing dependencies for ${projectName}`);
    execSync('npm install --legacy-peer-deps', {
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
    // Skip build for development mode - start directly
    console.log(`Starting ${projectName} in development mode on port ${port}`);
    
    // Explicitly set NODE_ENV to development for the child process
    const projectEnv = { ...process.env, NODE_ENV: 'development' };
    
    const child = spawn('npm', ['run', 'dev', '--', '-p', port], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: projectEnv
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
    
    // Create GitHub repository
    const githubRepo = await createGitHubRepo(projectName, projectPath);
    
    // Build and run project
    const projectInfo = await buildAndRunProject(projectName, projectPath, port);
    
    runningProjects.set(projectName, {
      ...projectInfo,
      path: projectPath,
      createdAt: new Date(),
      githubRepo
    });
    
    res.json({
      success: true,
      projectName,
      port,
      url: `http://localhost:${port}`,
      githubRepo,
      message: `Project ${projectName} created and running on port ${port}${githubRepo ? ' with GitHub repository' : ''}`
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

// Build a specific project
app.post('/api/projects/:name/build', async (req, res) => {
  const { name } = req.params;
  const projectPath = path.join(PROJECTS_DIR, name);
  
  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Project directory not found' });
  }

  try {
    console.log(`Building project: ${name}`);
    // Use execSync for simplicity as it returns the output directly
    const buildOutput = execSync('npm run build', {
      cwd: projectPath,
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'pipe'
    }).toString();
    
    // Also ensure GitHub repository exists and is updated
    let githubRepo = null;
    try {
      githubRepo = await createGitHubRepo(name, projectPath);
    } catch (repoError) {
      console.warn(`Note: GitHub sync failed during build of ${name}:`, repoError.message);
    }
    
    res.json({ 
      success: true, 
      message: `Project ${name} built successfully${githubRepo ? ' and synced with GitHub' : ''}`,
      githubRepo,
      output: buildOutput
    });
  } catch (error) {
    const errorOutput = error.stdout ? error.stdout.toString() : '';
    const errMessage = error.stderr ? error.stderr.toString() : error.message;
    
    console.error(`Error building project ${name}:`, errMessage);
    res.status(500).json({ 
      error: 'Failed to build project', 
      details: errMessage,
      output: errorOutput
    });
  }
});

const PORT = PM_PORT;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Project Manager API running on port ${PORT}`);
  console.log(`POST /api/create-project - Create new Next.js project`);
  console.log(`GET /api/projects - List all projects`);
  console.log(`DELETE /api/projects/:name - Stop a project`);
  console.log(`POST /api/projects/:name/build - Build a specific project`);
});
