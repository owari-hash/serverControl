const crypto = require('crypto');
const ComponentInstance = require('../../models/ComponentInstance');
const { validateComponentPayload } = require('../../utils/apiContract');

async function list(projectName, pageRoute) {
  const query = { projectName };
  if (pageRoute) query.pageRoute = pageRoute;
  return ComponentInstance.find(query).sort({ pageRoute: 1, order: 1 });
}

async function tree(projectName, pageRoute) {
  if (!pageRoute) throw new Error('pageRoute is required');
  return ComponentInstance.getPageTree(projectName, pageRoute);
}

async function create(projectName, payload) {
  const validation = validateComponentPayload(payload);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  let order = payload.order;
  if (order === undefined) {
    const lastSibling = await ComponentInstance.findOne({
      projectName,
      pageRoute: payload.pageRoute,
      parentId: payload.parentId || null,
      slot: payload.slot || null
    }).sort({ order: -1 }).lean();
    order = lastSibling ? lastSibling.order + 1 : 0;
  }

  return ComponentInstance.create({
    instanceId: payload.instanceId || crypto.randomUUID(),
    projectName,
    pageRoute: payload.pageRoute,
    componentType: payload.componentType,
    parentId: payload.parentId || null,
    slot: payload.slot || null,
    order,
    props: payload.props || {}
  });
}

async function update(projectName, instanceId, payload) {
  const instance = await ComponentInstance.findOneAndUpdate(
    { projectName, instanceId },
    { $set: { ...payload, updatedAt: new Date() } },
    { new: true }
  );
  if (!instance) throw new Error('Component instance not found');
  return instance;
}

async function remove(projectName, instanceId) {
  const existing = await ComponentInstance.findOne({ projectName, instanceId }).lean();
  if (!existing) throw new Error('Component instance not found');
  await ComponentInstance.deleteTree(projectName, instanceId);
}

async function reorder(projectName, instances) {
  if (!Array.isArray(instances) || instances.length === 0) {
    throw new Error('instances array is required');
  }
  const bulkOps = instances.map((entry) => ({
    updateOne: {
      filter: { projectName, instanceId: entry.instanceId },
      update: { $set: { order: entry.order, updatedAt: new Date() } }
    }
  }));
  await ComponentInstance.bulkWrite(bulkOps);
}

module.exports = {
  list,
  tree,
  create,
  update,
  remove,
  reorder
};
