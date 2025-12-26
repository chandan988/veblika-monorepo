import mongoose from "mongoose"
import { Organization, IOrganization } from "../models/organization-model"
import { Member, IMember, IMemberPopulated } from "../models/member-model"
import { Role } from "../models/role-model"
import {
    CreateOrganisationInput,
    UpdateOrganisationInput,
    AddMemberInput,
    OrganisationRole,
} from "../validators/organisation-validator"
import { roleService } from "./role-service"

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

        // Create member with OWNER role and isOwner flag
        const member = await Member.create({
            organizationId: organisation._id.toString(),
            userId: userId,
            roleId: ownerRole._id,
            isOwner: true,
            extraPermissions: [],
        })

        return { organisation, member }
    }

    /**
     * Get all organisations for a user
     */
    async getUserOrganisations(userId: string): Promise<OrganisationWithRole[]> {
        // Find all memberships for the user with populated roles
        const memberships = await Member.find({
            userId
        }).populate<{ roleId: IMemberPopulated["roleId"] }>("roleId", "name slug permissions isDefault isSystem")

        if (memberships.length === 0) {
            return []
        }

        // Get organisation IDs
        const orgIds = memberships.map((m) => m.organizationId)

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
                const org = orgMap.get(membership.organizationId.toString())
                if (!org) return null
                const roleData = membership.roleId as any
                return {
                    ...org.toObject(),
                    role: roleData ? {
                        _id: roleData._id?.toString(),
                        name: roleData.name,
                        slug: roleData.slug,
                        permissions: roleData.permissions,
                    } : null,
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
        await Member.deleteMany({ organizationId: id })

        // Delete all roles
        await Role.deleteMany({ organisationId: id })

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
        organisationId: string,
        userId: string
    ): Promise<IMemberPopulated | null> {
        return Member.findOne({
            organizationId: organisationId,
            userId: userId,
        }).populate<{ roleId: IMemberPopulated["roleId"] }>("roleId", "name slug permissions isDefault isSystem") as unknown as IMemberPopulated | null
    }

    /**
     * Get all members of an organisation
     */
    async getOrganisationMembers(organisationId: string): Promise<IMember[]> {
        return Member.find({ organizationId: organisationId })
    }

    /**
     * Add member to organisation
     */
    async addMember(
        organisationId: string,
        data: AddMemberInput,
        invitedByUserId: string
    ): Promise<IMember> {
        if (!mongoose.Types.ObjectId.isValid(organisationId)) {
            throw new Error("Invalid organisation ID")
        }

        // Check if inviter has permission
        const inviterMembership = await this.getMembership(
            organisationId,
            invitedByUserId
        )
        const inviterRoleSlug = (inviterMembership?.roleId as any)?.slug
        if (
            !inviterMembership ||
            (!inviterMembership.isOwner && inviterRoleSlug !== "admin")
        ) {
            throw new Error("You don't have permission to add members")
        }

        // Check if user is already a member
        const existingMember = await Member.findOne({
            organizationId: organisationId,
            userId: data.userId,
        })
        if (existingMember) {
            throw new Error("User is already a member of this organisation")
        }

        // Get the role to assign (default to 'agent' if not specified)
        const roleSlug = data.role || "agent"
        const role = await roleService.getRoleBySlug(roleSlug, organisationId)
        if (!role) {
            throw new Error(`Role '${roleSlug}' not found`)
        }

        // Only owner can add another owner
        if (roleSlug === "owner" && !inviterMembership.isOwner) {
            throw new Error("Only owner can assign owner role")
        }

        const member = await Member.create({
            organizationId: organisationId,
            userId: data.userId,
            roleId: role._id,
            isOwner: roleSlug === "owner",
            extraPermissions: [],
            invitedBy: invitedByUserId,
        })

        return member
    }

    /**
     * Update member role
     */
    async updateMemberRole(
        organisationId: string,
        memberId: string,
        newRoleId: string,
        updatedByUserId: string
    ): Promise<IMember | null> {
        // Check if updater has permission
        const updaterMembership = await this.getMembership(
            organisationId,
            updatedByUserId
        )
        if (!updaterMembership || !updaterMembership.isOwner) {
            throw new Error("Only owner can change member roles")
        }

        // Verify the role exists
        const role = await roleService.getRoleById(newRoleId, organisationId)
        if (!role) {
            throw new Error("Role not found")
        }

        // Get the member to update
        const memberToUpdate = await Member.findOne({
            _id: memberId,
            organizationId: organisationId,
        })
        if (!memberToUpdate) {
            throw new Error("Member not found")
        }

        // Prevent changing owner's role
        if (memberToUpdate.isOwner) {
            throw new Error("Cannot change the owner's role")
        }

        const member = await Member.findOneAndUpdate(
            { _id: memberId, organizationId: organisationId },
            { 
                $set: { 
                    roleId: new mongoose.Types.ObjectId(newRoleId),
                    isOwner: role.slug === "owner"
                } 
            },
            { new: true }
        ).populate("roleId", "name slug permissions isDefault isSystem")

        return member
    }

    /**
     * Remove member from organisation
     */
    async removeMember(
        organisationId: string,
        memberId: string,
        removedByUserId: string
    ): Promise<void> {
        const memberToRemove = await Member.findOne({
            _id: memberId,
            organizationId: organisationId,
        })

        if (!memberToRemove) {
            throw new Error("Member not found")
        }

        // Cannot remove owner
        if (memberToRemove.isOwner) {
            throw new Error("Cannot remove organisation owner")
        }

        // Check if remover has permission
        const removerMembership = await this.getMembership(
            organisationId,
            removedByUserId
        )
        const removerRoleSlug = (removerMembership?.roleId as any)?.slug
        if (
            !removerMembership ||
            (!removerMembership.isOwner && removerRoleSlug !== "admin")
        ) {
            throw new Error("You don't have permission to remove members")
        }

        await Member.findByIdAndDelete(memberId)
    }

    /**
     * Leave organisation
     */
    async leaveOrganisation(
        organisationId: string,
        userId: string
    ): Promise<void> {
        const membership = await this.getMembership(organisationId, userId)
        if (!membership) {
            throw new Error("You are not a member of this organisation")
        }

        // Owner cannot leave, they must transfer ownership first
        if (membership.isOwner) {
            // Check if there are other owners
            const owners = await Member.find({
                organizationId: organisationId,
                isOwner: true,
            })
            if (owners.length === 1) {
                throw new Error(
                    "You are the only owner. Transfer ownership before leaving."
                )
            }
        }

        await Member.findByIdAndDelete(membership._id)
    }

    /**
     * Get organisation members with roles populated
     */
    async getOrganisationMembersWithRoles(organisationId: string): Promise<IMemberPopulated[]> {
        return Member.find({ organizationId: organisationId })
            .populate("roleId", "name slug permissions isDefault isSystem") as unknown as IMemberPopulated[]
    }
}

export const organisationService = new OrganisationService()
