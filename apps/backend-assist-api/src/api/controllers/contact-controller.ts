import { Request, Response, NextFunction } from "express"
import { Contact } from "../models/contact-model"
import { logger } from "../../config/logger"

export const contactController = {
  /**
   * Get all contacts for an organization
   */
  getContacts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, page = 1, limit = 50, search } = req.query

      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: "orgId is required",
        })
      }

      const query: any = { orgId }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ]
      }

      const skip = (Number(page) - 1) * Number(limit)

      const [contacts, total] = await Promise.all([
        Contact.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Contact.countDocuments(query),
      ])

      res.status(200).json({
        success: true,
        data: contacts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      })
    } catch (error) {
      logger.error("Error fetching contacts:", error)
      next(error)
    }
  },
}
