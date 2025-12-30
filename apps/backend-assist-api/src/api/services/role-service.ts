import mongoose from "mongoose"
import { Role, IRole } from "../models/role-model"
import { Member } from "../models/member-model"
import { getDefaultRolesConfig, getAllPermissions } from "../../permissions/ability"

export interface CreateRoleInput {
  name: string
  description?: string
  permissions: string[]
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissions?: string[]
}

export class RoleService {
  /**
   * Seed default roles for a new organisation
   */
  async seedDefaultRoles(organisationId: string, createdBy?: string): Promise<IRole[]> {
    const defaultRoles = getDefaultRolesConfig()
    const roles: IRole[] = []

    for (const [slug, config] of Object.entries(defaultRoles)) {
      const role = await Role.create({
        organisationId,
        name: config.name,
        slug,
        description: config.description,
        permissions: config.permissions,
        isDefault: config.isDefault,
        isSystem: config.isSystem,
        createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
      })
      roles.push(role)
    }

    return roles
  }

  /**
   * Get all roles for an organisation
   */
  async getRolesByOrganisation(organisationId: string): Promise<IRole[]> {
    return Role.find({ organisationId }).sort({ isDefault: -1, name: 1 })
  }

  /**
   * Get a role by ID
   */
  async getRoleById(roleId: string, organisationId: string): Promise<IRole | null> {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new Error("Invalid role ID")
    }

    return Role.findOne({
      _id: roleId,
      organisationId,
    })
  }

  /**
   * Get a role by slug within an organisation
   */
  async getRoleBySlug(slug: string, organisationId: string): Promise<IRole | null> {
    return Role.findOne({
      slug,
      organisationId,
    })
  }

  /**
   * Get the Owner role for an organisation
   */
  async getOwnerRole(organisationId: string): Promise<IRole | null> {
    return Role.findOne({
      slug: "owner",
      organisationId,
    })
  }

  /**
   * Create a custom role
   */
  async createRole(
    organisationId: string,
    data: CreateRoleInput,
    createdBy: string
  ): Promise<IRole> {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    // Check if slug already exists
    const existingRole = await Role.findOne({ organisationId, slug })
    if (existingRole) {
      throw new Error("A role with this name already exists")
    }

    // Validate permissions
    const allPermissions = getAllPermissions()
    const invalidPermissions = data.permissions.filter(
      (p) => !allPermissions.includes(p)
    )
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(", ")}`)
    }

    const role = await Role.create({
      organisationId,
      name: data.name,
      slug,
      description: data.description,
      permissions: data.permissions,
      isDefault: false,
      isSystem: false,
      createdBy,
    })

    return role
  }

  /**
   * Update a role
   */
  async updateRole(
    roleId: string,
    organisationId: string,
    data: UpdateRoleInput
  ): Promise<IRole | null> {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new Error("Invalid role ID")
    }

    const role = await Role.findOne({ _id: roleId, organisationId })
    if (!role) {
      throw new Error("Role not found")
    }

    // Prevent editing system roles' core properties
    if (role.isSystem && (data.name || data.permissions)) {
      // Allow editing permissions on system roles except owner
      if (role.slug === "owner") {
        throw new Error("Cannot modify the Owner role")
      }
    }

    // Validate permissions if being updated
    if (data.permissions) {
      const allPermissions = getAllPermissions()
      const invalidPermissions = data.permissions.filter(
        (p) => !allPermissions.includes(p)
      )
      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(", ")}`)
      }
    }

    // Build update object
    const updateData: UpdateRoleInput & { slug?: string } = { ...data }
    
    // Update slug if name is changed (only for non-system roles)
    if (data.name && !role.isSystem) {
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      // Check if new slug already exists
      const existingRole = await Role.findOne({
        organisationId,
        slug: updateData.slug,
        _id: { $ne: roleId },
      })
      if (existingRole) {
        throw new Error("A role with this name already exists")
      }
    }

    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    return updatedRole
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string, organisationId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new Error("Invalid role ID")
    }

    const role = await Role.findOne({ _id: roleId, organisationId })
    if (!role) {
      throw new Error("Role not found")
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      throw new Error("Cannot delete system roles")
    }

    // Check if any members are using this role
    const membersUsingRole = await Member.countDocuments({
      organizationId: organisationId,
      roleId: roleId,
    })

    if (membersUsingRole > 0) {
      throw new Error(
        `Cannot delete role. ${membersUsingRole} member(s) are using this role. Please reassign them first.`
      )
    }

    await Role.findByIdAndDelete(roleId)
  }

  /**
   * Get all available permissions
   */
  getAvailablePermissions(): string[] {
    return getAllPermissions()
  }

  /**
   * Check if a role can be assigned to a member
   * (Prevents assigning owner role to non-owners)
   */
  async canAssignRole(
    roleId: string,
    organisationId: string,
    assignerIsOwner: boolean
  ): Promise<{ canAssign: boolean; reason?: string }> {
    const role = await this.getRoleById(roleId, organisationId)
    if (!role) {
      return { canAssign: false, reason: "Role not found" }
    }

    // Only owners can assign the owner role
    if (role.slug === "owner" && !assignerIsOwner) {
      return { canAssign: false, reason: "Only owners can assign the Owner role" }
    }

    return { canAssign: true }
  }
}

export const roleService = new RoleService()
