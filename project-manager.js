const express = require('express');
const cors = require('cors');
const config = require('./config');
const projectManager = require('./utils/manager');

const app = express();
app.use(express.json());
app.use(cors());

// --- API Routes ---

// List all projects
app.get('/api/projects', (req, res) => {
  res.json(projectManager.listProjects());
});

// Create new project
app.post('/api/create-project', async (req, res) => {
  try {
    const { projectName } = req.body;
    if (!projectName) return res.status(400).json({ error: 'Project name is required' });

    const projectInfo = await projectManager.createNewProject(projectName);

    res.json({
      success: true,
      ...projectInfo,
      projectName,
      url: `http://localhost:${projectInfo.port}`,
      message: `Project ${projectName} created and running on port ${projectInfo.port}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

// Stop a project
app.delete('/api/projects/:name', (req, res) => {
  const { name } = req.params;
  try {
    projectManager.stopProject(name);
    res.json({ success: true, message: `Project ${name} stopped` });
  } catch (error) {
    res.status(error.message === 'Project not found' ? 404 : 500).json({ error: error.message });
  }
});

// Get site content (for the generated site to fetch)
app.get('/api/sites/:name/content', async (req, res) => {
  const { name } = req.params;
  try {
    const { WebsiteDesign } = require('./utils/db');
    const design = await WebsiteDesign.findOne({ projectName: name });
    if (!design) return res.status(404).json({ error: 'Site not found' });
    res.json(design);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch site content' });
  }
});

// Build specific project
app.post('/api/projects/:name/build', async (req, res) => {
  const { name } = req.params;
  try {
    const { buildOutput, githubRepo } = await projectManager.syncAndBuild(name);
    res.json({ 
      success: true, 
      message: `Project ${name} built successfully`,
      githubRepo,
      output: buildOutput
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to build project', 
      details: error.message,
      output: error.output 
    });
  }
});

// Generate site from database design
app.post('/api/sites/generate', async (req, res) => {
  const { projectName } = req.body;
  if (!projectName) return res.status(400).json({ error: 'Project name is required' });

  try {
    const projectInfo = await projectManager.createNewSite(projectName);
    res.json({
      success: true,
      message: `Site ${projectName} generated and started`,
      ...projectInfo,
      url: `http://localhost:${projectInfo.port}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate site', details: error.message });
  }
});

// List available designs in DB (for reference)
app.get('/api/designs', async (req, res) => {
  try {
    const { WebsiteDesign } = require('./utils/db');
    const designs = await WebsiteDesign.find({}, 'projectName updatedAt');
    res.json(designs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// --- Component Library API ---

// Create or update a component
app.post('/api/components', async (req, res) => {
  const { type, category, code, description, defaultProps, projectName } = req.body;
  if (!type || !code || !category) {
    return res.status(400).json({ error: 'Type, Category, and Code are required' });
  }

  const scope = projectName ? 'PROJECT' : 'GLOBAL';

  try {
    const { ComponentLibrary } = require('./utils/db');
    const component = await ComponentLibrary.findOneAndUpdate(
      { type, projectName: projectName || null },
      { type, category, code, description, defaultProps, scope, projectName: projectName || null },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: `Component ${type} [${scope}${projectName ? ':' + projectName : ''}] saved`, component });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save component', details: error.message });
  }
});

// List all components (with scope/category filtering)
app.get('/api/components', async (req, res) => {
  const { category, projectName } = req.query;
  
  // Logic: Return Global components OR components for the specific project
  const query = {
    $or: [
      { scope: 'GLOBAL' },
      { scope: 'PROJECT', projectName: projectName }
    ]
  };

  if (category) query.category = category;

  try {
    const { ComponentLibrary } = require('./utils/db');
    const components = await ComponentLibrary.find(query, 'type category scope projectName description updatedAt');
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

// Start Server
app.listen(config.PM_PORT, '0.0.0.0', () => {
  console.log(`Project Manager API running on port ${config.PM_PORT}`);
  console.log(`- POST   /api/designs              : Create/Update a site design`);
  console.log(`- GET    /api/designs              : List designs in database`);
  console.log(`- POST   /api/components           : Add/Update a component template`);
  console.log(`- GET    /api/components           : List all component templates`);
  console.log(`- POST   /api/create-project       : Create new Next.js project`);
  console.log(`- GET    /api/projects             : List all projects`);
  console.log(`- DELETE /api/projects/:name       : Stop a project`);
  console.log(`- POST   /api/projects/:name/build : Build and sync project`);
  console.log(`- POST   /api/sites/generate       : Generate site from DB design`);
});
