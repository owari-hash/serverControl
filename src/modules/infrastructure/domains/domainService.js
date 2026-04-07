const DomainBinding = require('../../../models/DomainBinding');
const nginxConfigManager = require('../../../shared/infra/nginxConfigManager');

async function listDomains(projectId) {
  return DomainBinding.find({ projectId }).sort({ createdAt: -1 });
}

async function bindDomain({ projectId, domain, upstreamHost, upstreamPort }) {
  const content = nginxConfigManager.renderConfig({ domain, upstreamHost, upstreamPort });
  const configPath = nginxConfigManager.writeCandidateConfig({ domain, content });

  return DomainBinding.findOneAndUpdate(
    { domain },
    {
      projectId,
      domain,
      upstreamHost,
      upstreamPort,
      nginxStatus: 'READY',
      nginxConfigPath: configPath
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function setDomainEnabled(domain, isEnabled) {
  const updated = await DomainBinding.findOneAndUpdate(
    { domain },
    { isEnabled },
    { new: true }
  );
  if (!updated) throw new Error('Domain not found');
  return updated;
}

module.exports = {
  listDomains,
  bindDomain,
  setDomainEnabled
};
