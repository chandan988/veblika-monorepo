import mongoose from "mongoose"
import { Organization, IOrganization } from "../models/organization-model"
import {
  Member,
  IMember,
  IMemberPopulated,
} from "../models/member-model"
import { Role } from "../models/role-model"
import {
  CreateOrganisationInput,
  UpdateOrganisationInput,
} from "../validators/organisation-validator"
import { roleService } from "./role-service"
import { fetchUserById } from "../../utils/auth-service"

export interface OrganisationWithRole extends IOrganization {
  role: {
    _id: string
    name: string
    slug: string
    permissions: string[]
  } | null
  isOwner: boolean
  memberId: string
  extraPermissions: string[]
}

export class OrganisationService {
  /**
   * Create a new organisation with the creator as OWNER
   */
  async createOrganisation(
    data: CreateOrganisationInput,
    userId: string,
    resellerId: string
  ): Promise<{ organisation: IOrganization; member: IMember }> {
    // Check if slug already exists
    const existingOrg = await Organization.findOne({ slug: data.slug })
    if (existingOrg) {
      throw new Error("Organisation with this slug already exists")
    }

    // Create organisation
    const organisation = await Organization.create({
      name: data.name,
      resellerId,
      slug: data.slug,
      logo: data.logo,
    })

    // Seed default roles for this organisation
    const defaultRoles = await roleService.seedDefaultRoles(
      organisation._id.toString(),
      userId
    )

    // Find the owner role
    const ownerRole = defaultRoles.find((r) => r.slug === "owner")
    if (!ownerRole) {
      throw new Error("Failed to create owner role")
    }

    // Fetch user info from auth service to store in metadata
    const userInfo = await fetchUserById(userId)

    // Create member with OWNER role and isOwner flag
    const member = await Member.create({
      orgId: organisation._id.toString(),
      userId: userId,
      roleId: ownerRole._id,
      isOwner: true,
      extraPermissions: [],
      metadata: userInfo
        ? {
            name: userInfo.name,
            email: userInfo.email,
            image: userInfo.image,
          }
        : undefined,
    })

    return { organisation, member }
  }

  /**
   * Get all organisations for a user
   */
  async getUserOrganisations(userId: string): Promise<OrganisationWithRole[]> {
    // Find all memberships for the user with populated roles
    const memberships = await Member.find({
      userId,
    }).populate<{ roleId: IMemberPopulated["roleId"] }>(
      "roleId",
      "name slug permissions isDefault isSystem"
    )

    if (memberships.length === 0) {
      return []
    }

    // Get organisation IDs
    const orgIds = memberships.map((m) => m.orgId)

    // Fetch organisations
    const organisations = await Organization.find({
      _id: { $in: orgIds },
    })

    // Map organisations with roles
    const orgMap = new Map<string, IOrganization>()
    organisations.forEach((org) => {
      orgMap.set(org._id.toString(), org)
    })

    return memberships
      .map((membership) => {
        const org = orgMap.get(membership.orgId.toString())
        if (!org) return null
        const roleData = membership.roleId as any
        return {
          ...org.toObject(),
          role: roleData
            ? {
                _id: roleData._id?.toString(),
                name: roleData.name,
                slug: roleData.slug,
                permissions: roleData.permissions,
              }
            : null,
          isOwner: membership.isOwner,
          memberId: membership._id.toString(),
          extraPermissions: membership.extraPermissions || [],
        }
      })
      .filter((org): org is OrganisationWithRole => org !== null)
  }

  /**
   * Get organisation by ID
   */
  async getOrganisationById(id: string): Promise<IOrganization | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid organisation ID")
    }

    const organisation = await Organization.findById(id)
    return organisation
  }

  /**
   * Get organisation by slug
   */
  async getOrganisationBySlug(slug: string): Promise<IOrganization | null> {
    const organisation = await Organization.findOne({ slug })
    return organisation
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const organisation = await Organization.findOne({ slug })
    return !organisation
  }

  /**
   * Update organisation
   */
  async updateOrganisation(
    id: string,
    data: UpdateOrganisationInput,
    userId: string
  ): Promise<IOrganization | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid organisation ID")
    }

    // Check if user has permission (owner or admin role)
    const membership = await this.getMembership(id, userId)
    if (!membership) {
      throw new Error("You don't have permission to update this organisation")
    }

    const roleSlug = (membership.roleId as any)?.slug
    if (!membership.isOwner && roleSlug !== "admin") {
      throw new Error("You don't have permission to update this organisation")
    }

    // If updating slug, check if it's available
    if (data.slug) {
      const existingOrg = await Organization.findOne({
        slug: data.slug,
        _id: { $ne: id },
      })
      if (existingOrg) {
        throw new Error("Organisation with this slug already exists")
      }
    }

    const organisation = await Organization.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    )

    return organisation
  }

  /**
   * Delete organisation
   */
  async deleteOrganisation(id: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid organisation ID")
    }

    // Check if user is owner
    const membership = await this.getMembership(id, userId)
    if (!membership || !membership.isOwner) {
      throw new Error("Only organisation owner can delete the organisation")
    }

    // Delete all members
    await Member.deleteMany({ orgId: id })

    // Delete all roles
    await Role.deleteMany({ orgId: id })

    // Delete organisation
    const result = await Organization.findByIdAndDelete(id)
    if (!result) {
      throw new Error("Organisation not found")
    }
  }

  // ========================================
  // Member Management
  // ========================================

  /**
   * Get user's membership in an organisation
   */
  async getMembership(
    orgId: string,
    userId: string
  ): Promise<IMemberPopulated | null> {
    return Member.findOne({
      orgId: orgId,
      userId: userId,
    }).populate<{ roleId: IMemberPopulated["roleId"] }>(
      "roleId",
      "name slug permissions isDefault isSystem"
    ) as unknown as IMemberPopulated | null
  }

  /**
   * Get organisation members with roles populated
   */
  async getOrganisationMembersWithRoles(
    orgId: string
  ): Promise<IMemberPopulated[]> {
    return Member.find({ orgId: orgId }).populate(
      "roleId",
      "name slug permissions isDefault isSystem"
    ) as unknown as IMemberPopulated[]
  }
}

export const organisationService = new OrganisationService()
