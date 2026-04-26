const crypto = require('crypto');
const ComponentInstance = require('../../models/ComponentInstance');
const ComponentDefinition = require('../../models/ComponentDefinition');
const { validateComponentPayload } = require('../../utils/apiContract');
const {
  isAllowedComponentType,
  isFreeCanvasChildType,
  ALLOWED_COMPONENT_TYPES,
} = require('./allowedComponentTypes');
const { validateComponentGovernance } = require('../governance/validationRules');

// Allow all known component types at the root level for the freeform Wix-like builder
const STRUCTURED_ROOT_ALLOWED = new Set(ALLOWED_COMPONENT_TYPES);

function normalizeType(v) {
  return typeof v === 'string' ? v.trim().toLowerCase() : '';
}

function validateSlotContract(parentType, childType) {
  if (!parentType) {
    if (!STRUCTURED_ROOT_ALLOWED.has(childType)) {
      throw new Error(`Root can only contain allowed components; got "${childType}"`);
    }
    return;
  }
  
  // In a free-form Wix-like builder, we want to allow much more flexible nesting.
  // We still prevent obvious infinite loops or absurd nestings if needed, but 
  // for now we disable strict slot blocking to let the frontend control layout.
  
  // if (parentType === 'section') { ... }
  // if (parentType === 'container') { ... }
  // if (parentType === 'grid') { ... }
}

function templateRootOrder(type) {
  const map = {
    header: 0,
    hero: 1,
    about: 2,
    services: 3,
    contact: 4,
    footer: 5
  };
  return Object.prototype.hasOwnProperty.call(map, type) ? map[type] : 99;
}

function sectionDefaults(name) {
  return {
    componentType: 'section',
    props: {
      minHeight: name === 'header' ? 80 : name === 'footer' ? 300 : name === 'hero' ? 600 : 500,
      paddingY: 80,
      backgroundColor: '#ffffff'
    }
  };
}

function leafDefaults(name) {
  if (name === 'header') return { componentType: 'header', props: { title: 'Site', links: [] } };
  if (name === 'hero') return { componentType: 'hero', props: { title: 'Welcome', subtitle: 'Introduce your business' } };
  if (name === 'about') return { componentType: 'about', props: { title: 'About', description: '' } };
  if (name === 'services') return { componentType: 'services', props: { title: 'Services', items: [] } };
  if (name === 'features') return { componentType: 'features', props: { title: 'Features', items: [] } };
  if (name === 'promo') return { componentType: 'promo', props: { title: 'Promo', subtitle: '' } };
  if (name === 'clients') return { componentType: 'clients', props: { title: 'Clients', items: [] } };
  if (name === 'pricing') return { componentType: 'pricing', props: { title: 'Pricing', items: [] } };
  if (name === 'contact') return { componentType: 'contact', props: { title: 'Contact', subtitle: '' } };
  if (name === 'footer') return { componentType: 'footer', props: { title: 'Site', copyright: '© All rights reserved' } };
  return { componentType: name, props: {} };
}

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

  const childType = normalizeType(payload.componentType);
  if (!isAllowedComponentType(childType)) {
    throw new Error(`Unsupported component type: ${payload.componentType}`);
  }
  const childDefinitionAny = await ComponentDefinition.findOne({ type: childType }).lean();
  if (childDefinitionAny && childDefinitionAny.isActive === false) {
    throw new Error(`Component type "${childType}" is disabled by registry governance`);
  }
  const parentId = payload.parentId || null;
  if (parentId) {
    const parent = await ComponentInstance.findOne({ projectName, instanceId: parentId }).lean();
    if (!parent) throw new Error('Parent instance not found');
    if (String(parent.pageRoute) !== String(payload.pageRoute)) {
      throw new Error('Parent must be on the same pageRoute');
    }
    validateSlotContract(normalizeType(parent.componentType), childType);
    const parentDefinition = await ComponentDefinition.findOne({ type: normalizeType(parent.componentType), isActive: true }).lean();
    const allowedChildren = Array.isArray(parentDefinition?.allowedChildren) ? parentDefinition.allowedChildren : [];
    const skipChildContract = isFreeCanvasChildType(childType) && String(payload.slot || '') === 'free';
    if (
      !skipChildContract &&
      allowedChildren.length > 0 &&
      !allowedChildren.includes(childType)
    ) {
      throw new Error(`Registry contract violation: "${parent.componentType}" cannot contain "${childType}"`);
    }
  } else {
    validateSlotContract(null, childType);
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

  validateComponentGovernance(payload);

  const defaults = leafDefaults(childType);
  const baseProps =
    defaults.props && typeof defaults.props === 'object' && !Array.isArray(defaults.props)
      ? { ...defaults.props }
      : {};
  const incoming =
    payload.props && typeof payload.props === 'object' && !Array.isArray(payload.props)
      ? payload.props
      : {};
  const mergedProps = { ...baseProps, ...incoming };

  return ComponentInstance.create({
    instanceId: payload.instanceId || crypto.randomUUID(),
    projectName,
    pageRoute: payload.pageRoute,
    componentType: payload.componentType,
    parentId: payload.parentId || null,
    slot: payload.slot || null,
    order,
    props: mergedProps
  });
}

