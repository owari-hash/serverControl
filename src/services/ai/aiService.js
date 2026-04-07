async function generateResponse({ projectId, prompt, context = {} }) {
  return {
    success: true,
    projectId,
    prompt,
    context,
    output: 'AI service foundation ready'
  };
}

module.exports = {
  generateResponse
};
