import { Router } from "express"
import { getUserByEmail } from "../controllers/user-controller"

const router: Router = Router()

router.get("/by-email", getUserByEmail)

export default router