async function update(projectName, instanceId, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Invalid patch payload');
  }

  const { props: propsPatch, ...rest } = payload;
  const current = await ComponentInstance.findOne({ projectName, instanceId }).lean();
  if (!current) throw new Error('Component instance not found');
  if (Object.prototype.hasOwnProperty.call(rest, 'componentType')) {
    const nextType = normalizeType(rest.componentType);
    if (!isAllowedComponentType(nextType)) throw new Error(`Unsupported component type: ${rest.componentType}`);
    const childDefinitionAny = await ComponentDefinition.findOne({ type: nextType }).lean();
    if (childDefinitionAny && childDefinitionAny.isActive === false) {
      throw new Error(`Component type "${nextType}" is disabled by registry governance`);
    }
  }
  const movingParentId = Object.prototype.hasOwnProperty.call(rest, 'parentId') ? (rest.parentId || null) : current.parentId;
  const movingPageRoute = Object.prototype.hasOwnProperty.call(rest, 'pageRoute') ? rest.pageRoute : current.pageRoute;
  const movingType = normalizeType(Object.prototype.hasOwnProperty.call(rest, 'componentType') ? rest.componentType : current.componentType);
  if (movingParentId) {
    if (movingParentId === instanceId) throw new Error('Component cannot parent itself');
    const parent = await ComponentInstance.findOne({ projectName, instanceId: movingParentId }).lean();
    if (!parent) throw new Error('Parent instance not found');
    if (String(parent.pageRoute) !== String(movingPageRoute)) {
      throw new Error('Parent must be on the same pageRoute');
    }
    validateSlotContract(normalizeType(parent.componentType), movingType);
    const parentDefinition = await ComponentDefinition.findOne({ type: normalizeType(parent.componentType), isActive: true }).lean();
    const allowedChildren = Array.isArray(parentDefinition?.allowedChildren) ? parentDefinition.allowedChildren : [];
    const effectiveSlot = Object.prototype.hasOwnProperty.call(rest, 'slot') ? rest.slot : current.slot;
    const skipMoveChildContract =
      isFreeCanvasChildType(movingType) && String(effectiveSlot || '') === 'free';
    if (
      !skipMoveChildContract &&
      allowedChildren.length > 0 &&
      !allowedChildren.includes(movingType)
    ) {
      throw new Error(`Registry contract violation: "${parent.componentType}" cannot contain "${movingType}"`);
    }
  } else {
    validateSlotContract(null, movingType);
  }
  const $set = {
    ...rest,
    updatedAt: new Date()
  };

  if (propsPatch !== undefined) {
    const prevRaw = current.props;
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
      validateComponentGovernance({ ...current, ...rest, props: merged });
    } else {
      throw new Error('props must be an object or null');
    }
  }

  const instance = await ComponentInstance.findOneAndUpdate(
    { projectName, instanceId },
    { $set },
    { returnDocument: 'after' }
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
    { returnDocument: 'after' }
  );
  if (!instance) throw new Error('Component instance not found');
  return instance;
}

