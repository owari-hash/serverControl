const { spawn } = require('child_process');
const fs = require('fs');
const config = require('../../../config');

class RemoteExecutor {
  buildSshArgs(serverTarget, command) {
    const args = [
      '-p',
      String(serverTarget.port || 22),
      '-o',
      'BatchMode=yes',
      '-o',
      `ConnectTimeout=${Math.max(1, Math.floor(config.SSH_CONNECT_TIMEOUT_MS / 1000))}`
    ];

    const keyPath = serverTarget.sshKeyPath || config.SSH_KEY_PATH;
    if (keyPath) {
      if (!fs.existsSync(keyPath)) throw new Error(`SSH key path not found: ${keyPath}`);
      args.push('-i', keyPath);
    }

    if (serverTarget.knownHostsPath) {
      args.push('-o', `UserKnownHostsFile=${serverTarget.knownHostsPath}`);
    }

    args.push(`${serverTarget.user}@${serverTarget.host}`);
    args.push(command);
    return args;
  }

  executeSsh(serverTarget, command) {
    const args = this.buildSshArgs(serverTarget, command);
    return new Promise((resolve, reject) => {
      const child = spawn('ssh', args, { shell: false });
      let stdout = '';
      let stderr = '';
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
      }, config.SSH_COMMAND_TIMEOUT_MS);

      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.stderr.on('data', (d) => { stderr += d.toString(); });
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
      });
    });
  }

  async executeCommand(serverTarget, command) {
    if (!serverTarget) throw new Error('serverTarget is required');
    if (!command) throw new Error('command is required');
    if (!serverTarget.host || !serverTarget.user) {
      throw new Error('serverTarget.host and serverTarget.user are required');
    }
    if (serverTarget.authMode === 'password') {
      throw new Error('password auth mode is not supported; use ssh-key or agent');
    }

    const result = await this.executeSsh(serverTarget, command);
    return {
      ok: result.code === 0,
      mode: 'ssh',
      host: serverTarget.host,
      command,
      exitCode: result.code,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }
}

module.exports = new RemoteExecutor();
