import { Router } from 'express';
import { integrationController } from '../controllers/integration-controller';
import { validate } from '../../middleware/validator';
import {
  createWebchatIntegrationSchema,
  updateIntegrationSchema,
  integrationIdSchema,
} from '../validators/integration-validator';
import isAuth from '../../middleware/authenticate';
import { loadMemberAbility } from '../../middleware/authorize';

const router: Router = Router({ mergeParams: true });

// All routes require authentication and organisation membership
router.use(isAuth, loadMemberAbility);

/**
 * @route   POST /api/v1/organisations/:orgId/integrations/webchat
 * @desc    Create a new webchat integration
 * @access  Private (org members)
 */
router.post(
  '/webchat',
  validate(createWebchatIntegrationSchema),
  integrationController.createWebchatIntegration
);

/**
 * @route   GET /api/v1/organisations/:orgId/integrations
 * @desc    Get all integrations for organisation
 * @access  Private (org members)
 * @query   ?channel=webchat&status=active
 */
router.get(
  '/',
  integrationController.getIntegrations
);

/**
 * @route   GET /api/v1/organisations/:orgId/integrations/:id
 * @desc    Get integration by ID
 * @access  Private (org members)
 */
router.get(
  '/:id',
  validate(integrationIdSchema),
  integrationController.getIntegrationById
);

/**
 * @route   PUT /api/v1/organisations/:orgId/integrations/:id
 * @desc    Update integration by ID
 * @access  Private (org members)
 */
router.put(
  '/:id',
  validate(integrationIdSchema.merge(updateIntegrationSchema)),
  integrationController.updateIntegration
);

/**
 * @route   DELETE /api/v1/organisations/:orgId/integrations/:id
 * @desc    Delete integration by ID
 * @access  Private (org members)
 */
router.delete(
  '/:id',
  validate(integrationIdSchema),
  integrationController.deleteIntegration
);

/**
 * @route   GET /api/v1/organisations/:orgId/integrations/:id/embed-script
 * @desc    Generate embed script for integration
 * @access  Private (org members)
 */
router.get(
  '/:id/embed-script',
  validate(integrationIdSchema),
  integrationController.getEmbedScript
);

export default router;
