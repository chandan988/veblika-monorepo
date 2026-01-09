import { Request, Response } from "express"
import { invitationService } from "../services/invitation-service"
import { asyncHandler } from "../../utils/async-handler"

class InvitationController {
  /**
   * Create a new invitation
   */
  createInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.params
    const { email, roleId } = req.body

    // Get inviter information
    const invitedBy = req.member?._id?.toString()
    const inviterName = req.user?.name || "A team member"

    if (!invitedBy) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
      })
      return
    }

    try {
      const invitation = await invitationService.createInvitation(
        {
          email,
          orgId: orgId!,
          roleId,
          invitedBy,
        },
        inviterName
      )

      res.status(201).json({
        success: true,
        data: invitation,
        message: "Invitation sent successfully",
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create invitation"
      res.status(400).json({
        success: false,
        error: message,
      })
    }
  })

  /**
   * Get all invitations for an organization
   */
  getInvitations = asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.params

    const invitations = await invitationService.getInvitationsByOrganization(
      orgId!
    )

    res.json({
      success: true,
      data: invitations,
    })
  })

  /**
   * Get invitation by ID (public endpoint for validation)
   */
  getInvitationById = asyncHandler(async (req: Request, res: Response) => {
    const { invitationId } = req.params
    console.log("Fetching invitation with ID:", invitationId)

    const result = await invitationService.validateInvitation(invitationId!)

    if (!result.valid) {
      res.status(400).json({
        success: false,
        error: result.error,
      })
      return
    }

    res.json({
      success: true,
      data: result.invitation,
    })
  })

  /**
   * Accept an invitation
   */
  acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { invitationId } = req.params
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "You must be logged in to accept an invitation",
      })
      return
    }

    try {
      const result = await invitationService.acceptInvitation(
        invitationId!,
        userId
      )

      res.json({
        success: true,
        data: result,
        message: "Invitation accepted successfully",
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept invitation"
      res.status(400).json({
        success: false,
        error: message,
      })
    }
  })

  /**
   * Cancel an invitation
   */
  cancelInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { orgId, invitationId } = req.params

    try {
      await invitationService.cancelInvitation(invitationId!, orgId!)

      res.json({
        success: true,
        message: "Invitation cancelled successfully",
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel invitation"
      res.status(400).json({
        success: false,
        error: message,
      })
    }
  })
}

export const invitationController = new InvitationController()
