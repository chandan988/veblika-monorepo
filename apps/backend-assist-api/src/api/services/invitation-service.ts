import mongoose from "mongoose"
import { Invitation, IInvitation } from "../models/invitation-model"
import { Member } from "../models/member-model"
import { Organization } from "../models/organization-model"
import { Role } from "../models/role-model"
import { emailService } from "../../services/email"
import { invitationEmailHtml } from "../../services/email/templates/invitation-email"
import { config } from "../../config"
import { checkUserByEmail, fetchUserById } from "../../utils/auth-service"

export interface CreateInvitationInput {
  email: string
  orgId: string
  roleId: string
  invitedBy: string // memberId
}

export class InvitationService {
  /**
   * Create a new invitation
   */
  async createInvitation(
    input: CreateInvitationInput,
    inviterName: string
  ): Promise<IInvitation> {
    const { email, orgId, roleId, invitedBy } = input

    // Validate organization exists
    const organization = await Organization.findById(orgId)
    if (!organization) {
      throw new Error("Organization not found")
    }

    // Validate role exists and belongs to organization
    const role = await Role.findOne({
      _id: roleId,
      orgId: orgId,
    })
    if (!role) {
      throw new Error("Role not found")
    }

    // Check if user already exists in organization using email lookup
    // First, we need to check in the auth service if user exists
    const checkResult = await checkUserByEmail(email)
    const userExists = checkResult.exists
    const userId = checkResult.userId

    // If user exists, check if they're already a member
    if (userId) {
      const existingMember = await Member.findOne({
        orgId: new mongoose.Types.ObjectId(orgId),
        userId: new mongoose.Types.ObjectId(userId),
      })

      if (existingMember) {
        throw new Error("User already exists in this organization")
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      orgId: new mongoose.Types.ObjectId(orgId),
      status: "pending",
    })

    if (existingInvitation) {
      throw new Error("An invitation has already been sent to this email")
    }

    // Create invitation with 7-day expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      orgId: new mongoose.Types.ObjectId(orgId),
      roleId,
      invitedBy: new mongoose.Types.ObjectId(invitedBy),
      status: "pending",
      userExists,
      expiresAt,
    })

    // Send invitation email
    const invitationUrl = `${config.client.url}/accept-invite?id=${invitation._id}`

    try {
      const emailResult = await emailService.sendEmail({
        to: email,
        subject: `You've been invited to join ${organization.name}`,
        html: invitationEmailHtml(
          invitationUrl,
          organization.name,
          inviterName,
          role.name
        ),
      })

      if (!emailResult.success) {
        throw new Error("Failed to send invitation email")
      }
    } catch (error) {
      console.error("Failed to send invitation email:", error)
      // Delete the invitation if email fails
      await Invitation.deleteOne({ _id: invitation._id })
      throw new Error("Failed to send invitation email")
    }

    return invitation
  }

  /**
   * Get invitation by ID with full details
   */
  async getInvitationById(invitationId: string): Promise<IInvitation | null> {
    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
      return null
    }

    const invitations = await Invitation.findOne({ _id: invitationId })
      .populate("orgId", "_id name slug logo")
      .populate("roleId", "_id name slug")
      .populate({
        path: "invitedBy",
        select: "_id userId metadata",
      })

    return invitations
  }

  /**
   * Get all invitations for an organization
   */
  async getInvitationsByOrganization(orgId: string): Promise<IInvitation[]> {
    const invitations = await Invitation.find({
      orgId: new mongoose.Types.ObjectId(orgId),
    })
      .populate("orgId", "_id name slug logo")
      .populate("roleId", "_id name slug")
      .sort({ createdAt: -1 })

    return invitations
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<{ success: boolean; orgId: string }> {
    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
      throw new Error("Invalid invitation ID")
    }

    const invitation = await Invitation.findById(invitationId)

    if (!invitation) {
      throw new Error("Invitation not found")
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been processed")
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired"
      await invitation.save()
      throw new Error("Invitation has expired")
    }

    // Check if user is already a member
    const existingMember = await Member.findOne({
      orgId: invitation.orgId,
      userId: new mongoose.Types.ObjectId(userId),
    })

    if (existingMember) {
      throw new Error("You are already a member of this organization")
    }

    // Fetch user info from auth service to store in metadata
    const userInfo = await fetchUserById(userId)

    // Create member record with user metadata
    await Member.create({
      orgId: invitation.orgId,
      userId: new mongoose.Types.ObjectId(userId),
      roleId: new mongoose.Types.ObjectId(invitation.roleId),
      isOwner: false,
      extraPermissions: [],
      invitedBy: invitation.invitedBy.toString(),
      metadata: userInfo
        ? {
            name: userInfo.name,
            email: userInfo.email,
            image: userInfo.image,
          }
        : undefined,
    })

    // Update invitation status
    invitation.status = "accepted"
    invitation.acceptedAt = new Date()
    await invitation.save()

    return {
      success: true,
      orgId: invitation.orgId.toString(),
    }
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string, orgId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
      throw new Error("Invalid invitation ID")
    }

    const invitation = await Invitation.findOne({
      _id: invitationId,
      orgId: new mongoose.Types.ObjectId(orgId),
    })

    if (!invitation) {
      throw new Error("Invitation not found")
    }

    if (invitation.status !== "pending") {
      throw new Error("Can only cancel pending invitations")
    }

    await Invitation.deleteOne({ _id: invitationId })
  }

  /**
   * Validate invitation (for public access)
   */
  async validateInvitation(invitationId: string): Promise<{
    valid: boolean
    invitation?: IInvitation
    error?: string
  }> {
    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
      return { valid: false, error: "Invalid invitation ID" }
    }

    const invitation = await this.getInvitationById(invitationId)

    if (!invitation) {
      return { valid: false, error: "Invitation not found" }
    }

    if (invitation.status !== "pending") {
      return { valid: false, error: "Invitation has already been processed" }
    }

    if (new Date() > invitation.expiresAt) {
      // Update status to expired
      await Invitation.updateOne({ _id: invitationId }, { status: "expired" })
      return { valid: false, error: "Invitation has expired" }
    }

    return { valid: true, invitation }
  }
}

export const invitationService = new InvitationService()
