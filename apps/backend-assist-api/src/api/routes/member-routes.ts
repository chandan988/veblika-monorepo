import { Router, IRouter } from "express"
import { memberController } from "../controllers/member-controller"
import { validate } from "../../middleware/validator"
import { loadMemberAbility, checkPermission } from "../../middleware/authorize"
import {
  orgIdParamSchema,
  memberIdParamSchema,
  updateMemberRoleSchema,
  updateMemberPermissionsSchema,
} from "../validators/member-validator"

const router: IRouter = Router({ mergeParams: true })

// All routes require authentication and member ability loading
router.use(loadMemberAbility)

/**
 * @route   GET /api/v1/organisations/:orgId/members
 * @desc    Get all members of an organisation
 * @access  Private (members with member:view)
 */
router.get(
  "/",
  validate(orgIdParamSchema),
  checkPermission("view", "Member"),
  memberController.getMembers
)

/**
 * @route   GET /api/v1/organisations/:orgId/members/count
 * @desc    Get member count for an organisation
 * @access  Private (members with member:view)
 */
router.get(
  "/count",
  validate(orgIdParamSchema),
  checkPermission("view", "Member"),
  memberController.getMemberCount
)

/**
 * @route   GET /api/v1/organisations/:orgId/members/:memberId
 * @desc    Get a single member by ID
 * @access  Private (members with member:view)
 */
router.get(
  "/:memberId",
  validate(memberIdParamSchema),
  checkPermission("view", "Member"),
  memberController.getMemberById
)

/**
 * @route   PUT /api/v1/organisations/:orgId/members/:memberId/role
 * @desc    Update a member's role
 * @access  Private (members with role:assign)
 */
router.put(
  "/:memberId/role",
  validate(updateMemberRoleSchema),
  checkPermission("assign", "Role"),
  memberController.updateMemberRole
)

/**
 * @route   PUT /api/v1/organisations/:orgId/members/:memberId/permissions
 * @desc    Update a member's extra permissions
 * @access  Private (members with member:edit)
 */
router.put(
  "/:memberId/permissions",
  validate(updateMemberPermissionsSchema),
  checkPermission("edit", "Member"),
  memberController.updateMemberPermissions
)

/**
 * @route   DELETE /api/v1/organisations/:orgId/members/:memberId
 * @desc    Remove a member from the organisation
 * @access  Private (members with member:remove)
 */
router.delete(
  "/:memberId",
  validate(memberIdParamSchema),
  checkPermission("remove", "Member"),
  memberController.removeMember
)

export default router
