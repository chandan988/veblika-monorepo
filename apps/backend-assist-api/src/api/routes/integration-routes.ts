import { Router } from 'express';
import { integrationController } from '../controllers/integration-controller';
import { validate } from '../../middleware/validator';
import {
  createWebchatIntegrationSchema,
  updateIntegrationSchema,
  integrationIdSchema,
  getIntegrationsQuerySchema,
} from '../validators/integration-validator';
import isAuth from '../../middleware/authenticate';

const router: Router = Router();

/**
 * @route   POST /api/v1/integrations/webchat
 * @desc    Create a new webchat integration
 * @access  Private
 */
router.post(
  '/webchat',
  isAuth,
  validate(createWebchatIntegrationSchema),
  integrationController.createWebchatIntegration
);

/**
 * @route   GET /api/v1/integrations
 * @desc    Get all integrations with optional filters
 * @access  Private
 * @query   ?orgId=xxx&channel=webchat&status=active
 */
router.get(
  '/',
  isAuth,
  validate(getIntegrationsQuerySchema),
  integrationController.getIntegrations
);

/**
 * @route   GET /api/v1/integrations/:id
 * @desc    Get integration by ID
 * @access  Private
 */
router.get(
  '/:id',
  isAuth,
  validate(integrationIdSchema),
  integrationController.getIntegrationById
);

/**
 * @route   PUT /api/v1/integrations/:id
 * @desc    Update integration by ID
 * @access  Private
 */
router.put(
  '/:id',
  isAuth,
  validate(integrationIdSchema.merge(updateIntegrationSchema)),
  integrationController.updateIntegration
);

/**
 * @route   DELETE /api/v1/integrations/:id
 * @desc    Delete integration by ID
 * @access  Private
 */
router.delete(
  '/:id',
  isAuth,
  validate(integrationIdSchema),
  integrationController.deleteIntegration
);

/**
 * @route   GET /api/v1/integrations/:id/embed-script
 * @desc    Generate embed script for integration
 * @access  Private
 */
router.get(
  '/:id/embed-script',
  isAuth,
  validate(integrationIdSchema),
  integrationController.getEmbedScript
);

export default router;
