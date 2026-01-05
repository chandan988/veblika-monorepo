import { Request, Response } from "express"
import { roleService } from "../services/role-service"
import { Member } from "../models/member-model"
import { IRole } from "../models/role-model"
import { getAllPermissions, getPermissionsMetadata } from "../../permissions/ability"
import { asyncHandler } from "../../utils/async-handler"
import mongoose from "mongoose"

export class RoleController {
  /**
   * Get all roles for an organisation
   */
  getRoles = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params.orgId!
    const roles = await roleService.getRolesByOrganisation(orgId)

    res.json({
      success: true,
      data: roles,
    })
  })

  /**
   * Get a single role by ID
   */
  getRoleById = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params.orgId!
    const roleId = req.params.roleId!
    const role = await roleService.getRoleById(roleId, orgId)

    if (!role) {
      res.status(404).json({
        success: false,
        error: "Role not found",
      })
      return
    }

    res.json({
      success: true,
      data: role,
    })
  })

  /**
   * Create a new role
   */
  createRole = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params.orgId!
    const userId = req.user!.id

    const role = await roleService.createRole(orgId, req.body, userId)

    res.status(201).json({
      success: true,
      data: role,
    })
  })

  /**
   * Update a role
   */
  updateRole = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params.orgId!
    const roleId = req.params.roleId!

    const role = await roleService.updateRole(roleId, orgId, req.body)

    res.json({
      success: true,
      data: role,
    })
  })

  /**
   * Delete a role
   */
  deleteRole = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params.orgId!
    const roleId = req.params.roleId!

    await roleService.deleteRole(roleId, orgId)

    res.json({
      success: true,
      message: "Role deleted successfully",
    })
  })

  /**
   * Get all available permissions
   */
  getAvailablePermissions = asyncHandler(async (req: Request, res: Response) => {
    const permissions = getAllPermissions()
    const metadata = getPermissionsMetadata()

    res.json({
      success: true,
      data: {
        permissions,
        metadata,
      },
    })
  })

  /**
   * Assign a role to a member
   */
  assignRole = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params.orgId!
    const { memberId, roleId } = req.body
    const assignerIsOwner = req.member?.isOwner || false

    // Validate member ID
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      res.status(400).json({
        success: false,
        error: "Invalid member ID",
      })
      return
    }

    // Check if role can be assigned
    const canAssign = await roleService.canAssignRole(
      roleId,
      orgId,
      assignerIsOwner
    )
    if (!canAssign.canAssign) {
      res.status(403).json({
        success: false,
        error: canAssign.reason,
      })
      return
    }

    // Find the member
    const member = await Member.findOne({
      _id: memberId,
      orgId: orgId,
    })

    if (!member) {
      res.status(404).json({
        success: false,
        error: "Member not found",
      })
      return
    }

    // Prevent changing owner's role
    if (member.isOwner) {
      res.status(403).json({
        success: false,
        error: "Cannot change the owner's role",
      })
      return
    }

    // Update member's role
    member.roleId = new mongoose.Types.ObjectId(roleId) as unknown as mongoose.Schema.Types.ObjectId
    await member.save()

    // Return updated member with populated role
    const updatedMember = await Member.findById(memberId).populate(
      "roleId",
      "name slug permissions isDefault isSystem"
    )

    res.json({
      success: true,
      data: updatedMember,
    })
  })

  /**
   * Update member's extra permissions
   */
  updateMemberPermissions = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params.orgId!
    const memberId = req.params.memberId!
    const { extraPermissions } = req.body

    // Validate member ID
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      res.status(400).json({
        success: false,
        error: "Invalid member ID",
      })
      return
    }

    // Find the member
    const member = await Member.findOne({
      _id: memberId,
      orgId: orgId,
    })

    if (!member) {
      res.status(404).json({
        success: false,
        error: "Member not found",
      })
      return
    }

    // Owners don't need extra permissions
    if (member.isOwner) {
      res.status(400).json({
        success: false,
        error: "Owners already have full access, extra permissions are not needed",
      })
      return
    }

    // Validate permissions
    const allPermissions = getAllPermissions()
    const invalidPermissions = extraPermissions.filter(
      (p: string) => !allPermissions.includes(p)
    )
    if (invalidPermissions.length > 0) {
      res.status(400).json({
        success: false,
        error: `Invalid permissions: ${invalidPermissions.join(", ")}`,
      })
      return
    }

    // Update extra permissions
    member.extraPermissions = extraPermissions
    await member.save()

    // Return updated member with populated role
    const updatedMember = await Member.findById(memberId).populate(
      "roleId",
      "name slug permissions isDefault isSystem"
    )

    res.json({
      success: true,
      data: updatedMember,
    })
  })

  /**
   * Get current user's permissions in an organisation
   */
  getMyPermissions = asyncHandler(async (req: Request, res: Response) => {
    const member = req.member
    const ability = req.ability

    if (!member || !ability) {
      res.status(500).json({
        success: false,
        error: "Member or ability not loaded",
      })
      return
    }

    // Get role permissions + extra permissions
    const populatedRole = member.roleId as IRole | null
    const rolePermissions = populatedRole?.permissions || []
    const extraPermissions = member.extraPermissions || []
    const allPermissions = [...new Set([...rolePermissions, ...extraPermissions])]

    res.json({
      success: true,
      data: {
        memberId: member._id,
        isOwner: member.isOwner,
        role: populatedRole
          ? {
              _id: populatedRole._id,
              name: populatedRole.name,
              slug: populatedRole.slug,
            }
          : null,
        permissions: member.isOwner ? getAllPermissions() : allPermissions,
        extraPermissions: member.extraPermissions,
      },
    })
  })
}

export const roleController = new RoleController()
