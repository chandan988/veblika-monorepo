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

  /**
   * Create a new contact
   */
  createContact: async (req: Request, res: Response, next: NextFunction) => {
    try {

      const { orgId, name, email, phone, slackId, whatsappId, source } = req.body;

      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: "orgId is required",
        })
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "email is required",
        })
      }

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "phone is required",
        })
      }

      const existingContact = await Contact.findOne({ orgId, email })
      if (existingContact) {
        return res.status(409).json({
          success: false,
          message: "A contact with this email already exists in your organization",
        })
      }

      const contact = await Contact.create({
        orgId,
        name: name?.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        slackId: slackId?.trim(),
        whatsappId: whatsappId?.trim(),
        source: source?.trim(),
      })

      logger.info(`Contact created: ${contact._id} for org: ${orgId}`)

      res.status(201).json({
        success: true,
        data: contact,
        message: "Contact created successfully",
      })
    } catch (error: any) {
      logger.error("Error creating contact:", error)

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A contact with this email already exists",
        })
      }

      next(error)
    }
  },

  /**
   * Update a contact
   */
  updateContact: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { name, email, phone, slackId, whatsappId, source } = req.body

      const contact = await Contact.findById(id)
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Contact not found",
        })
      }

      if (name !== undefined) contact.name = name.trim()
      if (email !== undefined) contact.email = email.toLowerCase().trim()
      if (phone !== undefined) contact.phone = phone.trim()
      if (slackId !== undefined) contact.slackId = slackId.trim()
      if (whatsappId !== undefined) contact.whatsappId = whatsappId.trim()
      if (source !== undefined) contact.source = source.trim()

      await contact.save()

      logger.info(`Contact updated: ${contact._id}`)

      res.status(200).json({
        success: true,
        data: contact,
        message: "Contact updated successfully",
      })
    } catch (error: any) {
      logger.error("Error updating contact:", error)

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A contact with this email already exists",
        })
      }

      next(error)
    }
  },

  /**
   * Delete a contact
   */
  deleteContact: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      const contact = await Contact.findByIdAndDelete(id)
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Contact not found",
        })
      }

      logger.info(`Contact deleted: ${id}`)

      res.status(200).json({
        success: true,
        message: "Contact deleted successfully",
      })
    } catch (error) {
      logger.error("Error deleting contact:", error)
      next(error)
    }
  },

  /**
   * Get a single contact by ID
   */
  getContactById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      const contact = await Contact.findById(id)
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Contact not found",
        })
      }

      res.status(200).json({
        success: true,
        data: contact,
      })
    } catch (error) {
      logger.error("Error fetching contact:", error)
      next(error)
    }
  },
}
