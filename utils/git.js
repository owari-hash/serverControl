const { execSync } = require('child_process');
const axios = require('axios');
const { GITHUB_TOKEN, GITHUB_USERNAME } = require('../config');

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
    execSync('git commit --allow-empty -m "Project sync - Build triggered"', { cwd: projectPath, stdio: 'inherit' });

    // Set branch to main
    execSync('git branch -M main', { cwd: projectPath, stdio: 'inherit' });

    // Build authenticated URL to avoid push failures
    const authenticatedRepoUrl = repoUrl.replace('https://', `https://${GITHUB_TOKEN}@`);

    // Add remote and push (handle if origin already exists)
    try {
      execSync(`git remote add origin ${authenticatedRepoUrl}`, { cwd: projectPath, stdio: 'inherit' });
    } catch (e) {
      execSync(`git remote set-url origin ${authenticatedRepoUrl}`, { cwd: projectPath, stdio: 'inherit' });
    }

    // Attempt to push to main
    try {
      execSync('git push -u origin main', { cwd: projectPath, stdio: 'inherit' });
    } catch (pushError) {
      console.warn('Warn: Initial push failed (might be empty or protected):', pushError.message);
    }

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

module.exports = { createGitHubRepo };
