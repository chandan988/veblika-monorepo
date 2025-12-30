import { Router } from "express"
import { roleController } from "../controllers/role-controller"
import { validate } from "../../middleware/validator"
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
  organisationIdParamSchema,
  assignRoleSchema,
  updateMemberPermissionsSchema,
} from "../validators/role-validator"
import isAuth from "../../middleware/authenticate"
import {
  loadMemberAbility,
  authorize,
} from "../../middleware/authorize"

const router: Router = Router({ mergeParams: true })

// All routes require authentication and organisation membership
router.use(isAuth)
router.use(loadMemberAbility)

// ========================================
// Role Routes
// ========================================

/**
 * @route   GET /api/v1/organisations/:organisationId/roles
 * @desc    Get all roles for an organisation
 * @access  Private (members with role:view)
 */
router.get(
  "/",
  validate(organisationIdParamSchema),
  authorize.viewRoles,
  roleController.getRoles
)

/**
 * @route   GET /api/v1/organisations/:organisationId/roles/permissions
 * @desc    Get all available permissions
 * @access  Private (members with role:view)
 */
router.get(
  "/permissions",
  validate(organisationIdParamSchema),
  authorize.viewRoles,
  roleController.getAvailablePermissions
)

/**
 * @route   GET /api/v1/organisations/:organisationId/roles/me
 * @desc    Get current user's permissions in organisation
 * @access  Private (any member)
 */
router.get(
  "/me",
  validate(organisationIdParamSchema),
  roleController.getMyPermissions
)

/**
 * @route   GET /api/v1/organisations/:organisationId/roles/:roleId
 * @desc    Get a single role by ID
 * @access  Private (members with role:view)
 */
router.get(
  "/:roleId",
  validate(roleIdSchema),
  authorize.viewRoles,
  roleController.getRoleById
)

/**
 * @route   POST /api/v1/organisations/:organisationId/roles
 * @desc    Create a new role
 * @access  Private (members with role:create)
 */
router.post(
  "/",
  validate(createRoleSchema),
  authorize.createRole,
  roleController.createRole
)

/**
 * @route   PUT /api/v1/organisations/:organisationId/roles/:roleId
 * @desc    Update a role
 * @access  Private (members with role:edit)
 */
router.put(
  "/:roleId",
  validate(updateRoleSchema),
  authorize.editRole,
  roleController.updateRole
)

/**
 * @route   DELETE /api/v1/organisations/:organisationId/roles/:roleId
 * @desc    Delete a role
 * @access  Private (members with role:delete)
 */
router.delete(
  "/:roleId",
  validate(roleIdSchema),
  authorize.deleteRole,
  roleController.deleteRole
)

/**
 * @route   POST /api/v1/organisations/:organisationId/roles/assign
 * @desc    Assign a role to a member
 * @access  Private (members with role:assign)
 */
router.post(
  "/assign",
  validate(assignRoleSchema),
  authorize.assignRole,
  roleController.assignRole
)

/**
 * @route   PUT /api/v1/organisations/:organisationId/members/:memberId/permissions
 * @desc    Update member's extra permissions
 * @access  Private (members with member:edit)
 */
router.put(
  "/members/:memberId/permissions",
  validate(updateMemberPermissionsSchema),
  authorize.editMember,
  roleController.updateMemberPermissions
)

export default router
