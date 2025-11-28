import { Router } from "express"
import { contactController } from "../controllers/contact-controller"
import isAuth from "../../middleware/authenticate"

const router: Router = Router()

/**
 * @route   GET /api/v1/contacts
 * @desc    Get all contacts
 * @access  Private
 * @query   ?orgId=xxx&page=1&limit=50&search=xxx
 */
router.get("/", isAuth, contactController.getContacts)

export default router
