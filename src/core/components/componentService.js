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
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Invalid patch payload');
  }

  const { props: propsPatch, ...rest } = payload;
  const $set = {
    ...rest,
    updatedAt: new Date()
  };

  if (propsPatch !== undefined) {
    const existing = await ComponentInstance.findOne({ projectName, instanceId }).lean();
    if (!existing) throw new Error('Component instance not found');

    const prevRaw = existing.props;
    const prev =
      prevRaw && typeof prevRaw === 'object' && !Array.isArray(prevRaw) ? { ...prevRaw } : {};

    if (propsPatch === null) {
      $set.props = {};
    } else if (typeof propsPatch === 'object' && !Array.isArray(propsPatch)) {
      const merged = { ...prev, ...propsPatch };
      const prevCanvas = prev._canvas;
      const patchCanvas = propsPatch._canvas;
      if (
        prevCanvas &&
        typeof prevCanvas === 'object' &&
        !Array.isArray(prevCanvas) &&
        patchCanvas &&
        typeof patchCanvas === 'object' &&
        !Array.isArray(patchCanvas)
      ) {
        merged._canvas = { ...prevCanvas, ...patchCanvas };
      }
      $set.props = merged;
    } else {
      throw new Error('props must be an object or null');
    }
  }

  const instance = await ComponentInstance.findOneAndUpdate(
    { projectName, instanceId },
    { $set },
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

const CANVAS_NUM_KEYS = ['x', 'y', 'w', 'h', 'z'];

/**
 * Deep-merge `props._canvas` without replacing the rest of `props` (avoids clobbering concurrent edits).
 */
async function patchCanvasLayout(projectName, instanceId, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new Error('canvas layout patch must be a plain object');
  }
  const existing = await ComponentInstance.findOne({ projectName, instanceId }).lean();
  if (!existing) throw new Error('Component instance not found');

  const props = existing.props && typeof existing.props === 'object' ? existing.props : {};
  const prevCanvas = props._canvas && typeof props._canvas === 'object' ? { ...props._canvas } : {};
  const nextCanvas = { ...prevCanvas };

  for (const key of CANVAS_NUM_KEYS) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      const v = patch[key];
      if (v === null || v === undefined) {
        delete nextCanvas[key];
      } else if (typeof v === 'number' && Number.isFinite(v)) {
        nextCanvas[key] = v;
      } else {
        throw new Error(`canvas layout "${key}" must be a finite number or null`);
      }
    }
  }

  const instance = await ComponentInstance.findOneAndUpdate(
    { projectName, instanceId },
    { $set: { 'props._canvas': nextCanvas, updatedAt: new Date() } },
    { new: true }
  );
  if (!instance) throw new Error('Component instance not found');
  return instance;
}

module.exports = {
  list,
  tree,
  create,
  update,
  remove,
  reorder,
  patchCanvasLayout
};
