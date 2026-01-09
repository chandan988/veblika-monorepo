import mongoose, { Schema } from "mongoose"
import { Member, IMember } from "../models/member-model"
import { Role } from "../models/role-model"
import { getAllPermissions } from "../../permissions/ability"
import {
  fetchUsersFromAuthService,
  fetchUserById,
} from "../../utils/auth-service"

export interface MemberWithUser {
  _id: string
  userId: string
  user: {
    _id: string
    name: string
    email: string
    image?: string
  }
  role: {
    _id: string
    name: string
    slug: string
  } | null
  isOwner: boolean
  extraPermissions: string[]
  createdAt: string
  updatedAt: string
}

export interface UpdateMemberInput {
  roleId?: string
  extraPermissions?: string[]
}

export class MemberService {
  /**
   * Get all members of an organisation with user and role details
   */
  async getMembersByOrganisation(orgId: string): Promise<MemberWithUser[]> {
    // Fetch members with roles from database
    const members = await Member.find({
      orgId: new mongoose.Types.ObjectId(orgId),
    })
      .populate("roleId", "_id name slug")
      .sort({ isOwner: -1, createdAt: 1 })

    // Extract unique user IDs
    const userIds = members.map((member) => member.userId.toString())

    // Fetch user information from auth service
    const userMap = await fetchUsersFromAuthService(userIds)

    // Enrich members with user data
    const enrichedMembers: MemberWithUser[] = members.map((member) => {
      const userId = member.userId.toString()
      const userInfo = userMap.get(userId) || {
        _id: userId,
        name: "Unknown User",
        email: "",
      }
      const role = member.roleId as any

      return {
        _id: member._id.toString(),
        userId: userId,
        user: {
          _id: userInfo._id,
          name: userInfo.name,
          email: userInfo.email,
          image: userInfo.image,
        },
        role: role
          ? {
              _id: role._id?.toString(),
              name: role.name,
              slug: role.slug,
            }
          : null,
        isOwner: member.isOwner,
        extraPermissions: member.extraPermissions,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      }
    })

    return enrichedMembers
  }

  /**
   * Get a single member by ID
   */
  async getMemberById(
    memberId: string,
    orgId: string
  ): Promise<MemberWithUser | null> {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new Error("Invalid member ID")
    }

    const member = await Member.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      orgId: new mongoose.Types.ObjectId(orgId),
    }).populate("roleId", "_id name slug")

    if (!member) {
      return null
    }

    // Fetch user information from auth service
    const userInfo = await fetchUserById(member.userId.toString())
    const role = member.roleId as any

    return {
      _id: member._id.toString(),
      userId: member.userId.toString(),
      user: {
        _id: userInfo?._id || member.userId.toString(),
        name: userInfo?.name || "Unknown User",
        email: userInfo?.email || "",
        image: userInfo?.image,
      },
      role: role
        ? {
            _id: role._id?.toString(),
            name: role.name,
            slug: role.slug,
          }
        : null,
      isOwner: member.isOwner,
      extraPermissions: member.extraPermissions,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    }
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    memberId: string,
    orgId: string,
    roleId: string,
    updatedBy: { isOwner: boolean; memberId: string }
  ): Promise<IMember> {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new Error("Invalid member ID")
    }

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new Error("Invalid role ID")
    }

    // Get the member being updated
    const member = await Member.findOne({
      _id: memberId,
      orgId: orgId,
    })

    if (!member) {
      throw new Error("Member not found")
    }

    // Cannot change owner's role
    if (member.isOwner) {
      throw new Error("Cannot change the owner's role")
    }

    // Non-owners cannot change their own role
    if (!updatedBy.isOwner && updatedBy.memberId === memberId) {
      throw new Error("You cannot change your own role")
    }

    // Verify the role exists and belongs to the organisation
    const role = await Role.findOne({
      _id: roleId,
      orgId: orgId,
    })

    if (!role) {
      throw new Error("Role not found")
    }

    // Cannot assign owner role via this method
    if (role.slug === "owner") {
      throw new Error("Cannot assign owner role")
    }

    member.roleId = new mongoose.Types.ObjectId(
      roleId
    ) as unknown as Schema.Types.ObjectId
    await member.save()

    return member
  }

  /**
   * Update a member's extra permissions
   */
  async updateMemberExtraPermissions(
    memberId: string,
    orgId: string,
    extraPermissions: string[],
    updatedBy: { isOwner: boolean; memberId: string }
  ): Promise<IMember> {
    // Reserved for future permission checks
    void updatedBy

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new Error("Invalid member ID")
    }

    // Get the member being updated
    const member = await Member.findOne({
      _id: memberId,
      orgId: orgId,
    })

    if (!member) {
      throw new Error("Member not found")
    }

    // Owner doesn't need extra permissions (has all)
    if (member.isOwner) {
      throw new Error("Owner already has full permissions")
    }

    // Validate permissions
    const allPermissions = getAllPermissions()
    const invalidPermissions = extraPermissions.filter(
      (p) => !allPermissions.includes(p)
    )
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(", ")}`)
    }

    member.extraPermissions = extraPermissions
    await member.save()

    return member
  }

  /**
   * Remove a member from an organisation
   */
  async removeMember(
    memberId: string,
    orgId: string,
    removedBy: { isOwner: boolean; memberId: string }
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new Error("Invalid member ID")
    }

    // Get the member being removed
    const member = await Member.findOne({
      _id: memberId,
      orgId: orgId,
    })

    if (!member) {
      throw new Error("Member not found")
    }

    // Cannot remove the owner
    if (member.isOwner) {
      throw new Error("Cannot remove the organisation owner")
    }

    // Cannot remove yourself
    if (removedBy.memberId === memberId) {
      throw new Error("You cannot remove yourself from the organisation")
    }

    await Member.deleteOne({ _id: memberId })
  }

  /**
   * Get member count for an organisation
   */
  async getMemberCount(orgId: string): Promise<number> {
    return Member.countDocuments({
      orgId: new mongoose.Types.ObjectId(orgId),
    })
  }

  /**
   * Check if a user is a member of an organisation
   */
  async isMember(userId: string, orgId: string): Promise<boolean> {
    const member = await Member.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      orgId: new mongoose.Types.ObjectId(orgId),
    })
    return !!member
  }
}

export const memberService = new MemberService()
