import { Router } from "express"
import { organisationController } from "../controllers/organisation-controller"
import { validate } from "../../middleware/validator"
import {
    createOrganisationSchema,
    updateOrganisationSchema,
    orgIdSchema,
    checkSlugSchema,
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
    validate(orgIdSchema),
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
    validate(orgIdSchema.merge(updateOrganisationSchema)),
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
    validate(orgIdSchema),
    organisationController.deleteOrganisation
)

export default router
