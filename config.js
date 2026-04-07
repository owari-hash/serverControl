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
  AUTH_PASSWORD: process.env.AUTH_PASSWORD || '123456',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '30d',
  AUTH_USE_HTTP_ONLY_COOKIE: String(process.env.AUTH_USE_HTTP_ONLY_COOKIE || 'true').toLowerCase() === 'true',
  AUTH_RATE_WINDOW_MS: parseInt(process.env.AUTH_RATE_WINDOW_MS || '60000'),
  AUTH_RATE_MAX_ATTEMPTS: parseInt(process.env.AUTH_RATE_MAX_ATTEMPTS || '20'),
  SSH_KEY_PATH: process.env.SSH_KEY_PATH || '',
  SSH_CONNECT_TIMEOUT_MS: parseInt(process.env.SSH_CONNECT_TIMEOUT_MS || '15000'),
  SSH_COMMAND_TIMEOUT_MS: parseInt(process.env.SSH_COMMAND_TIMEOUT_MS || '60000')
};
