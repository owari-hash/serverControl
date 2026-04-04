const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PROJECTS_DIR } = require('../../config');

// Create Next.js project
async function createProject(projectName) {
  const projectPath = path.join(PROJECTS_DIR, projectName);
  
  try {
    if (fs.existsSync(projectPath)) {
      console.log(`Project directory ${projectName} already exists. Skipping npx create-next-app...`);
      return projectPath;
    }
    
    fs.mkdirSync(projectPath, { recursive: true });
    
    const templatePath = path.resolve(__dirname, '../../clientCmsTemplate');
    
    // 1. Ensure template exists (Clone if missing)
    if (!fs.existsSync(templatePath)) {
      console.log(`Template not found at ${templatePath}. Cloning from GitHub...`);
      const repoUrl = 'https://github.com/owari-hash/cmsTemplate.git';
      // Use GITHUB_TOKEN if available for potentially private repos
      const authenticatedUrl = process.env.GITHUB_TOKEN 
        ? repoUrl.replace('https://', `https://${process.env.GITHUB_TOKEN}@`)
        : repoUrl;
        
      execSync(`git clone ${authenticatedUrl} ${templatePath}`, { stdio: 'inherit' });
    }

    console.log(`Creating project ${projectName} from template: ${templatePath}`);
    
    // 2. Copy template recursively (excluding node_modules and .next)
    const copyRecursiveSync = (src, dest) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach((childItemName) => {
          if (childItemName === 'node_modules' || childItemName === '.next' || childItemName === '.git') return;
          copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    copyRecursiveSync(templatePath, projectPath);
    
    console.log(`Installing dependencies for ${projectName}`);
    
    // 1. Add @cms-builder/core as NPM dependency
    const pkgPath = path.join(projectPath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.dependencies['@cms-builder/core'] = 'latest';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    // 2. Setup .npmrc for the private registry
    const npmrcPath = path.join(projectPath, '.npmrc');
    const npmrcContent = 'registry=http://202.179.6.77:4873/\n//202.179.6.77:4873/:_always-auth=false';
    fs.writeFileSync(npmrcPath, npmrcContent);

    // 3. Setup next.config.js to transpile the framework and allow HMR
    const nextConfigPath = path.join(projectPath, 'next.config.mjs');
    const nextConfigContent = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cms-builder/core"],
  experimental: {
    allowedDevOrigins: ["202.179.6.77"],
  },
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
`.trim();
    fs.writeFileSync(nextConfigPath, nextConfigContent);

    // 3. Setup .env.local
    const envPath = path.join(projectPath, '.env.local');
    const envContent = `NEXT_PUBLIC_PROJECT_NAME=${projectName}\nNEXT_PUBLIC_CMS_API_URL=http://202.179.6.77:4000/api`;
    fs.writeFileSync(envPath, envContent);

    console.log(`[${projectName}] Running npm install...`);
    try {
      execSync('npm install --legacy-peer-deps', {
        stdio: 'inherit',
        cwd: projectPath,
        env: { ...process.env, NODE_ENV: 'development' }
      });
    } catch (installError) {
      if (installError.stdout) console.error('NPM STDOUT:', installError.stdout.toString());
      if (installError.stderr) console.error('NPM STDERR:', installError.stderr.toString());
      throw new Error(`npm install failed for ${projectName}. Check registry connectivity.`);
    }
    
    return projectPath;
  } catch (error) {
    console.error(`Error creating project ${projectName}:`, error);
    throw error;
  }
}

// Build and run project
async function buildAndRunProject(projectName, projectPath, port, onStdout, onStderr, onExit) {
  try {
    console.log(`Starting ${projectName} in development mode on port ${port} via PM2`);
    const projectEnv = { ...process.env, NODE_ENV: 'development' };
    
    // Using PM2 to start the project
    const pm2Command = `pm2 start "npm run dev -- -p ${port}" --name "proj-${projectName}" --cwd "${projectPath}"`;
    
    try {
      execSync(pm2Command, { stdio: 'inherit', env: projectEnv });
      console.log(`[${projectName}] Started successfully via PM2`);
      return `proj-${projectName}`; // Return PM2 name to be stored as PID/Identifier
    } catch (pm2Error) {
      console.error(`PM2 start failed for ${projectName}:`, pm2Error.message);
      throw pm2Error;
    }
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
