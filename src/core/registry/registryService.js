const ComponentDefinition = require('../../models/ComponentDefinition');

async function listDefinitions({ category, isActive } = {}) {
  const query = {};
  if (category) query.category = category;
  if (typeof isActive === 'boolean') query.isActive = isActive;
  return ComponentDefinition.find(query).sort({ type: 1 });
}

async function upsertDefinition(type, payload) {
  if (!type) throw new Error('type is required');
  return ComponentDefinition.findOneAndUpdate(
    { type: String(type).toLowerCase() },
    {
      $set: {
        ...payload,
        type: String(type).toLowerCase(),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );
}

async function deleteDefinition(type) {
  const result = await ComponentDefinition.deleteOne({ type: String(type).toLowerCase() });
  if (!result.deletedCount) throw new Error('Component definition not found');
}

module.exports = {
  listDefinitions,
  upsertDefinition,
  deleteDefinition,
};
