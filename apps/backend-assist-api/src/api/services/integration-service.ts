import mongoose from "mongoose"
import { Integration, IIntegration } from "../models/integration-model"
import {
  CreateWebchatIntegrationInput,
  UpdateIntegrationInput,
  GetIntegrationsQuery,
} from "../validators/integration-validator"
import { config } from "../../config/index"

export class IntegrationService {
  /**
   * Create a new webchat integration
   */
  async createWebchatIntegration(
    data: CreateWebchatIntegrationInput
  ): Promise<IIntegration> {
    // No need to generate websiteId/tenantId - we'll use integration._id and orgId directly
    const integration = await Integration.create({
      orgId: new mongoose.Types.ObjectId(data.orgId),
      channel: "webchat",
      provider: "veblika",
      name: data.name,
      status: "active",
      credentials: {}, // Empty credentials object
    })

    return integration
  }

  /**
   * Get all integrations with optional filters
   */
  async getIntegrations(query: GetIntegrationsQuery): Promise<IIntegration[]> {
    const filter: any = {}

    if (query.orgId) {
      filter.orgId = new mongoose.Types.ObjectId(query.orgId)
    }
    if (query.channel) {
      filter.channel = query.channel
    }
    if (query.status) {
      filter.status = query.status
    }

    const integrations = await Integration.find(filter).sort({ createdAt: -1 })
    return integrations
  }

  /**
   * Get integration by ID
   */
  async getIntegrationById(id: string): Promise<IIntegration | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid integration ID")
    }

    const integration = await Integration.findById(id)
    if (!integration) {
      throw new Error("Integration not found")
    }

    return integration
  }

  /**
   * Update integration
   */
  async updateIntegration(
    id: string,
    data: UpdateIntegrationInput
  ): Promise<IIntegration | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid integration ID")
    }

    const integration = await Integration.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    )

    if (!integration) {
      throw new Error("Integration not found")
    }

    return integration
  }

  /**
   * Delete integration
   */
  async deleteIntegration(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid integration ID")
    }

    const integration = await Integration.findByIdAndDelete(id)
    if (!integration) {
      throw new Error("Integration not found")
    }
  }

  /**
   * Generate embed script for integration
   */
  generateEmbedScript(integration: IIntegration): string {
    const integrationId = integration._id.toString()
    const orgId = integration.orgId.toString()
    const apiUrl = config.auth.serviceUrl

    return `<!-- Veblika Chat Widget -->
<script>
  window.MYCHAT_INTEGRATION_ID = "${integrationId}";
  window.MYCHAT_ORG_ID = "${orgId}";
  (function() {
    var d = document;
    var s = d.createElement("script");
    s.src = "${apiUrl}/api/v1/widget/loader.js";
    s.async = true;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();
</script>`
  }
}

export const integrationService = new IntegrationService()
