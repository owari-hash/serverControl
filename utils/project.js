const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PROJECTS_DIR } = require('../config');

// Create Next.js project
async function createProject(projectName) {
  const projectPath = path.join(PROJECTS_DIR, projectName);
  
  try {
    if (fs.existsSync(projectPath)) {
      console.log(`Project directory ${projectName} already exists. Skipping npx create-next-app...`);
      return projectPath;
    }
    
    fs.mkdirSync(projectPath, { recursive: true });
    
    console.log(`Creating Next.js project: ${projectName}`);
    execSync(`npx create-next-app@latest ${projectPath} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-install`, {
      stdio: 'inherit',
      cwd: PROJECTS_DIR
    });
    
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
async function buildAndRunProject(projectName, projectPath, port, onStdout, onStderr, onExit) {
  try {
    console.log(`Starting ${projectName} in development mode on port ${port}`);
    const projectEnv = { ...process.env, NODE_ENV: 'development' };
    
    const child = spawn('npm', ['run', 'dev', '--', '-p', port], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: projectEnv
    });
    
    if (onStdout) child.stdout.on('data', onStdout);
    if (onStderr) child.stderr.on('data', onStderr);
    
    child.on('error', (error) => {
      console.error(`Error starting ${projectName}:`, error);
      if (onExit) onExit();
    });
    
    child.on('close', (code) => {
      console.log(`${projectName} stopped with code ${code}`);
      if (onExit) onExit();
    });
    
    child.unref();
    return child.pid;
  } catch (error) {
    console.error(`Error building/running ${projectName}:`, error);
    throw error;
  }
}

// Build specific project
async function buildProject(projectName, projectPath) {
  try {
    console.log(`[${projectName}] Build started...`);
    const buildEnv = { ...process.env, NODE_ENV: 'production' };
    
    const buildOutput = execSync('npm run build', {
      cwd: projectPath,
      env: buildEnv,
      stdio: 'pipe'
    }).toString();
    
    console.log(`[${projectName}] Build completed successfully.`);
    return buildOutput;
  } catch (error) {
    const errorOutput = error.stdout ? error.stdout.toString() : '';
    const errMessage = error.stderr ? error.stderr.toString() : error.message;
    throw { message: errMessage, output: errorOutput };
  }
}

module.exports = { createProject, buildAndRunProject, buildProject };
