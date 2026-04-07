class RemoteExecutor {
  async executeCommand(serverTarget, command) {
    if (!serverTarget) throw new Error('serverTarget is required');
    if (!command) throw new Error('command is required');

    // Intentionally abstracted to keep transport pluggable (SSH/agent later).
    return {
      ok: true,
      mode: 'stub',
      host: serverTarget.host,
      command,
      output: 'Remote execution layer is initialized but not wired to SSH yet.'
    };
  }
}

module.exports = new RemoteExecutor();
