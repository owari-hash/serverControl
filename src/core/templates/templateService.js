const Template = require('../../models/Template');
const ComponentInstance = require('../../models/ComponentInstance');
const WebsiteDesign = require('../../models/WebsiteDesign');
const AuditEvent = require('../../models/AuditEvent');

async function recordAudit(action, actorEmail, targetId, metadata = {}) {
  await AuditEvent.create({
    action,
    actorEmail,
    actorRole: 'superadmin',
    targetType: 'template',
    targetId: String(targetId || ''),
    metadata,
  });
}

function toSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function listTemplates({ category, isActive, search } = {}) {
  const query = {};
  if (category) query.category = category;
  if (typeof isActive === 'boolean') query.isActive = isActive;
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { tags: { $in: [search] } }];
  return Template.find(query).sort({ updatedAt: -1 });
}

async function getTemplateById(id) {
  const template = await Template.findById(id);
  if (!template) throw new Error('Template not found');
  return template;
}

async function createTemplate(payload, actorEmail = '') {
  const name = String(payload?.name || '').trim();
  if (!name) throw new Error('name is required');
  const slug = payload.slug ? toSlug(payload.slug) : toSlug(name);
  const next = await Template.create({
    ...payload,
    name,
    slug,
    currentVersion: 1,
    versions: [{ version: 1, snapshot: payload, createdBy: actorEmail }],
    createdBy: actorEmail,
    updatedBy: actorEmail,
  });
  await recordAudit('template.create', actorEmail, next._id, { name: next.name });
  return next;
}

async function updateTemplate(id, patch, actorEmail = '') {
  const existing = await getTemplateById(id);
  const mutable = { ...patch, updatedAt: new Date(), updatedBy: actorEmail };
  if (mutable.name) mutable.slug = toSlug(mutable.slug || mutable.name);
  const nextVersion = (existing.currentVersion || 1) + 1;
  const updated = await Template.findByIdAndUpdate(
    id,
    {
      $set: mutable,
      $push: { versions: { version: nextVersion, snapshot: { ...existing.toObject(), ...patch }, createdBy: actorEmail } },
      $inc: { currentVersion: 1 },
    },
    { new: true },
  );
  await recordAudit('template.update', actorEmail, id, { patchKeys: Object.keys(patch || {}) });
  return updated;
}

async function duplicateTemplate(id, name, actorEmail = '') {
  const existing = await getTemplateById(id);
  return createTemplate(
    {
      ...existing.toObject(),
      name,
      slug: toSlug(name),
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      versions: undefined,
    },
    actorEmail,
  );
}

async function setTemplateActive(id, isActive, actorEmail = '') {
  return updateTemplate(id, { isActive: !!isActive }, actorEmail);
}

async function rollbackTemplateVersion(id, version, actorEmail = '') {
  const existing = await getTemplateById(id);
  const target = (existing.versions || []).find((item) => item.version === version);
  if (!target) throw new Error('Template version not found');
  return updateTemplate(id, target.snapshot || {}, actorEmail);
}

async function deleteTemplate(id, actorEmail = '') {
  const res = await Template.findByIdAndDelete(id);
  if (!res) throw new Error('Template not found');
  await recordAudit('template.delete', actorEmail, id, { name: res.name });
}

async function applyTemplateToProject({ templateId, projectName, overwriteRoute = true, actorEmail = '' }) {
  const template = await getTemplateById(templateId);
  if (!projectName) throw new Error('projectName is required');
  for (const page of template.pages || []) {
    if (overwriteRoute) {
      await ComponentInstance.deleteMany({ projectName, pageRoute: page.route });
    }
    for (const component of page.components || []) {
      const instanceId = component.instanceId || `${template.slug}-${page.route}-${component.type}-${component.order}`.replace(/[^a-z0-9\-_/]/gi, '-');
      await ComponentInstance.create({
        instanceId,
        projectName,
        pageRoute: page.route,
        componentType: component.type,
        parentId: component.parentId || null,
        slot: component.slot || null,
        order: component.order || 0,
        props: component.props || {},
      });
    }
  }
  await AuditEvent.create({
    action: 'template.apply',
    actorEmail,
    actorRole: 'superadmin',
    projectName,
    targetType: 'template',
    targetId: String(template._id),
    metadata: { templateName: template.name, overwriteRoute },
  });
  return template;
}

async function exportTemplate(id) {
  const template = await getTemplateById(id);
  return template.toObject();
}

async function importTemplate(payload, actorEmail = '') {
  return createTemplate(payload, actorEmail);
}

async function listTemplateAnalytics() {
  const templates = await Template.find({}).select('name category isActive createdAt updatedAt');
  const counts = await AuditEvent.aggregate([
    { $match: { action: 'template.apply' } },
    { $group: { _id: '$targetId', applyCount: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((item) => [String(item._id), item.applyCount]));
  return templates.map((tpl) => ({
    id: String(tpl._id),
    name: tpl.name,
    category: tpl.category,
    isActive: tpl.isActive,
    applyCount: countMap.get(String(tpl._id)) || 0,
    updatedAt: tpl.updatedAt,
  }));
}

async function listDesignSnapshots(projectName) {
  const design = await WebsiteDesign.findOne({ projectName });
  if (!design) return [];
  return [{ projectName, updatedAt: design.updatedAt, theme: design.theme, template: design.template, responsive: design.responsive }];
}

module.exports = {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  setTemplateActive,
  rollbackTemplateVersion,
  deleteTemplate,
  applyTemplateToProject,
  exportTemplate,
  importTemplate,
  listTemplateAnalytics,
  listDesignSnapshots,
};
