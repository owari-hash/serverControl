async function send({ projectId, to, subject, html }) {
  return {
    success: true,
    projectId,
    to,
    subject,
    provider: 'stub',
    message: 'Email service foundation ready',
    previewLength: (html || '').length
  };
}

module.exports = {
  send
};
