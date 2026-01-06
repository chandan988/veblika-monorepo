import { Request, Response } from "express"
import { organisationService } from "../services/organisation-service"
import { asyncHandler } from "../../utils/async-handler"
import {
  CreateOrganisationInput,
  UpdateOrganisationInput,
} from "../validators/organisation-validator"

export class OrganisationController {
  /**
   * Create a new organisation
   * POST /api/v1/organisations
   */
  createOrganisation = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateOrganisationInput = req.body
    const userId = req.user!.id
    const resellerId = req.user!.resellerId

    const { organisation, member } =
      await organisationService.createOrganisation(data, userId, resellerId)

    return res.status(201).json({
      success: true,
      message: "Organisation created successfully",
      data: {
        organisation,
        member,
      },
    })
  })

  /**
   * Get all organisations for current user
   * GET /api/v1/organisations
   */
  getUserOrganisations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id
    const organisations = await organisationService.getUserOrganisations(userId)

    return res.status(200).json({
      success: true,
      message: "Organisations retrieved successfully",
      data: organisations,
    })
  })

  /**
   * Get organisation by ID
   * GET /api/v1/organisations/:id
   */
  getOrganisationById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.user!.id

    // Check if user is a member
    const membership = await organisationService.getMembership(id, userId)
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: "You are not a member of this organisation",
      })
    }

    const organisation = await organisationService.getOrganisationById(id)
    if (!organisation) {
      return res.status(404).json({
        success: false,
        error: "Organisation not found",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Organisation retrieved successfully",
      data: {
        ...organisation.toObject(),
        role: membership.roleId,
      },
    })
  })

  /**
   * Check if slug is available
   * GET /api/v1/organisations/check-slug?slug=xxx
   */
  checkSlug = asyncHandler(async (req: Request, res: Response) => {
    const slug = req.query.slug as string
    const isAvailable = await organisationService.isSlugAvailable(slug)

    return res.status(200).json({
      success: true,
      data: { available: isAvailable },
    })
  })

  /**
   * Update organisation
   * PUT /api/v1/organisations/:id
   */
  updateOrganisation = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const data: UpdateOrganisationInput = req.body
    const userId = req.user!.id

    const organisation = await organisationService.updateOrganisation(
      id,
      data,
      userId
    )

    return res.status(200).json({
      success: true,
      message: "Organisation updated successfully",
      data: organisation,
    })
  })

  /**
   * Delete organisation
   * DELETE /api/v1/organisations/:id
   */
  deleteOrganisation = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.user!.id

    await organisationService.deleteOrganisation(id, userId)

    return res.status(200).json({
      success: true,
      message: "Organisation deleted successfully",
      data: null,
    })
  })
}

export const organisationController = new OrganisationController()
