import mongoose from "mongoose"
import { Organization, IOrganization } from "../models/organization-model"
import { Member, IMember } from "../models/member-model"
import {
    CreateOrganisationInput,
    UpdateOrganisationInput,
    AddMemberInput,
    OrganisationRole,
} from "../validators/organisation-validator"

export interface OrganisationWithRole extends IOrganization {
    role: OrganisationRole
    memberId: string
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

        // Create member with OWNER role
        const member = await Member.create({
            organizationId: organisation._id.toString(),
            userId: userId,
            role: "owner",
        })

        return { organisation, member }
    }

    /**
     * Get all organisations for a user
     */
    async getUserOrganisations(userId: string): Promise<OrganisationWithRole[]> {
        // Find all memberships for the user
        const memberships = await Member.find({
            userId
        })

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
                return {
                    ...org.toObject(),
                    role: membership.role as OrganisationRole,
                    memberId: membership._id.toString(),
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

        // Check if user is owner or admin
        const membership = await this.getMembership(id, userId)
        if (
            !membership ||
            !["owner", "admin"].includes(membership.role as string)
        ) {
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
        if (!membership || membership.role !== "owner") {
            throw new Error("Only organisation owner can delete the organisation")
        }

        // Delete all members
        await Member.deleteMany({ organizationId: id })

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
    ): Promise<IMember | null> {
        return Member.findOne({
            organizationId: organisationId,
            userId: userId,
        })
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
        if (
            !inviterMembership ||
            !["owner", "admin"].includes(inviterMembership.role as string)
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

        // Only owner can add another owner
        if (data.role === "owner" && inviterMembership.role !== "owner") {
            throw new Error("Only owner can assign owner role")
        }

        const member = await Member.create({
            organizationId: organisationId,
            userId: data.userId,
            role: data.role,
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
        newRole: OrganisationRole,
        updatedByUserId: string
    ): Promise<IMember | null> {
        // Check if updater has permission
        const updaterMembership = await this.getMembership(
            organisationId,
            updatedByUserId
        )
        if (!updaterMembership || updaterMembership.role !== "owner") {
            throw new Error("Only owner can change member roles")
        }

        const member = await Member.findOneAndUpdate(
            { _id: memberId, organizationId: organisationId },
            { $set: { role: newRole } },
            { new: true }
        )

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
        if (memberToRemove.role === "owner") {
            throw new Error("Cannot remove organisation owner")
        }

        // Check if remover has permission
        const removerMembership = await this.getMembership(
            organisationId,
            removedByUserId
        )
        if (
            !removerMembership ||
            !["owner", "admin"].includes(removerMembership.role as string)
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
        if (membership.role === "owner") {
            // Check if there are other owners
            const owners = await Member.find({
                organizationId: organisationId,
                role: "owner",
            })
            if (owners.length === 1) {
                throw new Error(
                    "You are the only owner. Transfer ownership before leaving."
                )
            }
        }

        await Member.findByIdAndDelete(membership._id)
    }
}

export const organisationService = new OrganisationService()
