import { Router, IRouter } from "express"
import { invitationController } from "../controllers/invitation-controller"
import { validate } from "../../middleware/validator"
import { loadMemberAbility, checkPermission } from "../../middleware/authorize"
import isAuth from "../../middleware/authenticate"
import {
  createInvitationSchema,
  invitationIdParamSchema,
  organisationInvitationParamSchema,
  acceptInvitationSchema,
} from "../validators/invitation-validator"
import { orgIdParamSchema } from "../validators/member-validator"

const router: IRouter = Router({ mergeParams: true })

// Organization-scoped routes (require authentication and member ability)
const orgRouter: IRouter = Router({ mergeParams: true })
orgRouter.use(isAuth)
orgRouter.use(loadMemberAbility)

/**
 * @route   POST /api/v1/organisations/:orgId/invitations
 * @desc    Create a new invitation
 * @access  Private (members with member:add permission)
 */
orgRouter.post(
  "/",
  validate(createInvitationSchema),
  checkPermission("add", "Member"),
  invitationController.createInvitation
)

/**
 * @route   GET /api/v1/organisations/:orgId/invitations
 * @desc    Get all invitations for an organisation
 * @access  Private (members with member:view permission)
 */
orgRouter.get(
  "/",
  validate(orgIdParamSchema),
  checkPermission("view", "Member"),
  invitationController.getInvitations
)

/**
 * @route   DELETE /api/v1/organisations/:orgId/invitations/:invitationId
 * @desc    Cancel an invitation
 * @access  Private (members with member:add permission)
 */
orgRouter.delete(
  "/:invitationId",
  validate(organisationInvitationParamSchema),
  checkPermission("add", "Member"),
  invitationController.cancelInvitation
)

// Public/authenticated routes (not organization-scoped)
/**
 * @route   GET /api/v1/invitations/:invitationId
 * @desc    Get invitation details (public for validation)
 * @access  Public
 */
router.get(
  "/:invitationId",
  validate(invitationIdParamSchema),
  invitationController.getInvitationById
)

/**
 * @route   POST /api/v1/invitations/:invitationId/accept
 * @desc    Accept an invitation
 * @access  Private (authenticated users)
 */
router.post(
  "/:invitationId/accept",
  isAuth,
  validate(acceptInvitationSchema),
  invitationController.acceptInvitation
)

export { router as invitationPublicRouter, orgRouter as invitationOrgRouter }
