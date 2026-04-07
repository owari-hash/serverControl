async function charge({ projectId, amount, currency = 'USD', metadata = {} }) {
  return {
    success: true,
    projectId,
    amount,
    currency,
    provider: 'stub',
    metadata
  };
}

async function refund({ projectId, chargeId, amount }) {
  return {
    success: true,
    projectId,
    chargeId,
    amount,
    provider: 'stub'
  };
}

module.exports = {
  charge,
  refund
};
