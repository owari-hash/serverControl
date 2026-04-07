const ServerTarget = require('../../../models/ServerTarget');
const remoteExecutor = require('../../../shared/infra/remoteExecutor');

async function listServers() {
  return ServerTarget.find({ isActive: true }).sort({ createdAt: -1 });
}

async function registerServer(payload) {
  return ServerTarget.create(payload);
}

async function runCommand(serverId, command) {
  const server = await ServerTarget.findById(serverId);
  if (!server) throw new Error('Server not found');
  return remoteExecutor.executeCommand(server, command);
}

module.exports = {
  listServers,
  registerServer,
  runCommand
};
