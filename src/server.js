const mongoose = require('mongoose');
const config = require('../config');
const app = require('./app');
const projectService = require('./services/projectService');
const projectConnectionRegistry = require('./shared/db/projectConnectionRegistry');

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // 2. Initialize Services (Restore project states)
    await projectService.init();

    // 3. Start Express Server
    app.listen(config.PM_PORT, '0.0.0.0', () => {
      console.log(`================================================`);
      console.log(` Project Manager API running on port ${config.PM_PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`================================================`);
      console.log(`- API Base: http://202.179.6.77:${config.PM_PORT}/api`);
    });
  } catch (error) {
    console.error('Critical Failure during server startup:');
    console.error(error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await projectConnectionRegistry.closeAll();
  process.exit(0);
});

startServer();
