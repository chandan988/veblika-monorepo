import { Router } from "express"
import { organisationController } from "../controllers/organisation-controller"
import { validate } from "../../middleware/validator"
import {
    createOrganisationSchema,
    updateOrganisationSchema,
    organisationIdSchema,
    checkSlugSchema,
    addMemberSchema,
    updateMemberRoleSchema,
    removeMemberSchema,
} from "../validators/organisation-validator"
import isAuth from "../../middleware/authenticate"

const router: Router = Router()

// ========================================
// Organisation Routes
// ========================================

/**
 * @route   POST /api/v1/organisations
 * @desc    Create a new organisation
 * @access  Private
 */
router.post(
    "/",
    isAuth,
    validate(createOrganisationSchema),
    organisationController.createOrganisation
)

/**
 * @route   GET /api/v1/organisations
 * @desc    Get all organisations for current user
 * @access  Private
 */
router.get("/", isAuth, organisationController.getUserOrganisations)

/**
 * @route   GET /api/v1/organisations/check-slug
 * @desc    Check if organisation slug is available
 * @access  Private
 */
router.get(
    "/check-slug",
    isAuth,
    validate(checkSlugSchema),
    organisationController.checkSlug
)

/**
 * @route   GET /api/v1/organisations/:id
 * @desc    Get organisation by ID
 * @access  Private (member only)
 */
router.get(
    "/:id",
    isAuth,
    validate(organisationIdSchema),
    organisationController.getOrganisationById
)

/**
 * @route   PUT /api/v1/organisations/:id
 * @desc    Update organisation
 * @access  Private (owner/admin only)
 */
router.put(
    "/:id",
    isAuth,
    validate(organisationIdSchema.merge(updateOrganisationSchema)),
    organisationController.updateOrganisation
)

/**
 * @route   DELETE /api/v1/organisations/:id
 * @desc    Delete organisation
 * @access  Private (owner only)
 */
router.delete(
    "/:id",
    isAuth,
    validate(organisationIdSchema),
    organisationController.deleteOrganisation
)

// ========================================
// Member Routes
// ========================================

/**
 * @route   GET /api/v1/organisations/:id/members
 * @desc    Get all members of an organisation
 * @access  Private (member only)
 */
router.get(
    "/:id/members",
    isAuth,
    validate(organisationIdSchema),
    organisationController.getMembers
)

/**
 * @route   POST /api/v1/organisations/:id/members
 * @desc    Add member to organisation
 * @access  Private (owner/admin only)
 */
router.post(
    "/:id/members",
    isAuth,
    validate(addMemberSchema),
    organisationController.addMember
)

/**
 * @route   PUT /api/v1/organisations/:id/members/:memberId
 * @desc    Update member role
 * @access  Private (owner only)
 */
router.put(
    "/:id/members/:memberId",
    isAuth,
    validate(updateMemberRoleSchema),
    organisationController.updateMemberRole
)

/**
 * @route   DELETE /api/v1/organisations/:id/members/:memberId
 * @desc    Remove member from organisation
 * @access  Private (owner/admin only)
 */
router.delete(
    "/:id/members/:memberId",
    isAuth,
    validate(removeMemberSchema),
    organisationController.removeMember
)

/**
 * @route   POST /api/v1/organisations/:id/leave
 * @desc    Leave organisation
 * @access  Private
 */
router.post(
    "/:id/leave",
    isAuth,
    validate(organisationIdSchema),
    organisationController.leaveOrganisation
)

export default router