async function applyTemplate(projectName, pageRoute = '/', templateName = 'homepage') {
  const route = pageRoute || '/';
  if (templateName !== 'homepage') {
    throw new Error(`Unknown template: ${templateName}`);
  }
  await ComponentInstance.deleteMany({ projectName, pageRoute: route });
  const base = ['header', 'hero', 'about', 'services', 'contact', 'footer'];
  let order = 0;
  for (const rootType of base) {
    const sectionId = crypto.randomUUID();
    const containerId = crypto.randomUUID();
    const gridId = crypto.randomUUID();
    const leafId = crypto.randomUUID();
    await ComponentInstance.create({
      instanceId: sectionId,
      projectName,
      pageRoute: route,
      componentType: sectionDefaults(rootType).componentType,
      parentId: null,
      slot: null,
      order: order++,
      props: sectionDefaults(rootType).props
    });
    await ComponentInstance.create({
      instanceId: containerId,
      projectName,
      pageRoute: route,
      componentType: 'container',
      parentId: sectionId,
      slot: 'default',
      order: 0,
      props: { maxWidthPx: 1200, padding: 'lg' }
    });
    await ComponentInstance.create({
      instanceId: gridId,
      projectName,
      pageRoute: route,
      componentType: 'grid',
      parentId: containerId,
      slot: 'default',
      order: 0,
      props: { columns: 12, gap: 'md', minChildWidth: 100 }
    });
    const leaf = leafDefaults(rootType);
    await ComponentInstance.create({
      instanceId: leafId,
      projectName,
      pageRoute: route,
      componentType: leaf.componentType,
      parentId: gridId,
      slot: 'default',
      order: 0,
      props: leaf.props
    });
  }
  return tree(projectName, route);
}

async function migrateLegacyToStructured(projectName, pageRoute = '/') {
  const route = pageRoute || '/';
  const roots = await ComponentInstance.find({ projectName, pageRoute: route, parentId: null }).sort({ order: 1 }).lean();
  const legacyRoots = roots.filter((r) => normalizeType(r.componentType) !== 'section');
  if (legacyRoots.length === 0) {
    return { migrated: 0, message: 'No legacy roots found' };
  }
  let migrated = 0;
  for (const root of legacyRoots) {
    const sectionId = crypto.randomUUID();
    const containerId = crypto.randomUUID();
    const gridId = crypto.randomUUID();
    await ComponentInstance.create({
      instanceId: sectionId,
      projectName,
      pageRoute: route,
      componentType: 'section',
      parentId: null,
      slot: null,
      order: templateRootOrder(normalizeType(root.componentType)),
      props: { minHeight: 500, paddingY: 80, backgroundColor: '#ffffff' }
    });
    await ComponentInstance.create({
      instanceId: containerId,
      projectName,
      pageRoute: route,
      componentType: 'container',
      parentId: sectionId,
      slot: 'default',
      order: 0,
      props: { maxWidthPx: 1200, padding: 'lg' }
    });
    await ComponentInstance.create({
      instanceId: gridId,
      projectName,
      pageRoute: route,
      componentType: 'grid',
      parentId: containerId,
      slot: 'default',
      order: 0,
      props: { columns: 12, gap: 'md', minChildWidth: 100 }
    });
    await ComponentInstance.updateOne(
      { projectName, instanceId: root.instanceId },
      { $set: { parentId: gridId, slot: 'default', order: 0, updatedAt: new Date() } }
    );
    migrated += 1;
  }
  return { migrated, message: `Migrated ${migrated} root components` };
}

module.exports = {
  list,
  tree,
  create,
  update,
  remove,
  reorder,
  patchCanvasLayout,
  applyTemplate,
  migrateLegacyToStructured
};
