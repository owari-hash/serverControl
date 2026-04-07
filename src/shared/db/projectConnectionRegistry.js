const mongoose = require('mongoose');

class ProjectConnectionRegistry {
  constructor() {
    this.connectionCache = new Map();
  }

  getAdminConnection() {
    return mongoose.connection;
  }

  buildProjectUri(project) {
    if (project.dbUri) return project.dbUri;
    if (!process.env.MONGODB_URI) return null;
    return process.env.MONGODB_URI;
  }

  buildDbName(project) {
    if (project.dbName) return project.dbName;
    return `project_${project.name}`;
  }

  async getConnectionForProject(project) {
    if (!project) throw new Error('Project metadata is required');
    const projectKey = String(project._id || project.name);
    if (this.connectionCache.has(projectKey)) return this.connectionCache.get(projectKey);

    const uri = this.buildProjectUri(project);
    const dbName = this.buildDbName(project);
    if (!uri) throw new Error('MONGODB_URI is not configured');

    const connection = await mongoose.createConnection(uri, { dbName }).asPromise();
    this.connectionCache.set(projectKey, connection);
    return connection;
  }

  async closeAll() {
    const closures = Array.from(this.connectionCache.values()).map((conn) => conn.close());
    await Promise.allSettled(closures);
    this.connectionCache.clear();
  }
}

module.exports = new ProjectConnectionRegistry();
