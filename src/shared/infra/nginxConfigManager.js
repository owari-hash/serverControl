const fs = require('fs');
const path = require('path');

function isValidDomain(domain) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain || '');
}

function renderConfig({ domain, upstreamHost, upstreamPort }) {
  if (!isValidDomain(domain)) throw new Error('Invalid domain');
  if (!upstreamHost || !upstreamPort) throw new Error('upstreamHost and upstreamPort are required');

  return [
    'server {',
    '  listen 80;',
    `  server_name ${domain};`,
    '',
    '  location / {',
    `    proxy_pass http://${upstreamHost}:${upstreamPort};`,
    '    proxy_http_version 1.1;',
    '    proxy_set_header Host $host;',
    '    proxy_set_header X-Real-IP $remote_addr;',
    '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    '    proxy_set_header X-Forwarded-Proto $scheme;',
    '  }',
    '}',
    ''
  ].join('\n');
}

function writeCandidateConfig({ domain, content }) {
  const outputDir = process.env.NGINX_CANDIDATE_DIR || path.resolve(process.cwd(), 'tmp', 'nginx');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${domain}.conf`);
  fs.writeFileSync(outputPath, content, 'utf8');
  return outputPath;
}

module.exports = {
  isValidDomain,
  renderConfig,
  writeCandidateConfig
};
