require('dotenv').config();

module.exports = {
  PROJECTS_DIR: process.env.PROJECTS_DIR || '/home/projects',
  BASE_PORT: parseInt(process.env.BASE_PORT || '5001'),
  MAX_PROJECTS: parseInt(process.env.MAX_PROJECTS || '50'),
  PM_PORT: parseInt(process.env.PORT || '4000'),
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GITHUB_USERNAME: process.env.GITHUB_USERNAME || '',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/website-generator',
  AUTH_EMAIL: process.env.AUTH_EMAIL || 'admin@demo.com',
  AUTH_PASSWORD: process.env.AUTH_PASSWORD || '123456'
};
