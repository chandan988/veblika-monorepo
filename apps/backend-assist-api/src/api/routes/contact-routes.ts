import { Router } from "express";
import { contactController } from "../controllers/contact-controller";
import isAuth from "../../middleware/authenticate";
import { loadMemberAbility } from "../../middleware/authorize";

const router: Router = Router({ mergeParams: true });

// All routes require authentication and organisation membership
router.use(isAuth, loadMemberAbility);

/**
 * @route   GET /api/v1/organisations/:orgId/contacts
 * @desc    Get all contacts
 * @access  Private (org members)
 * @query   ?page=1&limit=50&search=xxx
 */
router.get("/", contactController.getContacts);

/**
 * @route   POST /api/v1/organisations/:orgId/contacts
 * @desc    Create a new contact
 * @access  Private (org members)
 * @body    { name, email, phone, slackId, whatsappId, source }
 */
router.post("/", contactController.createContact);

/**
 * @route   GET /api/v1/organisations/:orgId/contacts/:id
 * @desc    Get a single contact by ID
 * @access  Private (org members)
 */
router.get("/:id", contactController.getContactById);

/**
 * @route   PUT /api/v1/organisations/:orgId/contacts/:id
 * @desc    Update a contact
 * @access  Private (org members)
 * @body    { name, email, phone, slackId, whatsappId, source }
 */
router.put("/:id", contactController.updateContact);

/**
 * @route   DELETE /api/v1/organisations/:orgId/contacts/:id
 * @desc    Delete a contact
 * @access  Private (org members)
 */
router.delete("/:id", contactController.deleteContact);

export default router;
