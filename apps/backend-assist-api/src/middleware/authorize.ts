import { Request, Response, NextFunction } from "express"
import { ForbiddenError } from "@casl/ability"
import { Member, IMemberPopulated } from "../api/models/member-model"
import { AppAbility, defineAbilityFor, MemberWithRole, Actions, Subjects } from "../permissions/ability"

// Extend Express Request interface
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      ability?: AppAbility
      member?: IMemberPopulated
      orgId?: string
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Middleware to load member and build CASL ability for the current organisation context
 * Must be used after authentication middleware and with organisation ID in params/body/query
 */
export const loadMemberAbility = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" })
      return
    }

    // Get organisation ID from various sources
    const orgId =
      req.params.orgId ||
      req.params.orgId ||
      req.params.id ||
      req.body.orgId ||
      req.query.orgId ||
      req.headers["x-organisation-id"]

    if (!orgId || typeof orgId !== "string") {
      res.status(400).json({
        success: false,
        error: "Organisation ID is required",
      })
      return
    }

    // Load member with populated role
    const member = await Member.findOne({
      orgId: orgId,
      userId: userId,
    }).populate<{ roleId: IMemberPopulated["roleId"] }>("roleId", "name slug permissions isDefault isSystem")

    if (!member) {
      res.status(403).json({
        success: false,
        error: "You are not a member of this organisation",
      })
      return
    }

    // Build ability
    const memberWithRole: MemberWithRole = {
      ...(member.toObject() as unknown as MemberWithRole),
      isOwner: member.isOwner,
      extraPermissions: member.extraPermissions,
    }

    const ability = defineAbilityFor(memberWithRole, orgId)

    // Attach to request
    req.ability = ability
    req.member = member as unknown as IMemberPopulated
    req.orgId = orgId

    next()
  } catch (error) {
    console.error("Error loading member ability:", error)
    res.status(500).json({ success: false, error: "Authorization failed" })
  }
}

/**
 * Check if user has a specific permission
 * Use after loadMemberAbility middleware
 */
export const checkPermission = (
  action: Actions,
  subject: Subjects
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.ability) {
        res.status(500).json({
          success: false,
          error: "Ability not loaded. Use loadMemberAbility middleware first.",
        })
        return
      }

      // Check if user can perform the action
      if (req.ability.can(action, subject)) {
        next()
        return
      }

      const subjectName = typeof subject === "string" ? subject.toLowerCase() : "resource"
      res.status(403).json({
        success: false,
        error: `You don't have permission to ${action} ${subjectName}`,
      })
    } catch (error) {
      if (error instanceof ForbiddenError) {
        res.status(403).json({
          success: false,
          error: error.message,
        })
        return
      }
      console.error("Permission check error:", error)
      res.status(500).json({ success: false, error: "Permission check failed" })
    }
  }
}

/**
 * Check if user has ANY of the specified permissions
 */
export const checkAnyPermission = (
  permissions: Array<{ action: Actions; subject: Subjects }>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.ability) {
        res.status(500).json({
          success: false,
          error: "Ability not loaded. Use loadMemberAbility middleware first.",
        })
        return
      }

      const hasPermission = permissions.some(({ action, subject }) =>
        req.ability!.can(action, subject)
      )

      if (hasPermission) {
        next()
        return
      }

      res.status(403).json({
        success: false,
        error: "You don't have permission to perform this action",
      })
    } catch (error) {
      console.error("Permission check error:", error)
      res.status(500).json({ success: false, error: "Permission check failed" })
    }
  }
}

/**
 * Check if user has ALL of the specified permissions
 */
export const checkAllPermissions = (
  permissions: Array<{ action: Actions; subject: Subjects }>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.ability) {
        res.status(500).json({
          success: false,
          error: "Ability not loaded. Use loadMemberAbility middleware first.",
        })
        return
      }

      const hasAllPermissions = permissions.every(({ action, subject }) =>
        req.ability!.can(action, subject)
      )

      if (hasAllPermissions) {
        next()
        return
      }

      res.status(403).json({
        success: false,
        error: "You don't have all required permissions to perform this action",
      })
    } catch (error) {
      console.error("Permission check error:", error)
      res.status(500).json({ success: false, error: "Permission check failed" })
    }
  }
}

/**
 * Require user to be owner of the organisation
 */
export const requireOwner = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.member) {
    res.status(500).json({
      success: false,
      error: "Member not loaded. Use loadMemberAbility middleware first.",
    })
    return
  }

  if (req.member.isOwner) {
    next()
    return
  }

  res.status(403).json({
    success: false,
    error: "Only the organisation owner can perform this action",
  })
}

/**
 * Helper to create permission check for common patterns
 */
export const authorize = {
  // Ticket permissions
  viewTickets: checkPermission("view", "Ticket"),
  createTicket: checkPermission("create", "Ticket"),
  editTicket: checkPermission("edit", "Ticket"),
  deleteTicket: checkPermission("delete", "Ticket"),
  assignTicket: checkPermission("assign", "Ticket"),
  closeTicket: checkPermission("close", "Ticket"),

  // Chat permissions
  viewChats: checkPermission("view", "Chat"),
  replyChat: checkPermission("reply", "Chat"),
  assignChat: checkPermission("assign", "Chat"),
  closeChat: checkPermission("close", "Chat"),
  deleteChat: checkPermission("delete", "Chat"),

  // Contact permissions
  viewContacts: checkPermission("view", "Contact"),
  createContact: checkPermission("create", "Contact"),
  editContact: checkPermission("edit", "Contact"),
  deleteContact: checkPermission("delete", "Contact"),
  exportContacts: checkPermission("export", "Contact"),

  // Member permissions
  viewMembers: checkPermission("view", "Member"),
  addMember: checkPermission("add", "Member"),
  editMember: checkPermission("edit", "Member"),
  removeMember: checkPermission("remove", "Member"),

  // Role permissions
  viewRoles: checkPermission("view", "Role"),
  createRole: checkPermission("create", "Role"),
  editRole: checkPermission("edit", "Role"),
  deleteRole: checkPermission("delete", "Role"),
  assignRole: checkPermission("assign", "Role"),

  // Organisation permissions
  viewOrganisation: checkPermission("view", "Organisation"),
  editOrganisation: checkPermission("edit", "Organisation"),
  deleteOrganisation: checkPermission("delete", "Organisation"),
  manageBilling: checkPermission("billing", "Organisation"),

  // Integration permissions
  viewIntegrations: checkPermission("view", "Integration"),
  createIntegration: checkPermission("create", "Integration"),
  editIntegration: checkPermission("edit", "Integration"),
  deleteIntegration: checkPermission("delete", "Integration"),

  // Report permissions
  viewReports: checkPermission("view", "Report"),
  exportReports: checkPermission("export", "Report"),

  // Widget permissions
  viewWidget: checkPermission("view", "Widget"),
  editWidget: checkPermission("edit", "Widget"),
}
