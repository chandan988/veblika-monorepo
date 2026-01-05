import mongoose, { Schema } from "mongoose"
import { Member, IMember } from "../models/member-model"
import { Role } from "../models/role-model"
import { getAllPermissions } from "../../permissions/ability"

export interface MemberWithUser {
  _id: string
  userId: {
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
    const members = await Member.aggregate([
      {
        $match: {
          orgId: new mongoose.Types.ObjectId(orgId),
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "role",
          localField: "roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: {
          path: "$role",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            image: "$user.image",
          },
          role: {
            _id: "$role._id",
            name: "$role.name",
            slug: "$role.slug",
          },
          isOwner: 1,
          extraPermissions: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: { isOwner: -1, createdAt: 1 },
      },
    ])

    return members
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

    const members = await Member.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(memberId),
          orgId: new mongoose.Types.ObjectId(orgId),
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "role",
          localField: "roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: {
          path: "$role",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            image: "$user.image",
          },
          role: {
            _id: "$role._id",
            name: "$role.name",
            slug: "$role.slug",
          },
          isOwner: 1,
          extraPermissions: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ])

    return members[0] || null
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
