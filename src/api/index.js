const express = require('express');
const { ok } = require('../shared/http/response');

const authRoutes = require('../core/auth/authRoutes');
const componentRoutes = require('../core/components/componentRoutes');
const designRoutes = require('../core/designs/designRoutes');
const projectRoutes = require('../core/projects/projectRoutes');
const userRoutes = require('../core/users/userRoutes');
const permissionRoutes = require('../core/permissions/permissionRoutes');

const ecommerceRoutes = require('../modules/ecommerce/ecommerceRoutes');
const landingRoutes = require('../modules/landing/landingRoutes');
const inventoryRoutes = require('../modules/inventory/inventoryRoutes');
const serverRoutes = require('../modules/infrastructure/servers/serverRoutes');
const domainRoutes = require('../modules/infrastructure/domains/domainRoutes');

const {
  requestContext,
  requireProjectContext,
  requireModuleContext
} = require('../shared/middleware/requestContext');
const { requireAuth } = require('../shared/middleware/requireAuth');

const router = express.Router();

// All APIs receive a request context id.
router.use(requestContext);

router.get('/', (req, res) => {
  res.json(ok({
    success: true,
    message: 'Modular API root',
    versions: ['v2']
  }));
});

// Modular APIs.
router.use('/v2/core/auth', authRoutes);
router.use('/v2/core/components', requireAuth, requireProjectContext, componentRoutes);
router.use('/v2/core/designs', requireAuth, designRoutes);
router.use('/v2/core/projects', requireAuth, projectRoutes);
router.use('/v2/core/users', requireAuth, userRoutes);
router.use('/v2/core/permissions', requireAuth, permissionRoutes);

router.use('/v2/modules/ecommerce', requireAuth, requireProjectContext, (req, res, next) => {
  req.context.module = 'ecommerce';
  next();
}, requireModuleContext, ecommerceRoutes);

router.use('/v2/modules/landing', requireAuth, requireProjectContext, (req, res, next) => {
  req.context.module = 'landing';
  next();
}, requireModuleContext, landingRoutes);

router.use('/v2/modules/inventory', requireAuth, requireProjectContext, (req, res, next) => {
  req.context.module = 'inventory';
  next();
}, requireModuleContext, inventoryRoutes);

router.use('/v2/infrastructure/servers', requireAuth, serverRoutes);
router.use('/v2/infrastructure/domains', requireAuth, requireProjectContext, (req, res, next) => {
  req.context.module = 'infrastructure';
  next();
}, requireModuleContext, domainRoutes);

module.exports = router;
