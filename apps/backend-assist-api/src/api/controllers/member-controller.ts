import { Request, Response } from "express"
import { memberService } from "../services/member-service"
import { asyncHandler } from "../../utils/async-handler"

class MemberController {
  /**
   * Get all members of an organisation
   */
  getMembers = asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.params

    const members = await memberService.getMembersByOrganisation(orgId!)

    res.json({
      success: true,
      data: members,
    })
  })

  /**
   * Get a single member by ID
   */
  getMemberById = asyncHandler(async (req: Request, res: Response) => {
    const { orgId, memberId } = req.params

    const member = await memberService.getMemberById(memberId!, orgId!)

    if (!member) {
      res.status(404).json({
        success: false,
        error: "Member not found",
      })
      return
    }

    res.json({
      success: true,
      data: member,
    })
  })

  /**
   * Update a member's role
   */
  updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    const { orgId, memberId } = req.params
    const { roleId } = req.body

    const updatedBy = {
      isOwner: req.member?.isOwner || false,
      memberId: req.member?._id?.toString() || "",
    }

    try {
      await memberService.updateMemberRole(memberId!, orgId!, roleId, updatedBy)

      // Get updated member with user details
      const updatedMember = await memberService.getMemberById(memberId!, orgId!)

      res.json({
        success: true,
        data: updatedMember,
        message: "Member role updated successfully",
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update role"
      res.status(400).json({
        success: false,
        error: message,
      })
    }
  })

  /**
   * Update a member's extra permissions
   */
  updateMemberPermissions = asyncHandler(
    async (req: Request, res: Response) => {
      const { orgId, memberId } = req.params
      const { extraPermissions } = req.body

      const updatedBy = {
        isOwner: req.member?.isOwner || false,
        memberId: req.member?._id?.toString() || "",
      }

      try {
        await memberService.updateMemberExtraPermissions(
          memberId!,
          orgId!,
          extraPermissions,
          updatedBy
        )

        // Get updated member with user details
        const updatedMember = await memberService.getMemberById(
          memberId!,
          orgId!
        )

        res.json({
          success: true,
          data: updatedMember,
          message: "Member permissions updated successfully",
        })
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update permissions"
        res.status(400).json({
          success: false,
          error: message,
        })
      }
    }
  )

  /**
   * Remove a member from the organisation
   */
  removeMember = asyncHandler(async (req: Request, res: Response) => {
    const { orgId, memberId } = req.params

    const removedBy = {
      isOwner: req.member?.isOwner || false,
      memberId: req.member?._id?.toString() || "",
    }

    try {
      await memberService.removeMember(memberId!, orgId!, removedBy)

      res.json({
        success: true,
        message: "Member removed successfully",
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove member"
      res.status(400).json({
        success: false,
        error: message,
      })
    }
  })

  /**
   * Get member count for an organisation
   */
  getMemberCount = asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.params

    const count = await memberService.getMemberCount(orgId!)

    res.json({
      success: true,
      data: { count },
    })
  })
}

export const memberController = new MemberController()
