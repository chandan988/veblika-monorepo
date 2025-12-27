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
      const { orgId, name, email, phone, source } = req.body

      // Validate required fields
      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: "Organization ID is required",
        })
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        })
      }

      if (!phone || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required",
        })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const trimmedEmail = email.toLowerCase().trim()
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        })
      }

      // Validate phone format (basic validation)
      const trimmedPhone = phone.trim()
      if (trimmedPhone.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be at least 10 characters",
        })
      }

      // Validate source if provided
      const validSources = ["gmail", "webchat"]
      if (source && !validSources.includes(source.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid source. Valid sources are: gmail, webchat",
        })
      }

      // Check for existing contact
      const existingContact = await Contact.findOne({ orgId, email: trimmedEmail })
      if (existingContact) {
        return res.status(409).json({
          success: false,
          message: "A contact with this email already exists in your organization",
        })
      }

      // Create contact
      const contact = await Contact.create({
        orgId,
        name: name?.trim() || "",
        email: trimmedEmail,
        phone: trimmedPhone,
        source: source?.toLowerCase().trim() || "",
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
      const { name, email, phone, source } = req.body

      const contact = await Contact.findById(id)
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Contact not found",
        })
      }

      // Validate email format if provided
      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const trimmedEmail = email.toLowerCase().trim()
        
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format",
          })
        }

        // Check if email is already used by another contact in the same org
        const existingContact = await Contact.findOne({ 
          orgId: contact.orgId, 
          email: trimmedEmail,
          _id: { $ne: id }
        })
        
        if (existingContact) {
          return res.status(409).json({
            success: false,
            message: "A contact with this email already exists in your organization",
          })
        }
        
        contact.email = trimmedEmail
      }

      // Validate phone if provided
      if (phone !== undefined) {
        const trimmedPhone = phone.trim()
        if (trimmedPhone.length < 10) {
          return res.status(400).json({
            success: false,
            message: "Phone number must be at least 10 characters",
          })
        }
        contact.phone = trimmedPhone
      }

      // Validate source if provided
      if (source !== undefined) {
        const validSources = ["gmail", "webchat"]
        if (source && !validSources.includes(source.toLowerCase())) {
          return res.status(400).json({
            success: false,
            message: "Invalid source. Valid sources are: gmail, webchat",
          })
        }
        contact.source = source.toLowerCase().trim()
      }

      if (name !== undefined) contact.name = name.trim()

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
