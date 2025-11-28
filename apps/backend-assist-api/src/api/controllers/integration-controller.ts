import { Request, Response } from 'express';
import { integrationService } from '../services/integration-service';
import { asyncHandler } from '../../utils/async-handler';
import { CreateWebchatIntegrationInput, UpdateIntegrationInput, GetIntegrationsQuery } from '../validators/integration-validator';

export class IntegrationController {
  /**
   * Create a new webchat integration
   */
  createWebchatIntegration = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateWebchatIntegrationInput = req.body;
    const integration = await integrationService.createWebchatIntegration(data);
    const embedScript = integrationService.generateEmbedScript(integration);

    return res.status(201).json({
      success: true,
      message: 'Webchat integration created successfully',
      data: {
        integration,
        embedScript,
      },
    });
  });

  /**
   * Get all integrations
   */
  getIntegrations = asyncHandler(async (req: Request, res: Response) => {
    const query: GetIntegrationsQuery = req.query;
    const integrations = await integrationService.getIntegrations(query);

    return res.status(200).json({
      success: true,
      message: 'Integrations retrieved successfully',
      data: integrations,
    });
  });

  /**
   * Get integration by ID
   */
  getIntegrationById = asyncHandler(async (req: Request, res: Response) => {
    const integration = await integrationService.getIntegrationById(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Integration retrieved successfully',
      data: integration,
    });
  });

  /**
   * Update integration
   */
  updateIntegration = asyncHandler(async (req: Request, res: Response) => {
    const data: UpdateIntegrationInput = req.body;
    const integration = await integrationService.updateIntegration(req.params.id, data);

    return res.status(200).json({
      success: true,
      message: 'Integration updated successfully',
      data: integration,
    });
  });

  /**
   * Delete integration
   */
  deleteIntegration = asyncHandler(async (req: Request, res: Response) => {
    await integrationService.deleteIntegration(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Integration deleted successfully',
      data: null,
    });
  });

  /**
   * Generate embed script for integration
   */
  getEmbedScript = asyncHandler(async (req: Request, res: Response) => {
    const integration = await integrationService.getIntegrationById(req.params.id);
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found',
      });
    }

    const embedScript = integrationService.generateEmbedScript(integration);

    return res.status(200).json({
      success: true,
      message: 'Embed script generated successfully',
      data: {
        embedScript,
      },
    });
  });
}

export const integrationController = new IntegrationController();
