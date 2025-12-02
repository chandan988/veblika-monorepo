import { Router } from "express";
import { contactController } from "../controllers/contact-controller";
import isAuth from "../../middleware/authenticate";

const router: Router = Router();

/**
 * @route   GET /api/v1/contacts
 * @desc    Get all contacts
 * @access  Private
 * @query   ?orgId=xxx&page=1&limit=50&search=xxx
 */
router.get("/", isAuth, contactController.getContacts);

/**
 * @route   POST /api/v1/contacts
 * @desc    Create a new contact
 * @access  Private
 * @body    { orgId, name, email, phone, slackId, whatsappId, source }
 */
router.post("/", isAuth, contactController.createContact);

/**
 * @route   GET /api/v1/contacts/:id
 * @desc    Get a single contact by ID
 * @access  Private
 */
router.get("/:id", isAuth, contactController.getContactById);

/**
 * @route   PUT /api/v1/contacts/:id
 * @desc    Update a contact
 * @access  Private
 * @body    { name, email, phone, slackId, whatsappId, source }
 */
router.put("/:id", isAuth, contactController.updateContact);

/**
 * @route   DELETE /api/v1/contacts/:id
 * @desc    Delete a contact
 * @access  Private
 */
router.delete("/:id", isAuth, contactController.deleteContact);

export default router;
