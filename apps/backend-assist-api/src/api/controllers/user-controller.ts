import { Request, Response, NextFunction } from "express"
import { User } from "../models/user-model"
import { logger } from "../../config/logger"

export const getUserByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.query

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            })
        }

        const user = await User.findOne({ email: email as string })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        return res.status(200).json({
            success: true,
            data: user,
        })
    } catch (error) {
        logger.error("Error getting user by email:", error)
        next(error)
    }
}
